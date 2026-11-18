import { createClient } from "npm:@supabase/supabase-js@2";

const ROOT_ADMIN_EMAIL = "alahsanfoundationbangladesh@gmail.com";
const PAGE_SIZE = 50;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function displayName(metadata: Record<string, unknown> | null | undefined) {
  for (const key of ["full_name", "name", "display_name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 120);
  }
  return "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return respond({ error: "Authentication required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return respond({ error: "Account service is not configured." }, 503);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: { user: actor }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !actor || actor.email?.toLowerCase() !== ROOT_ADMIN_EMAIL || !actor.email_confirmed_at) {
    return respond({ error: "Super Admin access is required." }, 403);
  }

  let body: { action?: unknown; page?: unknown; userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return respond({ error: "A valid JSON request body is required." }, 400);
  }

  if (body.action === "list") {
    const requestedPage = Number(body.page ?? 1);
    if (!Number.isSafeInteger(requestedPage) || requestedPage < 1 || requestedPage > 10000) {
      return respond({ error: "The requested page is invalid." }, 400);
    }

    const { data, error } = await admin.auth.admin.listUsers({ page: requestedPage, perPage: PAGE_SIZE });
    if (error) return respond({ error: "The account directory could not be loaded." }, 502);

    const authUsers = data.users ?? [];
    const emails = authUsers.flatMap((user) => user.email ? [user.email.toLowerCase()] : []);
    const { data: memberships, error: membershipError } = emails.length
      ? await admin.from("admin_memberships").select("email,role,permissions,status").in("email", emails)
      : { data: [], error: null };
    if (membershipError) return respond({ error: "Account roles could not be loaded." }, 502);

    const membershipByEmail = new Map((memberships ?? []).map((membership) => [membership.email.toLowerCase(), membership]));
    const now = Date.now();
    const users = authUsers.map((user) => {
      const membership = user.email ? membershipByEmail.get(user.email.toLowerCase()) : undefined;
      const isSuspended = Boolean(user.banned_until && new Date(user.banned_until).getTime() > now);
      return {
        id: user.id,
        email: user.email ?? "",
        displayName: displayName(user.user_metadata as Record<string, unknown> | undefined),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        emailConfirmed: Boolean(user.email_confirmed_at),
        status: isSuspended ? "suspended" : user.email_confirmed_at ? "active" : "pending",
        role: membership?.role ?? "member",
        permissions: membership?.permissions ?? [],
        adminAccessStatus: membership?.status ?? "none",
      };
    });

    return respond({ users, page: requestedPage, pageSize: PAGE_SIZE, hasMore: authUsers.length === PAGE_SIZE });
  }

  if (body.action !== "suspend" && body.action !== "reactivate") {
    return respond({ error: "The requested action is not supported." }, 400);
  }

  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return respond({ error: "A valid account ID is required." }, 400);
  }

  const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(userId);
  if (targetError || !targetData.user) return respond({ error: "The selected account could not be found." }, 404);
  const target = targetData.user;
  if (target.id === actor.id || target.email?.toLowerCase() === ROOT_ADMIN_EMAIL) {
    return respond({ error: "The designated Super Admin account cannot be suspended or changed here." }, 403);
  }

  const action = body.action;
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: action === "suspend" ? "876000h" : "none",
  });
  if (updateError) return respond({ error: "The account status could not be updated." }, 502);

  const { error: auditError } = await admin.from("admin_activity_logs").insert({
    actor_id: actor.id,
    actor_email: actor.email ?? ROOT_ADMIN_EMAIL,
    action,
    entity_type: "auth_user",
    entity_id: target.id,
    details: { email: target.email ?? "", status: action === "suspend" ? "suspended" : "active" },
  });

  return respond({ success: true, auditRecorded: !auditError });
});
