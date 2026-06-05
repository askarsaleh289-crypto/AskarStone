import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html, attachments = [], text) => {
  try {
    const response = await resend.emails.send({
      from: "Askar Stone <onboarding@resend.dev>", // لاحقاً domain تبعك
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });

    console.log("Email sent:", response.id);
    return response;
  } catch (err) {
    console.error("Send email error:", err);
    throw err;
  }
};

export default sendEmail;