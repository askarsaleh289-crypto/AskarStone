import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (
  to,
  subject,
  html = "",
  attachments = [],
  text
) => {
  try {
    const formattedAttachments = (attachments || [])
      .map((a) => {
        let data;

        if (Buffer.isBuffer(a.content)) {
          data = a.content.toString("base64");
        } else if (typeof a.content === "string") {
          data = Buffer.from(a.content).toString("base64");
        }

        if (!data) return null;

        return {
          filename: a.filename || a.name,
          type: a.contentType || a.type || "application/octet-stream",
          data,
        };
      })
      .filter(Boolean);

    const plainText =
      text ||
      (html
        ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "");

    const response = await resend.emails.send({
      from: "Askar Stone <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: plainText,
      attachments: formattedAttachments.length
        ? formattedAttachments
        : undefined,
    });

    console.log("Email sent:", response?.data?.id);

    return response;
  } catch (err) {
    console.error("Send email error:", err);
    throw err;
  }
};

export default sendEmail;