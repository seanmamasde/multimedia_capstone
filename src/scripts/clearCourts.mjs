import dotenv from "dotenv";
import dbConnect from "../utils/db.js";
import Court from "../models/Court.js";
import promptSync from "prompt-sync";
import { Reservation } from "../models/Reservation.js";

// Load environment variables
dotenv.config();

// Initialize prompt-sync
const prompt = promptSync({ sigint: true });

async function clearCourts() {
    await dbConnect();

    console.log("\n=== 清除場地資料 ===");
    console.log("1. 清除特定日期範圍的資料");
    console.log("2. 清除所有資料");

    const choice = prompt("\n請選擇操作 (1 or 2): ");

    switch (choice) {
        case "1":
            // Clear by date range
            const startDateStr = prompt("開始日期 (YYYY-MM-DD): ");
            const endDateStr = prompt("結束日期 (YYYY-MM-DD): ");

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error("日期格式錯誤。請使用 YYYY-MM-DD 格式");
                process.exit(1);
            }

            if (endDate < startDate) {
                console.error("結束日期必須在開始日期之後");
                process.exit(1);
            }

            try {
                let result = await Court.deleteMany({
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                });
                console.log(`成功刪除 ${result.deletedCount} 筆資料`);
                result = await Reservation.deleteMany({
                    date: {
                        $gte: startDate,
                        $lte: endDate
                    }
                });
                console.log("預約紀錄已清空");
            } catch (error) {
                console.error("刪除資料時發生錯誤:", error);
                console.error("清空預約紀錄時發生錯誤:", error);
            }
            break;

        case "2":
            try {
                let result = await Court.deleteMany({});
                console.log(`成功刪除所有資料：共 ${result.deletedCount} 筆`);
                result = await Reservation.deleteMany({});
                console.log("所有預約紀錄已清空");
            } catch (error) {
                console.error("刪除資料時發生錯誤:", error);
                console.error("清空預約紀錄時發生錯誤:", error);
            }
            break;

        default:
            console.log("無效的選擇");
            break;
    }

    process.exit(0);
}

clearCourts().catch((err) => {
    console.error("執行腳本時發生錯誤:", err);
    process.exit(1);
});
