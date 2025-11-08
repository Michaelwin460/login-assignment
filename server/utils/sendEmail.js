
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,           
  maxConnections: 3,
  maxMessages: 50,
  rateDelta: 2000,
  rateLimit: 5          
});

transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email transporter failed:", err.message);
  } else {
    console.log("✅ Email transporter ready");
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Dojo Login" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    return { ok: true };

  } catch (err) {
    console.error("EMAIL SEND ERROR:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail };

