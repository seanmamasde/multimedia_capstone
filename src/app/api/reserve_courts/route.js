// src/app/api/reserve_courts/route.js
import dbConnect from "../../../utils/db";
import Court from "../../../models/Court";
import { Reservation } from "../../../models/Reservation.js";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get("startDate"));
    const endDate = new Date(searchParams.get("endDate"));
    
    // Remove teamId check since we're just fetching available courts
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "開始日期或結束日期缺失" }),
        { status: 400 }
      );
    }

    const courts = await Court.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
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

    const { date, teamId, preferences } = await req.json();
    const { first, second, third } = preferences;

    if (!date || !teamId || !first) {
      return new Response(
        JSON.stringify({ message: "缺少必要資訊" }),
        { status: 400 }
      );
    }

    // 檢查隊伍是否已經有預約
    const existingReservation = await Reservation.findOne({
      teamId,
      date: new Date(date),
    });

    if (existingReservation) {
      return new Response(
        JSON.stringify({ message: "該隊伍在此日期已有預約" }),
        { status: 400 }
      );
    }

    // 新增預約記錄
    const reservation = new Reservation({
      date: new Date(date),
      teamId,
      preferences: {
        first,
        second: second || null,
        third: third || null,
      },
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await reservation.save();

    // 更新 Court 的選擇欄位
    const timeSlots = { first, second, third };
    for (const [priority, timeSlot] of Object.entries(timeSlots)) {
      if (!timeSlot) continue;

      const court = await Court.findOneAndUpdate(
        { date: new Date(date), timeSlot },
        { $setOnInsert: { totalCourts: 6, reservedCourts: 0 } },
        { upsert: true, new: true }
      );

      // 將 teamId 加入對應的志願欄位
      const choiceField = `${priority}ChoiceTeams`;
      if (!court[choiceField]) {
        court[choiceField] = [];
      }
      if (!court[choiceField].includes(teamId)) {
        court[choiceField].push(teamId);
      }
      
      court.reservedCourts += 1;
      await court.save();
    }

    return new Response(
      JSON.stringify({
        message: "預約申請已送出，請等待結果通知",
        reservationId: reservation._id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing reservation:", error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }

    return new Response(
      JSON.stringify({ message: "預約過程發生錯誤", error: error.message }),
      { status: 500 }
    );
  }
}

// reservation/page.js
const fetchCourtData = async (startDate, endDate) => {
  try {
    // Update the endpoint to match the API route
    const response = await fetch(
      `/api/reserve_courts?startDate=${startDate}&endDate=${endDate}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    const transformed = {};
    data.forEach((court) => {
      const dateKey = new Date(court.date).toISOString().split("T")[0];
      if (!transformed[dateKey]) {
        transformed[dateKey] = {};
      }
      transformed[dateKey][court.timeSlot] = {
        reserved: court.reservedCourts,
        total: court.totalCourts,
        firstChoiceTeams: court.firstChoiceTeams || [],
        secondChoiceTeams: court.secondChoiceTeams || [],
        thirdChoiceTeams: court.thirdChoiceTeams || [],
      };
    });
    
    setCourtData(transformed);
  } catch (error) {
    console.error("Error fetching court data:", error);
    // You might want to set an error state here to show to the user
    throw error;
  }
};