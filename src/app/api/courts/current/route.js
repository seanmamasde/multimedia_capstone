import dbConnect from "../../../../utils/db";
import Court from "../../../../models/Court";
import Teams from "../../../../models/Teams";

export async function GET(req) {
    try {
        await dbConnect();

        const currentTime = new Date();
        const currentHour = currentTime.getHours();

        // 設定查詢時間範圍
        if (currentHour > 22) {
            return new Response(
                JSON.stringify({ message: "非球場營業時間" }),
                { status: 202 }
            );
        }

        let searchHour = currentHour < 8 ? 8 : currentHour;
        searchHour = searchHour < 10 ? `0${searchHour}:00` : `${searchHour}:00`;

        currentTime.setUTCHours(0, 0, 0, 0);

        // 查詢符合條件的 Court 資料
        const courts = await Court.find({
            date: {
                $eq: new Date(currentTime.toISOString()),
            },
            timeSlot: {
                $gte: searchHour,
                $lte: searchHour,
            },
        });

        if (!courts || courts.length === 0) {
            return new Response(
                JSON.stringify({ message: "無符合條件的場地資料" }),
                { status: 404 }
            );
        }

        // 提取所有的隊伍 ID
        const teamIds = [];
        courts.forEach((court) => {
            if (court.teams) {
                teamIds.push(...Array.from(court.teams.keys()));
            }
        });

        // 查詢隊伍詳細資料
        const teams = await Teams.find({ id: { $in: teamIds } });

        // 整合 Court 和 Teams 資料
        const result = courts.map((court) => {
            const enrichedTeams = Array.from(court.teams.entries()).map(
                ([teamId, courtLetter]) => {
                    const team = teams.find((t) => t.id === teamId);
                    return {
                        teamId,
                        court: courtLetter,
                        teamname: team ? team.teamname : "Unknown",
                        uname1: team ? team.uname1 : "Unknown",
                    };
                }
            );
            return {
                ...court.toObject(),
                teams: enrichedTeams,
            };
        });

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
        console.error("Error fetching current usage:", error);
        return new Response(
            JSON.stringify({ error: "擷取當天場地使用情形時發生錯誤" }),
            { status: 500 }
        );
    }
}
