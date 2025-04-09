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

function sendBookingConfirmation(to, name, seats, code) {
  const seatList = seats.join(", ");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px;">
      <div style="background-color: #2c3e50; color: white; padding: 15px 20px; border-radius: 6px 6px 0 0;">
        <h2 style="margin: 0;">🎵 訂位驗證通知</h2>
      </div>
      <div style="padding: 20px;">
        <p>您好 <strong>${name}</strong>，</p>
        <p>您已預約座位：<strong>${seatList}</strong></p>
        <p>請輸入以下驗證碼完成訂票：</p>
        <h2 style="color: #e74c3c;">${code}</h2>
        <p style="font-size: 14px; color: #7f8c8d;">驗證碼 5 分鐘內有效</p>
      </div>
      <div style="background-color: #ecf0f1; padding: 10px 20px; text-align: center; font-size: 12px; color: #95a5a6; border-radius: 0 0 6px 6px;">
        Concert Booking System © 2025
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: '"Concert Booking" <fuecocode@gmail.com>',
    to,
    subject: "訂票驗證碼",
    html
  });
}

function sendCancellationConfirmation(to, name, seats) {
  const seatList = seats.join(", ");
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px;">
      <div style="background-color: #c0392b; color: white; padding: 15px 20px; border-radius: 6px 6px 0 0;">
        <h2 style="margin: 0;">🛑 訂位已取消</h2>
      </div>
      <div style="padding: 20px;">
        <p>您好 <strong>${name}</strong>，</p>
        <p>您已成功取消以下座位的訂位：</p>
        <p style="font-size: 16px; font-weight: bold; color: #c0392b;">${seatList}</p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://ticketing-system-render.onrender.com/" style="background-color: #2980b9; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            🔁 重新訂位
          </a>
        </div>

        <hr style="margin: 30px 0;">
        <p style="font-size: 14px; color: #7f8c8d;">若您有任何問題，歡迎再次聯繫我們。</p>
      </div>
      <div style="background-color: #ecf0f1; padding: 10px 20px; text-align: center; font-size: 12px; color: #95a5a6; border-radius: 0 0 6px 6px;">
        Concert Booking System © 2025
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: '"Concert Booking" <fuecocode@gmail.com>',
    to,
    subject: "訂位取消通知",
    html
  });
}



module.exports = {
  sendVerificationCode,
  sendBookingConfirmation,
  sendCancellationConfirmation
};