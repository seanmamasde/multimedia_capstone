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

  // Function to format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return "未提供";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const checkStatus = () => {
    return "已登記";
  }

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
            formattedRecords.push({
              teamName: team.teamname,
              date: formatDate(court.date),
              time: court.timeSlot,
              status: checkStatus(),
              venue: teams[team.id] || "未提供",
              originalDate: court.date // Keep original date for sorting
            });
          });
        });

        // Sort records by date in descending order (most recent first)
        const sortedRecords = formattedRecords.sort((a, b) => {
          return new Date(b.originalDate) - new Date(a.originalDate);
        });

        // Sort sorted records by team name
        const finalRecords = sortedRecords.sort((a, b) => {
          if (a.teamName < b.teamName) return -1;
          if (a.teamName > b.teamName) return 1;
          return 0;
        });

        setRecords(finalRecords);
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
                  <td className="border p-2">{record.status}</td>
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