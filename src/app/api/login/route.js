import dbConnect from "../../../utils/db";
import User from "../../../models/User";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req) {
  try {
    await dbConnect();

    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    // Generate the JWT
    const token = jwt.sign({ username: user.username, id: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    console.log("Generated token:", token); // Log the token here

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (err) {
    console.error("Error in login route:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
