import nodemailer from "nodemailer";
import crypto from "crypto";
import dbConnect from "@/utils/db";
import User from "@/models/User";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  await dbConnect();

  const { email } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return new Response({ error: "找不到使用者" }, { status: 404 });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetToken = resetToken;
  user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await transporter.sendMail({
      from: '"羽球場預約系統" <your-email@gmail.com>',
      to: email,
      subject: "重置密碼連結",
      text: `請點擊以下連結重置密碼：${resetLink}`,
    });

    return new Response({ message: "重置密碼連結已發送至您的電子郵件" }, { status: 200 });
    }

    catch (err) {
      console.error("Error in forgot-password route:", err);
      return new Response({ error: "發送失敗，請稍後再試" }, { status: 500 });
    }
}
