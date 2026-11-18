import Topheader from "../components/Topheader";
export default function Contact() {
  return (
    <>
    <Topheader/>
    <section className="contactUs">
      <h1>যোগাযোগ</h1>
      <div className="contactMainFlexDisplay">
        <div className="flexOne">
          <h2>যোগাযোগের ফর্ম</h2>
          <form>
      <div className="form-group">
        <label htmlFor="your_name">আপনার নাম:</label>
        <input
          type="text"
          id="your_name"
          name="your_name"
          placeholder="আপনার নাম লিখুন"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="your_email">আপনার ইমেইল:</label>
        <input
          type="email"
          id="your_email"
          name="your_email"
          placeholder="আপনার ইমেইল লিখুন"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject">বিষয়:</label>
        <input
          type="text"
          id="subject"
          name="subject"
          placeholder="বিষয় লিখুন"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">বার্তা:</label>
        <textarea
          id="message"
          name="message"
          rows="4"
          placeholder="আপনার বার্তা লিখুন"
          required
        />
      </div>

      <button type="submit">বার্তা পাঠান</button>
    </form>
        </div>
        <div className="flexTwo">
          <div className="map">
            <h2>আমাদের ঠিকানা</h2>

            <iframe
              width="300"
              height="300"
              id="gmap_canvas"
              src="https://maps.google.com/maps?q=Dhaka%20Bangladesh&t=&z=11&ie=UTF8&iwloc=&output=embed"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              title="ঢাকার মানচিত্র"
            ></iframe>
          </div>
          <div className="contactDetail">
            <h2>যোগাযোগের তথ্য</h2>
            <h3>ঠিকানা</h3>
            <p>ফাউন্ডেশন </p>
            <p>
              প্লট-৬০, রোড-৩, ব্লক-সি, ঢাকা-১২১২
            </p>
            <h3>ফোন</h3>
            <p>63656556565+88-0</p>
            <h3>ইমেইল</h3>
            <p>foundation@gmail.com</p>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
