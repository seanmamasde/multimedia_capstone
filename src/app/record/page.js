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

        // Fetch courts for each team
        const courtsPromises = teamsData.map((team) =>
          fetch(`/api/courts?teamId=${team.id}`).then((res) => res.json())
        );

        const courtsData = await Promise.all(courtsPromises);

        // Combine and flatten team and court data
        const formattedRecords = [];
        teamsData.forEach((team, index) => {
          const teamCourts = courtsData[index]; // Courts associated with this team
          teamCourts.forEach((court) => {
            const teams = court.teams;
            // console.log("Teams type:", typeof teams);
            // console.log("Is Teams a Map?", teams instanceof Map);
            // console.log("Teams content:", teams);
            formattedRecords.push({
              teamName: team.teamname,
              date: court.date || "未提供",
              time: court.timeSlot || "未提供",
              status: court.reservedCourts || "未提供",
              venue: teams[team.id] || "未提供",
            });
          });
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

// "use client";
// import React, { useState, useEffect } from "react";
// import AppMenubar from "../components/menubar";
// import { decodeJwt } from "@/utils/jwtAuth";
// import { useRouter } from "next/navigation";

// export default function Record() {
//   const router = useRouter();
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchUserRecords = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) {
//           router.push("/login");
//           return;
//         }

//         const payload = JSON.parse(decodeJwt(token));

//         // Fetch teams by username
//         const teamsResponse = await fetch(`/api/dbConnect/teamsByUname?uname=${payload.username}`);
//         if (!teamsResponse.ok) {
//           throw new Error("Failed to fetch teams");
//         }

//         const teamsData = await teamsResponse.json();

//         const courtsPromises = teamsData.map((team) =>
//           fetch(`/api/courts?teamId=${team.id}`).then((res) => res.json())
//         );

//         const courtsData = await Promise.all(courtsPromises);

//         // Combine team and court data
//         const formattedRecords = teamsData.map((team, index) => {
//           const court = courtsData[index];
//           return {
//             teamName: team.teamname,
//             date: court.date || "未提供",
//             time: court.timeSlot || "未提供",
//             status: court.totolCourts || "未提供",
//             venue: court.totolCourts || "未提供",
//           };
//         });

//         setRecords(formattedRecords);
//         setLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchUserRecords();
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
//                   <td className="border p-2">{record.date}</td>
//                   <td className="border p-2">{record.time}</td>
//                   <td className="border p-2">
//                     <span
//                       className={`px-2 py-1 rounded ${
//                         record.status === "已完成"
//                           ? "bg-green-100 text-green-800"
//                           : record.status === "進行中"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : "bg-red-100 text-red-800"
//                       }`}
//                     >
//                       {record.status}
//                     </span>
//                   </td>
//                   <td className="border p-2">{record.venue}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }