// src/app/api/reserve_courts/route.js
import dbConnect from "../../../utils/db";
import Court from "../../../models/Court";
import { Reservation }from "../../../models/Reservation.js";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = new Date(searchParams.get("startDate"));
    const endDate = new Date(searchParams.get("endDate"));
    const teamId = searchParams.get("teamId");
    
    const reservation = await Reservation.findOne({ teamId });

    if (!reservation) {
      return new Response(
        JSON.stringify({ error: "找不到相關預約" }),
        { status: 404 }
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
      status: "pending", // 初始狀態為 pending
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
      switch (priority) {
        case "first":
          if (!court.firstChoiceTeams) {
            court.firstChoiceTeams = []; // 如果未定義，初始化為空陣列
          }
          if (!court.firstChoiceTeams.includes(teamId)) {
            court.firstChoiceTeams.push(teamId);
          }
          break;
        case "second":
          if (!court.secondChoiceTeams) {
            court.secondChoiceTeams = []; // 如果未定義，初始化為空陣列
          }
          if (!court.secondChoiceTeams.includes(teamId)) {
            court.secondChoiceTeams.push(teamId);
          }
          break;
        case "third":
          if (!court.thirdChoiceTeams) {
            court.thirdChoiceTeams = []; // 如果未定義，初始化為空陣列
          }
          if (!court.thirdChoiceTeams.includes(teamId)) {
            court.thirdChoiceTeams.push(teamId);
          }
          break;
      }
      

      // 保存更新的 Court
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
  console.error("Error processing reservation:", error); // 這會打印錯誤
  if (error instanceof Error) {
    console.error('Error details:', error.message, error.stack);
  }

  return new Response(
    JSON.stringify({ message: "預約過程發生錯誤", error: error.message }),
    { status: 500 }
  );
}
}