// "use client";
// import React, { useState, useEffect } from "react";
// import AppMenubar from "../components/menubar";
// import { decodeJwt } from "@/utils/jwtAuth";
// import { useRouter, useSearchParams } from "next/navigation";

// export default function Record() {
//   const router = useRouter();
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const searchParams = useSearchParams();
//   const teamId = searchParams.get('team');
//   const timeSlot = searchParams.get('time');
//   const date = searchParams.get('date');

//   useEffect(() => {
//     const fetchUserTeams = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) {
//           router.push("/login");
//           return;
//         }

//         const payload = JSON.parse(decodeJwt(token));
//         const response = await fetch(`/api/dbConnect/teamsByUname?uname=${payload.username}`);
        
//         if (!response.ok) {
//           throw new Error('Failed to fetch teams');
//         }

//         const data = await response.json();
        
//         // 格式化返回數據
//         const formattedRecords = data.map(team => ({
//           teamName: team.teamname,
//           date: team.date, // 確保你的數據中有此欄位
//           time: team.time, // 確保你的數據中有此欄位
//           status: team.status, // 確保你的數據中有此欄位
//           venue: team.venue, // 確保你的數據中有此欄位
//         }));

//         setRecords(formattedRecords);
//         setLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchUserTeams();
//   }, [router]);

//   if (loading) return <div>載入中...</div>;
//   if (error) return <div>發生錯誤: {error}</div>;

//   return (
//     <div>
//       <AppMenubar />
//       <h1>查詢紀錄 Record</h1>
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-2xl font-bold mb-6">查詢紀錄</h1>
//         <table className="w-full border-collapse border">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="border p-2">隊伍名稱</th>
//               <th className="border p-2">日期</th>
//               <th className="border p-2">時間</th>
//               <th className="border p-2">狀態</th>
//               <th className="border p-2">場地</th>
//             </tr>
//           </thead>
//           <tbody>
//             {records.length === 0 ? (
//               <tr>
//                 <td colSpan="5" className="text-center p-4">
//                   沒有相關紀錄
//                 </td>
//               </tr>
//             ) : (
//               records.map((record, index) => (
//                 <tr key={index} className="hover:bg-gray-50">
//                   <td className="border p-2">{record.teamName}</td>
//                   <td className="border p-2">{record.date || "未提供"}</td>
//                   <td className="border p-2">{record.time || "未提供"}</td>
//                   <td className="border p-2">
//                     <span className={`
//                       px-2 py-1 rounded 
//                       ${record.status === '已完成' ? 'bg-green-100 text-green-800' : 
//                         record.status === '進行中' ? 'bg-yellow-100 text-yellow-800' : 
//                         'bg-red-100 text-red-800'}
//                     `}>
//                       {record.status || "未提供"}
//                     </span>
//                   </td>
//                   <td className="border p-2">{record.venue || "未提供"}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
"use client";
import React, { useState, useEffect } from "react";
import AppMenubar from "../components/menubar";
import { decodeJwt } from "@/utils/jwtAuth";
import { useRouter } from "next/navigation";

export default function Record() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRecords = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const payload = JSON.parse(decodeJwt(token));

        // Fetch teams by username
        const teamsResponse = await fetch(`/api/dbConnect/teamsByUname?uname=${payload.username}`);
        if (!teamsResponse.ok) {
          throw new Error("Failed to fetch teams");
        }

        const teamsData = await teamsResponse.json();

        // Fetch reservation data for each team
        const reservationPromises = teamsData.map((team) =>
          fetch(`/api/reserve_courts?teamId=${team.id}`).then((res) => res.json())
        );

        const reservationData = await Promise.all(reservationPromises);

        // Combine team and reservation data
        const formattedRecords = teamsData.map((team, index) => {
          const reservation = reservationData[index];
          return {
            teamName: team.teamname,
            date: reservation?.date || "未提供",
            time: reservation?.preferences?.first || "未提供",
            status: reservation?.status || "未提供",
            venue: reservation?.venue || "未提供",
          };
        });

        setRecords(formattedRecords);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserRecords();
  }, [router]);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>發生錯誤: {error}</div>;

  return (
    <div>
      <AppMenubar />
      <h1>查詢紀錄 Record</h1>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">查詢紀錄</h1>
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">隊伍名稱</th>
              <th className="border p-2">日期</th>
              <th className="border p-2">時間</th>
              <th className="border p-2">狀態</th>
              <th className="border p-2">場地</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  沒有相關紀錄
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2">{record.teamName}</td>
                  <td className="border p-2">{record.date}</td>
                  <td className="border p-2">{record.time}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        record.status === "已完成"
                          ? "bg-green-100 text-green-800"
                          : record.status === "進行中"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="border p-2">{record.venue}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}