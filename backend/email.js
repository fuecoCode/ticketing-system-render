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

function sendBookingConfirmation(to, name, seats) {
  const seatList = seats.join(", ");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px;">
      <div style="background-color: #2c3e50; color: white; padding: 15px 20px; border-radius: 6px 6px 0 0;">
        <h2 style="margin: 0;">🎵 訂位成功通知</h2>
      </div>
      <div style="padding: 20px;">
        <p>您好 <strong>${name}</strong>，</p>
        <p>感謝您使用我們的音樂會訂票系統。您已成功訂下以下座位：</p>
        <p style="font-size: 16px; font-weight: bold; color: #34495e;">${seatList}</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 14px; color: #7f8c8d;">此信為系統自動發送，請勿直接回覆。</p>
      </div>
      <div style="background-color: #ecf0f1; padding: 10px 20px; text-align: center; font-size: 12px; color: #95a5a6; border-radius: 0 0 6px 6px;">
        Concert Booking System © 2025
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: '"Concert Booking" <fuecocode@gmail.com>',
    to,
    subject: "訂位成功通知",
    html
  });
}

module.exports = {
  sendVerificationCode,
  sendBookingConfirmation
};
