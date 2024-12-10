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

  const formatDate = (dateString) => {
    if (!dateString) return "未提供";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const checkStatus = (isWaitlist) => {
    return isWaitlist ? "候補中" : "已登記";
  }

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

      const courtsPromises = teamsData.map((team) =>
        fetch(`/api/courts?teamId=${team.id}&includeWaitlist=true`).then((res) => res.json())
      );

      const courtsData = await Promise.all(courtsPromises);

      // Combine and flatten team and court data
      const formattedRecords = [];
      teamsData.forEach((team, index) => {
        const teamCourts = courtsData[index]; // Courts associated with this team
        teamCourts.forEach((court) => {
          const teams = court.teams;
          const isWaitlisted = court.waitlistTeams.includes(team.id);

          if (teams[team.id] || isWaitlisted) {
            formattedRecords.push({
              teamName: team.teamname,
              teamId: team.id,
              date: formatDate(court.date),
              time: court.timeSlot,
              status: checkStatus(isWaitlisted),
              venue: isWaitlisted ? "候補中" : (teams[team.id] || "未提供"),
              originalDate: court.date,
              isWaitlisted: isWaitlisted
            });
          }
        });
      });

      // Sort sorted records by team name
      const sortedRecords = formattedRecords.sort((a, b) => {
        if (a.teamName < b.teamName) return -1;
        if (a.teamName > b.teamName) return 1;
        return 0;
      });

      const finalRecords = sortedRecords.sort((a, b) => {
        return new Date(a.originalDate) - new Date(b.originalDate);
      });

      setRecords(finalRecords);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (record) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch('/api/courts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: record.originalDate,
          timeSlot: record.time,
          cancelledTeamId: record.teamId
        })
      });

      if (response.ok) {
        await fetchUserRecords();
        alert('取消登記成功');
      } else {
        const errorData = await response.json();
        alert(`取消登記失敗: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error cancelling registration:', err);
      alert('取消登記時發生錯誤');
    }
  };

  useEffect(() => {
    fetchUserRecords();
  }, [router]);

  if (loading) return <div className="flex justify-center items-center h-screen">載入中...</div>;
  if (error) return <div className="flex justify-center items-center h-screen">發生錯誤: {error}</div>;

  return (
    <div>
      <AppMenubar />
      <div className="content-wrapper text-center">
        <h1 className="title">查詢紀錄</h1>
        <table className="w-full max-w-4xl border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">隊伍名稱</th>
              <th className="border p-2">日期</th>
              <th className="border p-2">時間</th>
              <th className="border p-2">狀態</th>
              <th className="border p-2">場地</th>
              <th className="border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  沒有相關紀錄
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={index} className={`hover:bg-gray-50 ${record.isWaitlisted ? 'bg-yellow-50' : ''}`}>
                  <td className="border p-2">{record.teamName}</td>
                  <td className="border p-2">{record.date}</td>
                  <td className="border p-2">{record.time}</td>
                  <td className="border p-2">{record.status}</td>
                  <td className="border p-2">{record.venue}</td>
                  <td className="border p-2">
                    <button 
                      onClick={() => handleCancelRegistration(record)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      取消登記
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}