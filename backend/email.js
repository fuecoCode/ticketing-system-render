require('dotenv').config(); // 要放在最上面

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
});

function sendVerificationCode(to, code) {
  return transporter.sendMail({
    from: '"Concert Booking" <fuecocode@gmail.com>',
    to,
    subject: "您的驗證碼",
    text: `您好，您的驗證碼是：${code}，10 分鐘內有效。`
  });
}

module.exports = { sendVerificationCode };
