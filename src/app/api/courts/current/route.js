// src/app/api/courts/current/route.js
import dbConnect from "../../../../utils/db";
import Court from "../../../../models/Court";

export async function GET(req) {
    try {
      await dbConnect();
  
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      
  
      // 設定查詢的時間範圍
      const startTime = new Date();
      startTime.setHours(8, 0, 0, 0); // 當天 8:00 開始
      const endTime = new Date();
      endTime.setHours(22, 0, 0, 0); // 當天 22:00 結束

      if (currentHour > 22) {
        return new Response(
          JSON.stringify({ message: "無需查詢，球場已關閉" }),
          { status: 202 }
        );
      }
      let searchHour=currentHour;
      if(currentHour<8){
        searchHour=8;
      }
      currentTime.setUTCHours(0, 0, 0, 0);
      if(searchHour<10){
        searchHour =`0${searchHour}:00`;
      }else{
        searchHour =`${searchHour}:00`;
      }
      
    //   let searchTime = currentTime
    //   searchTime.setHours(0, 0, 0, 0);
    //   return new Response(JSON.stringify({message:currentTime.toISOString()}), { status: 200 });
      
      const courts = await Court.find({
        date: {
          $eq: new Date(currentTime.toISOString()),
        },
        timeSlot: {
          $gte: searchHour,
          $lte: searchHour,
        },
      });
  
      return new Response(JSON.stringify(courts), { status: 200 });
    } catch (error) {
      console.error("Error fetching current usage:", error);
      return new Response(
        JSON.stringify({ error: "擷取當天場地使用情形時發生錯誤" }),
        { status: 500 }
      );
    }
  }