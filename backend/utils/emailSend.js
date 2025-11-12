import { Resend } from 'resend';
import { isValidEmail } from './validation.utils';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html');
    }
    if (typeof to !== 'string' || typeof subject !== 'string' || typeof html !== 'string') {
      throw new Error('Fields to, subject, and html must be strings');
    }
    if (to.trim() === '' || subject.trim() === '' || html.trim() === '') {
      throw new Error('Fields to, subject, and html cannot be empty');
    }
    if(isValidEmail(to) === false){
      throw new Error('Invalid email address');
    }

    const { data, error } = await resend.emails.send({
      from: 'Care Connect <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      return console.error({ error });
    }

    console.log({ data });
  } catch (err) {
    console.error({ err });
  }
};
//Wrtie a function to send email using resend with otp for password reset
export const sendPasswordResetEmail = async (to, otp) => {
  try {
    if (!to || !otp) {
      throw new Error('Missing required fields: to, otp');
    }
    if (typeof to !== 'string' || typeof otp !== 'string') {
      throw new Error('Fields to and otp must be strings');
    }
    if (to.trim() === '' || otp.trim() === '') {
      throw new Error('Fields to and otp cannot be empty');
    }
    if(isValidEmail(to) === false){
      throw new Error('Invalid email address');
    }

    const subject = 'Password Reset OTP';
    const html = `
      <h1>Password Reset Request</h1>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    `;

    await sendEmail({ to, subject, html });
  } catch (err) {
    console.error({ err });
  }
};
export default sendEmail;