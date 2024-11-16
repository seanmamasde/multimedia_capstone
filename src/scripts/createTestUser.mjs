import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import dbConnect from "../utils/db.js";
import User from "../models/User.js";
import promptSync from "prompt-sync";

// Load environment variables
dotenv.config();

// Initialize prompt-sync
const prompt = promptSync({ sigint: true });

async function createTestUser() {
  await dbConnect(); // Connect to the database

  // Query the last testuser#
  const lastUser = await User.find({ username: /^testuser\d+$/ })
    .sort({ username: -1 }) // Sort descending
    .limit(1)
    .exec();

  // Determine the next testuser number
  let nextUserNumber = 1;
  if (lastUser.length > 0) {
    const lastUsername = lastUser[0].username;
    const lastNumberMatch = lastUsername.match(/\d+$/);
    if (lastNumberMatch) {
      nextUserNumber = parseInt(lastNumberMatch[0], 10) + 1;
    }
  }

  const defaultUsername = `testuser${nextUserNumber}`;
  const username = prompt(`Username (default: ${defaultUsername}): `, defaultUsername);

  // Default password is the same as the username
  const password = prompt(`Password (default: ${username}): `, username);

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if the username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    console.log("User already exists!");
    process.exit(1);
  }

  // Create the user
  const user = new User({
    username,
    password: hashedPassword,
  });

  await user.save();
  console.log(`Test user "${username}" created successfully!`);
  process.exit(0);
}

createTestUser().catch((err) => {
  console.error("Error creating test user:", err);
  process.exit(1);
});
