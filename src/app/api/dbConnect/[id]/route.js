import dotenv from "dotenv";
import dbConnect from "../../../../utils/db.js";
import Teams from "../../../../models/Teams.js";
import promptSync from "prompt-sync";

// Load environment variables
dotenv.config();

export async function GET(request, { params }) {
    try {
      const { id } = await params;
      console.log(id);
      await dbConnect();
      const queryParams = new URLSearchParams(request.url.split('?')[1]);

      switch (id) {
        case "teamsByUid": {
          const uid = queryParams.get("uid");
          console.log(uid);

          const allTeams = await Teams.aggregate([
            {
              $match: {
                  $or: [
                      { uid1: uid },
                      { uid2: uid },
                      { uid3: uid },
                      { uid4: uid }
                    ]
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid1',
                foreignField: 'id',
                as: 'u1name'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid2',
                foreignField: 'id',
                as: 'u2name'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid3',
                foreignField: 'id',
                as: 'u3name'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid4',
                foreignField: 'id',
                as: 'u4name'
              }
            },
            {
              $addFields: {
                  u1name: { $arrayElemAt: ["$u1name.username", 0] },
                  u2name: { $arrayElemAt: ["$u2name.username", 0] },
                  u3name: { $arrayElemAt: ["$u3name.username", 0] },
                  u4name: { $arrayElemAt: ["$u4name.username", 0] }
              }
            }
          ])
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

          const specifiedTeam = await Teams.aggregate([
            {
              $match: {
                id: tid
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid1',
                foreignField: 'id',
                as: 'u1name'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid2',
                foreignField: 'id',
                as: 'u2name'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid3',
                foreignField: 'id',
                as: 'u3name'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'uid4',
                foreignField: 'id',
                as: 'u4name'
              }
            },
            {
              $addFields: {
                  u1name: { $arrayElemAt: ["$u1name.username", 0] },
                  u2name: { $arrayElemAt: ["$u2name.username", 0] },
                  u3name: { $arrayElemAt: ["$u3name.username", 0] },
                  u4name: { $arrayElemAt: ["$u4name.username", 0] }
              }
            }
          ])
          .catch(err => {
            console.error(err);
          });

          console.log(specifiedTeam);

          return new Response(JSON.stringify(specifiedTeam[0]), {
            status: 200,
          });
        }
        default:
          return new Response('Invalid ID', { status: 404 });
      }
    } catch(error) {
        return new Response(error, {
            status: 500,
        });
    }
}   

export async function POST(req) {
    return new Response("post unsupported", {
        status: 404,
      });
}