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

export async function sendPanicAlertEmail({ to, alertDetails }) {
  const subject = "Panic Alert Notification";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #dc2626; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">🚨 Panic Alert Triggered 🚨</h1>
      </div>
      
      <div style="padding: 30px; background-color: #fff;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          An emergency panic alert has been triggered in your Family Group. Please review the details below immediately.
        </p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
          <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Alert Details</h3>
          <div style="margin-bottom: 10px;">
            <strong style="color: #7f1d1d;">Group Name:</strong> 
            <span style="color: #1f2937;">${alertDetails.groupName || 'Unknown Group'}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #7f1d1d;">Sender:</strong> 
            <span style="color: #1f2937;">${alertDetails.senderName}</span>
          </div>
          <div>
            <strong style="color: #7f1d1d;">Time:</strong> 
            <span style="color: #1f2937;">${alertDetails.triggeredAt}</span>
          </div>
        </div>

        <p style="font-size: 14px; color: #6b7280; font-style: italic;">
          This is an automated message from Care Connect. Please verify the safety of the sender.
        </p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
        <a href="http://localhost:5173" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Care Connect</a>
      </div>
    </div>
  `;

  return await sendMail({ to, subject, html });
}
