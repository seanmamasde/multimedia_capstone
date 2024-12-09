// src/app/api/courts/route.js
import dbConnect from "../../../utils/db";
import Court from "../../../models/Court";

// Function to generate court letters
const COURT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Systematically select an available court based on reservedCourts
function selectAvailableCourt(existingReservedCourts, reservedCourts) {
  // Ensure the court letter corresponds to the current reservedCourts count
  const court = COURT_LETTERS[reservedCourts];
  
  // Check if this court is already reserved
  if (existingReservedCourts.includes(court)) {
    return null;
  }

  return court;
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

    const record = await Court.find({ [`teams.${teamId}`]: { $exists: true } });
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

    // Find the court document for this date and time
    let court = await Court.findOne({
      date: new Date(date),
      timeSlot: timeSlot
    });
    
    // If no document exists, create one
    if (!court) {
      court = new Court({
        date: new Date(date),
        timeSlot: timeSlot,
        teams: new Map(),
        reservedCourts: 0,
        totalCourts: 6,
        firstChoiceTeams: [],
        secondChoiceTeams: [],
        thirdChoiceTeams: []
      });
    }
    
    // Check if there are available courts
    if (court.reservedCourts >= court.totalCourts) {
      return new Response(
        JSON.stringify({ message: '該時段已無場地可供登記' }), 
        { status: 400 }
      );
    }
    
    // Systematically select an available court
    const assignedCourt = selectAvailableCourt(
      court.firstChoiceTeams.concat(
        court.secondChoiceTeams, 
        court.thirdChoiceTeams
      ),
      court.reservedCourts
    );

    // If no court is available, reject the registration
    if (assignedCourt === null) {
      return new Response(
        JSON.stringify({ message: '該時段已無場地可供登記' }), 
        { status: 400 }
      );
    }
    
    court.teams.set(teamId, assignedCourt);
    // Increment the reserved courts count
    court.reservedCourts += 1;
    
    // Add team to first choice teams with assigned court
    court.firstChoiceTeams.push(`${teamId}-${assignedCourt}`);
    
    // Save the updated court document
    await court.save();
    
    return new Response(
      JSON.stringify({ 
        message: '登記成功', 
        assignedCourt: assignedCourt 
      }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error registering court:', error);
    return new Response(
      JSON.stringify({ message: '登記過程發生錯誤' }), 
      { status: 500 }
    );
  }
}