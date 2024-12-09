// src/app/api/courts/route.js
import dbConnect from "../../../utils/db";
import Court from "../../../models/Court";

const COURT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function selectAvailableCourt(court, teamId) {
  // Get all existing court assignments
  const existingAssignments = Array.from(court.teams.values()).filter(Boolean);

  // Get available courts (those not in existing assignments)
  const availableCourts = COURT_LETTERS.filter(
    courtLetter => !existingAssignments.includes(courtLetter)
  );

  // If no courts are available, return null
  if (availableCourts.length === 0) {
    return null;
  }

  // Randomly select from available courts
  const randomIndex = Math.floor(Math.random() * availableCourts.length);
  return availableCourts[randomIndex];
}

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get('startDate'));
    const endDate = new Date(searchParams.get('endDate'));
    const teamId = new String(searchParams.get("teamId"));

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "缺少隊伍 ID" }),
        { status: 300 }
      );
    }

    const includeWaitlist = searchParams.get('includeWaitlist') === 'true';
    const record = await Court.find({
      $or: [
        { [`teams.${teamId}`]: { $exists: true } },
        ...(includeWaitlist ? [{ waitlistTeams: teamId }] : [])
      ]
    });

    const exists = record.length > 0;
    if (exists) {
      return new Response(
        JSON.stringify(record),
        { status: 200 }
      );
    }
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "開始日期或結束日期缺失" }),
        { status: 400 }
      );
    }

    const courts = await Court.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    return new Response(JSON.stringify(courts), { status: 200 });
  } catch (error) {
    console.error("Error fetching courts:", error);
    return new Response(
      JSON.stringify({ error: "查詢場地時發生錯誤" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    const { date, timeSlot, teamId } = await req.json();
    
    if (!date || !teamId || !timeSlot) {
      return new Response(
        JSON.stringify({ message: "缺少必要資訊" }),
        { status: 400 }
      );
    }

    let court = await Court.findOne({
      date: new Date(date),
      timeSlot: timeSlot
    });
    
    if (!court) {
      court = new Court({
        date: new Date(date),
        timeSlot: timeSlot,
        teams: new Map(),
        reservedCourts: 0,
        totalCourts: 6,
        firstChoiceTeams: [],
        secondChoiceTeams: [],
        thirdChoiceTeams: [],
        waitlistTeams: [],
        waitlistLimit: 5
      });
    }
    if (court.reservedCourts < court.totalCourts) {
      const assignedCourt = selectAvailableCourt(court, teamId);

      court.teams.set(teamId, assignedCourt);
      court.reservedCourts += 1;
      court.firstChoiceTeams.push(`${teamId}-${assignedCourt}`);

      await court.save();
      
      return new Response(
        JSON.stringify({ 
          message: '登記成功', 
          assignedCourt: assignedCourt 
        }), 
        { status: 200 }
      );
    } 
    else if (court.waitlistTeams.length < court.waitlistLimit) {
      court.waitlistTeams.push(teamId);
      
      await court.save();
      
      return new Response(
        JSON.stringify({ 
          message: '已加入候補名單', 
          waitlistPosition: court.waitlistTeams.length 
        }), 
        { status: 202 }
      );
    }
    else {
      return new Response(
        JSON.stringify({ message: '候補名單已額滿，無法登記' }), 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error registering court:', error);
    return new Response(
      JSON.stringify({ message: '登記過程發生錯誤' }), 
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    
    const { date, timeSlot, cancelledTeamId } = await req.json();
    
    let court = await Court.findOne({
      date: new Date(date),
      timeSlot: timeSlot
    });
    
    // Get the court letter of the cancelled team
    const cancelledCourt = court.teams.get(cancelledTeamId);
    
    // Remove the cancelled team
    court.teams.delete(cancelledTeamId);
    court.reservedCourts -= 1;
    
    // Remove from first choice teams
    court.firstChoiceTeams = court.firstChoiceTeams.filter(
      team => !team.startsWith(cancelledTeamId)
    );
    
    // Process waitlist if there are teams waiting
    if (court.waitlistTeams.length > 0) {
      // Get the first team from waitlist
      const nextTeamId = court.waitlistTeams.shift();
      
      // Directly assign the cancelled team's court to the next team
      court.teams.set(nextTeamId, cancelledCourt);
      court.reservedCourts += 1;
      court.firstChoiceTeams.push(`${nextTeamId}-${cancelledCourt}`);
    }
    
    // Save the updated court record
    await court.save();
    
    return new Response(
      JSON.stringify({ 
        message: '取消成功，已檢查候補', 
        waitlistProcessed: court.waitlistTeams.length > 0 
      }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing cancellation:', error);
    return new Response(
      JSON.stringify({ message: '取消過程發生錯誤' }), 
      { status: 500 }
    );
  }
}