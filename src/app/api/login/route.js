import dbConnect from "../../../utils/db";
import User from "../../../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req) {
  try {
    await dbConnect();

    const { username, password } = await req.json();

    // 查找用戶
    const user = await User.findOne({ username });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), { status: 401 });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), { status: 401 });
    }

    // 生成 JWT Token
    const token = jwt.sign({ username: user.username, id: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (err) {
    console.error("Error in login route:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
