// src/app/api/dbConnect/[id]/route.js
import dotenv from "dotenv";
import dbConnect from "../../../../utils/db.js";
import Teams from "../../../../models/Teams.js";
import User from "../../../../models/User.js";
import promptSync from "prompt-sync";
import { Reservation } from "@/models/Reservation.js";

// Load environment variables
dotenv.config();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(id);
    await dbConnect();
    const queryParams = new URLSearchParams(request.url.split('?')[1]);

    switch (id) {
      case "teamsByUname": {
        const uname = queryParams.get("uname");
        console.log(uname);

        const allTeams = await Teams.find({
          $or: [
            { uname1: uname },
            { uname2: uname },
            { uname3: uname },
            { uname4: uname }
          ]
        })
          .catch(err => {
            console.error(err);
          });

        return new Response(JSON.stringify(allTeams), {
          status: 200,
        });
      }
      case "teamByTid": {
        const tid = queryParams.get("tid");
        console.log(tid);

        const specifiedTeam = await Teams.find({ id: tid })
          .catch(err => {
            console.error(err);
          });

        console.log(specifiedTeam);

          return new Response(JSON.stringify(specifiedTeam[0]), {
            status: 200,
          });
        }
        case "getReservation": {
          const startDate = new Date(queryParams.get("startDate"));
          const endDate = new Date(queryParams.get("endDate"));
          
          // Remove teamId check since we're just fetching available courts
          if (!startDate || !endDate) {
            return new Response(
              JSON.stringify({ error: "開始日期或結束日期缺失" }),
              { status: 400 }
            );
          }
      
          const reservations = await Reservation.find({
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          });
          console.log(reservations);
          return new Response(JSON.stringify(reservations), { status: 200 });
        }
        default:
          return new Response('Invalid GET ID', { status: 404 });
      }
    } catch(error) {
      console.log(error);

    return new Response(error, {
      status: 500,
    });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    switch (id) {
      case "createTeam": {
        const { teamName, numMembers, userNames } = await request.json()

        const team = new Teams({
          teamname: teamName,
          memberNum: numMembers,
          uname1: userNames[0],
          uname2: userNames[1],
          uname3: userNames[2],
          uname4: userNames[3]
        });

        await team.save();
        return new Response('Success', { status: 200 })
      }
      case "validateUsers": {
        const { userNames } = await request.json();
        console.log(userNames);
        const users = await User.find({ username: { $in: userNames } });

        if (users.length === userNames.length) {
          return new Response(JSON.stringify({ missingUsers: [] }), { status: 200 }) // All users are present
        }

        const foundUsernames = users.map(user => user.username);
        const missingUsers = userNames.filter(username => !foundUsernames.includes(username));

        return new Response(JSON.stringify({ missingUsers: missingUsers }), { status: 200 })
      }
      case "editTeam": {
        // needs encryption
        const { team } = await request.json();
        const { id, ...updateData } = team;

        const updated = await Teams.findOneAndUpdate(
          { id },
          updateData,
          { new: true, upsert: false }
        );

        if (updated) {
          return new Response("Successfully updated entry", { status: 200 });
        } else {
          return new Response("Unable to find targeted team", { status: 500 });
        }
      }
      case "deleteTeam": {
        // this is unsecure af rn
        const { tid } = await request.json();

        await Teams.deleteOne({ id: tid }).catch(err => {
          console.error(err);
        });

        return new Response("delete success.", { status: 200 });
      }
      default:
        return new Response('Invalid POST ID', { status: 404 });
    }

  } catch (error) {
    console.log(error);

    return new Response(error, {
      status: 500,
    });
  }
}