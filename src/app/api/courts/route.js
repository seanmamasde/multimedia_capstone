// src/app/api/courts/route.js
import dbConnect from "../../../utils/db";
import Court from "../../../models/Court";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Get the start date and end date from query parameters
    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get('startDate'));
    const endDate = new Date(searchParams.get('endDate'));
    
    // Query courts between start and end date
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