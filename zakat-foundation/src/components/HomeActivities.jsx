import { Link } from "react-router-dom";
import { settingText } from "../lib/site-settings";

const defaultActivities = [
  {
    title: "দক্ষতা উন্নয়ন ও কর্মসংস্থান",
    description: "আত্মনির্ভরতার পথে এগিয়ে যেতে প্রয়োজনীয় দক্ষতা শেখা ও কাজের সুযোগ তৈরিতে পাশে থাকুন।",
    image: "/images/header.png",
    imageAlt: "দক্ষতা উন্নয়ন প্রশিক্ষণে অংশগ্রহণকারীরা",
  },
  {
    title: "শিক্ষা ও প্রশিক্ষণ সহায়তা",
    description: "শিক্ষা ও প্রশিক্ষণের সুযোগ আরও মানুষের কাছে পৌঁছে দিতে আপনার সহায়তা যুক্ত করুন।",
    image: "/images/ongoing/ima2.png",
    imageAlt: "শিক্ষা ও প্রশিক্ষণের পরিবেশ",
  },
  {
    title: "পরিবেশ সংরক্ষণ ও বৃক্ষরোপণ",
    description: "সবুজ ও বাসযোগ্য পরিবেশ গড়ার উদ্যোগে অংশ নিন, ভবিষ্যৎ প্রজন্মের জন্য।",
    image: "/images/ongoing/ima3.png",
    imageAlt: "বৃক্ষরোপণ কার্যক্রম",
  },
];

export default function HomeActivities({ settings }) {
  const value = (key, fallback) => settingText(settings?.[key], fallback);
  const activities = defaultActivities.map((activity, index) => {
    const number = index + 1;
    return {
      title: value(`home_activity_${number}_title`, activity.title),
      description: value(`home_activity_${number}_description`, activity.description),
      image: value(`home_activity_${number}_image_url`, activity.image) || activity.image,
      imageAlt: value(`home_activity_${number}_image_alt`, activity.imageAlt) || activity.imageAlt,
    };
  });

  return (
    <section className="home-activities" id="activities" aria-labelledby="home-activities-title">
      <div className="home-section-heading">
        <div>
          <p className="home-eyebrow"><span aria-hidden="true" />{value("home_activities_eyebrow", "আমাদের উদ্যোগ")}</p>
          <h2 id="home-activities-title">{value("home_activities_heading", "যেখানে সহায়তা পৌঁছায়, সেখানেই পরিবর্তনের শুরু")}</h2>
        </div>
        <p>{value("home_activities_description", "প্রতিটি উদ্যোগের লক্ষ্য মানুষের মর্যাদা, সক্ষমতা ও কল্যাণকে এগিয়ে নেওয়া।")}</p>
      </div>

      <div className="home-activity-grid">
        {activities.map((activity, index) => (
          <article className="home-activity-card" key={index}>
            <div className="home-activity-image-wrap">
              <img
                src={activity.image}
                alt={activity.imageAlt || activity.title}
                loading="lazy"
                onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
              />
              <span className="home-activity-number">{["০১", "০২", "০৩"][index]}</span>
            </div>
            <div className="home-activity-copy">
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <Link className="home-activity-link" to="/donation">
                {value("home_activity_donate_label", "এই উদ্যোগে সহায়তা করুন")}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
