import nodemailer from "nodemailer";

export async function sendOtpEmail(to, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // app password here
      }
    });

    await transporter.sendMail({
      from: `"Suits N Glam" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code - Suits N Glam",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use the following OTP to continue:</p>
        <h1>${otp}</h1>
        <p>This code expires in <b>${process.env.OTP_EXPIRES_MINUTES} minutes</b>.</p>
      `
    });

    return true;
  } catch (err) {
    console.error("OTP Email Error:", err);
    return false;
  }
}
