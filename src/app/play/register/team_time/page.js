"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppMenubar from "../../../components/menubar";
import { decodeJwt } from "@/utils/jwtAuth";

export default function TeamTimeSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get('date');
  
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamDetails, setTeamDetails] = useState(null);
  const [username, setUsername] = useState(null);
  const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // Check authentication and fetch user's teams
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(decodeJwt(token));
      setUsername(payload.username);
      fetchUserTeams(payload.username);
    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, []);

  // Fetch teams for the current user
  const fetchUserTeams = async (uname) => {
    try {
      const response = await fetch(`/api/dbConnect/teamsByUname?uname=${uname}`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("獲取隊伍資料錯誤:", error);
    }
  };

  // Fetch specific team details
  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await fetch(`/api/dbConnect/teamByTid?tid=${teamId}`);
      if (response.ok) {
        const teamData = await response.json();
        setTeamDetails(teamData);
      } else {
        console.error("無法獲取隊伍資料");
      }
    } catch (error) {
      console.error("請求錯誤：", error);
    }
  };

  const handleTeamSelection = (e) => {
    const teamId = e.target.value;
    setSelectedTeam(teamId);
    if (teamId) {
      fetchTeamDetails(teamId);
    } else {
      setTeamDetails(null);
    }
  };

  const handleTimeSlotSelection = (e) => {
    setSelectedTimeSlot(e.target.value);
  };

  const handleConfirmRegistration = () => {
    if (!selectedTeam || !selectedTimeSlot) {
      alert("請選擇隊伍和時間段！");
      return;
    }
    
    // Add the date to the confirmation URL
    router.push(`/play/register/confirmation?team=${selectedTeam}&time=${selectedTimeSlot}&date=${selectedDate}`);
  };

  return (
    <div>
      <AppMenubar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">選擇隊伍與時段</h1>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">登記日期: {selectedDate}</h2>
        </div>

        {/* Team Selection */}
        <div className="mb-6">
          <label htmlFor="teamSelect" className="block mb-2">選擇隊伍:</label>
          <select 
            id="teamSelect" 
            value={selectedTeam} 
            onChange={handleTeamSelection}
            className="w-full max-w-md p-2 border rounded"
          >
            <option value="">請選擇隊伍</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.teamname}
              </option>
            ))}
          </select>
        </div>

        {/* Display selected team details */}
        {teamDetails && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">隊伍詳情</h3>
            <p>隊伍名稱: {teamDetails.teamname}</p>
            <p>成員數量: {teamDetails.memberNum}</p>
            <div className="mt-2">
              <p>成員列表:</p>
              <ul className="list-disc pl-5">
                {Array.from({ length: teamDetails.memberNum }).map((_, idx) => (
                  <li key={idx}>
                    成員 {idx + 1}: {teamDetails[`uname${idx + 1}`]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Time Slot Selection */}
        <div className="mb-6">
          <label htmlFor="timeSlotSelect" className="block mb-2">選擇時間段:</label>
          <select
            id="timeSlotSelect"
            value={selectedTimeSlot}
            onChange={handleTimeSlotSelection}
            className="w-full max-w-md p-2 border rounded"
          >
            <option value="">請選擇時間段</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmRegistration}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors cursor-pointer"
        >
          確認登記
        </button>
      </div>
    </div>
  );
}