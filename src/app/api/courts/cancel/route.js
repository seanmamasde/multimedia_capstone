// src/app/api/courts/cancel/route.js
import dbConnect from "../../../../utils/db";
import Court from "../../../../models/Court";

export async function POST(req) {
  try {
    // Verify JWT token
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: "未授權的存取" }), 
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { date, timeSlot, teamId } = await req.json();
    
    if (!date || !teamId || !timeSlot) {
      return new Response(
        JSON.stringify({ message: "缺少必要資訊" }),
        { status: 400 }
      );
    }

    // Find the court document for this date and time
    const court = await Court.findOne({
      date: new Date(date),
      timeSlot: timeSlot
    });
    
    // If no document exists, return error
    if (!court) {
      return new Response(
        JSON.stringify({ message: "找不到對應的登記資訊" }), 
        { status: 404 }
      );
    }
    
    // Remove the team from the court's teams
    court.teams.delete(teamId);
    
    // Decrement the reserved courts count
    court.reservedCourts -= 1;
    
    // Remove the team from first choice teams
    court.firstChoiceTeams = court.firstChoiceTeams.filter(
      team => team !== `${teamId}-${court.teams.get(teamId)}`
    );
    
    // Save the updated court document
    await court.save();
    
    return new Response(
      JSON.stringify({ message: '取消登記成功' }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling court registration:', error);
    return new Response(
      JSON.stringify({ message: '取消登記過程發生錯誤' }), 
      { status: 500 }
    );
  }
}