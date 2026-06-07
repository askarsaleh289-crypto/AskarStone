import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html, attachments = [], text) => {
  try {
    const formattedAttachments = (attachments || [])
      .map((a) => {
        const data = a.content
          ? (Buffer.isBuffer(a.content)
              ? a.content.toString("base64")
              : Buffer.from(String(a.content)).toString("base64"))
          : undefined;

        return {
          type: a.contentType || a.type || "application/octet-stream",
          filename: a.filename || a.name,
          data,
        };
      })
      .filter(a => a.data);

    const response = await resend.emails.send({
      from: "Askar Stone <onboarding@resend.dev>",
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      attachments: formattedAttachments,
    });

    console.log("Email sent:", response.id);
    return response;
  } catch (err) {
    console.error("Send email error:", err);
    throw err;
  }
};

export default sendEmail;