import { NextResponse } from 'next/server';
import dbConnect from "../../../utils/db";
import Record from "@/models/Record"; // 根據實際路徑調整

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 查詢與使用者相關的紀錄
    const records = await Record.find({
      $or: [
        { 'team.members': username },
        { captain: username },
      ],
    });

    // 轉換資料格式
    const formattedRecords = records.map(record => ({
      teamName: record.team.name,
      date: record.date,
      time: record.timeSlot,
      status: record.status,
      venue: record.venue,
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}