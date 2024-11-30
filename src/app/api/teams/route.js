// src/app/api/teams/route.js
import dbConnect from "@/utils/db"; // Using absolute path
import Teams from "@/models/Teams"; // Using absolute path

export async function GET(req) {
  try {
    await dbConnect();

    // Parse the query parameter from the request URL
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return new Response(JSON.stringify({ error: "Username is required" }), {
        status: 400,
      });
    }

    // Find teams where the user is a member
    const teams = await Teams.find({
      $or: [
        { uname1: username },
        { uname2: username },
        { uname3: username },
        { uname4: username },
      ],
    });

    return new Response(JSON.stringify(teams), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
