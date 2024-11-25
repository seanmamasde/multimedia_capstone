// src/app/api/courts/route.js
import dbConnect from "../../../utils/db";
import Court from "../../../models/Court";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get('startDate'));
    const endDate = new Date(searchParams.get('endDate'));
    
    const courts = await Court.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    return new Response(JSON.stringify(courts), { status: 200 });
  } catch (error) {
    console.error('Error fetching courts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    const { date, timeSlot, teamId } = await req.json();
    
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
        reservedCourts: 0,
        totalCourts: 6  // Assuming 6 is the total number of courts
      });
    }
    
    // Check if there are available courts
    if (court.reservedCourts >= court.totalCourts) {
      return new Response(
        JSON.stringify({ message: '該時段已無場地可供登記' }), 
        { status: 400 }
      );
    }
    
    // Increment the reserved courts count
    court.reservedCourts += 1;
    
    // Save the updated court document
    await court.save();
    
    return new Response(
      JSON.stringify({ message: '登記成功' }), 
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