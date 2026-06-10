const sendEmail = async (
  to,
  subject,
  html = "",
  text
) => {
  try {
    const plainText =
      text ||
      (html
        ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "");

    const response = await resend.emails.send({
      from: "Askar Stone <onboarding@resend.dev>",
      to,
      subject,
      html,
      text: plainText,
    });

    return response;
  } catch (err) {
    console.error("Send email error:", err);
    throw err;
  }
};
export default sendEmail