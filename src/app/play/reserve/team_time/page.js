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
  const [preferences, setPreferences] = useState({
    first: "",
    second: "",
    third: ""
  });

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

  const handlePreferenceChange = (preference, value) => {
    setPreferences(prev => ({
      ...prev,
      [preference]: value
    }));
  };

  const validatePreferences = () => {
    // 檢查是否有重複的時段選擇
    const selectedTimes = Object.values(preferences).filter(time => time !== "");
    const uniqueTimes = new Set(selectedTimes);
    if (selectedTimes.length !== uniqueTimes.size) {
      alert("每個志願序必須選擇不同的時段！");
      return false;
    }
    return true;
  };

  const handleConfirmReservation = () => {
    if (!selectedTeam) {
      alert("請選擇隊伍！");
      return;
    }

    if (!preferences.first) {
      alert("請至少選擇第一志願時段！");
      return;
    }

    if (!validatePreferences()) {
      return;
    }
    
    // Construct the URL with all preferences
    const registrationParams = new URLSearchParams({
      team: selectedTeam,
      date: selectedDate,
      first: preferences.first,
      second: preferences.second,
      third: preferences.third
    }).toString();

    router.push(`/play/reserve/confirmation?${registrationParams}`);
  };

  return (
    <div>
      <AppMenubar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">選擇隊伍與時段志願</h1>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">預約日期: {selectedDate}</h2>
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
            <p>隊伍成員數量: {teamDetails.memberNum}</p>
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

        {/* Time Slots Preferences */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">選擇時段志願序</h3>
          <p className="text-sm text-gray-600 mb-4">請依照優先順序選擇時段，系統將依照志願序進行分配。第一志願為必填，第二、三志願為選填。</p>
          
          {/* First Preference */}
          <div className="mb-4">
            <label htmlFor="firstPreference" className="block mb-2">第一志願時段:</label>
            <select
              id="firstPreference"
              value={preferences.first}
              onChange={(e) => handlePreferenceChange('first', e.target.value)}
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

          {/* Second Preference */}
          <div className="mb-4">
            <label htmlFor="secondPreference" className="block mb-2">第二志願時段: (選填)</label>
            <select
              id="secondPreference"
              value={preferences.second}
              onChange={(e) => handlePreferenceChange('second', e.target.value)}
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

          {/* Third Preference */}
          <div className="mb-4">
            <label htmlFor="thirdPreference" className="block mb-2">第三志願時段: (選填)</label>
            <select
              id="thirdPreference"
              value={preferences.third}
              onChange={(e) => handlePreferenceChange('third', e.target.value)}
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
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmReservation}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors cursor-pointer"
        >
          確認預約
        </button>
      </div>
    </div>
  );
}