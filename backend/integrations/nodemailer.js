import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Uncomment to see debugging output in console:
  logger: true,
  debug: true,
});

// Verify connection configuration (optional)
transporter
  .verify()
  .then(() => console.log("SMTP connection successful"))
  .catch((err) => console.error(" SMTP connection error:", err));

export default transporter;

export async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM, // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body (optional)
  });

  console.log("Message sent:", info.messageId);
  return info.messageId;
}
