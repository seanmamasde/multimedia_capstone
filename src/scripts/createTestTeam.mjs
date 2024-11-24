import dotenv from "dotenv";
import dbConnect from "../utils/db.js";
import Teams from "../models/Teams.js";
import promptSync from "prompt-sync";

// Load environment variables
dotenv.config();

// Initialize prompt-sync
const prompt = promptSync({ sigint: true });

async function createTestTeam() {
    await dbConnect(); // Connect to the database

    const lastTeam = await Teams.find({ teamname: /^testteam\d+$/ })
    .sort({ teamname: -1 }) // Sort descending
    .limit(1)
    .exec();

    let nextTeamNumber = 1;
    if (lastTeam.length > 0) {
        const lastTeamname = lastTeam[0].teamname;
        const lastNumberMatch = lastTeamname.match(/\d+$/);
        if (lastNumberMatch) {
            nextTeamNumber = parseInt(lastNumberMatch[0], 10) + 1;
        }
    }
    const defaultTeamname = `testteam${nextTeamNumber}`;

    const teamname = prompt(`team name (default: ${defaultTeamname}):`, defaultTeamname);
    const memNum = prompt(`member num (1 to 4):`);

    const members = ["", "", "", ""]
    for (let i = 0; i < memNum; i++)
    {
        members[i] = prompt(`m${i + 1} uname:`);
    }
    
    // Create the user
    const team = new Teams({
        teamname: teamname,
        memberNum: memNum,
        uname1: members[0],
        uname2: members[1],
        uname3: members[2],
        uname4: members[3]
    });

    await team.save();
    console.log(`Team "${teamname}" created successfully!`);
    process.exit(0);
}

createTestTeam().catch((err) => {
  console.error("Error creating team:", err);
  process.exit(1);
});
