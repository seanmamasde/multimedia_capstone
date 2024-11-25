import nodemailer from "nodemailer";

// handle POST request
export async function POST(req) {
  if (req.method !== "POST") {;
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { email } = req.body;

  // suppose the users are stored in a database
  const users = [{ email: "user@example.com" }]; // simulate the users in the database
  const user = users.find((u) => u.email === email);

  if (!user) {
    return new Response({ error: "用戶不存在！" }, { status: 404 });
  }

  // suppose the reset link is localhost:
  const resetLink = `http://localhost:3000/reset-password?email=${email}`;

  // send email
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-email-password",
    },
  });

  try {
    await transporter.sendMail({
      from: '"羽球場預約系統" <your-email@gmail.com>',
      to: email,
      subject: "重置密碼連結",
      text: `請點擊以下連結重置密碼：${resetLink}`,
    });

    return new Response({ message: "重置密碼連結已發送至您的電子郵件！" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response({ error: "發送失敗，請稍後再試！" }, { status: 500 });
  }
}
