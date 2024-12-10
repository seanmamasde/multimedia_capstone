"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { decodeJwt } from "@/utils/jwtAuth";
import AppMenubar from "../../components/menubar";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";

export default function CombinedReservation() {
  const max_courts = 6.0;
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [courtData, setCourtData] = useState({});
  const router = useRouter();

  // Team Selection State
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

  // Fetch Court Data and Days
  useEffect(() => {
    const today = new Date();
    const generatedDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + 7 + i);
      return date.toISOString().split("T")[0];
    });

    setDays(generatedDays);
    setSelectedDate(generatedDays[0]);

    // Fetch court data
    fetchCourtData(generatedDays[0], generatedDays[generatedDays.length - 1]);

    // Check authentication and fetch user's teams
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

  // Fetch Court Data
  const fetchCourtData = async (startDate, endDate) => {
    try {
      const response = await fetch(
        `/api/dbConnect/getReservation?startDate=${startDate}&endDate=${endDate}`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      const transformed = {};

      data.forEach((reservation) => {
        const dateKey = new Date(reservation.date).toISOString().split("T")[0];
        if (!transformed[dateKey]) {
          transformed[dateKey] = {};
        }
  
        if (!transformed[dateKey][reservation.preferences.first])
          transformed[dateKey][reservation.preferences.first] = 1;
        else
          transformed[dateKey][reservation.preferences.first]++;
      });

      setCourtData(transformed);
    } catch (error) {
      console.error("Error fetching court data:", error);
    }
  };
  
  // Fetch Teams for User
  const fetchUserTeams = async (uname) => {
    try {
      const response = await fetch(`/api/dbConnect/teamsByUname?uname=${uname}`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("獲取隊伍資料錯誤:", error);
    }
  };

  // Fetch Team Details
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

  // Court Data Utility Functions
  const getColorForTimeSlot = (date, timeSlot) => {
    const courts = courtData[date]?.[`${timeSlot.toString().padStart(2, "0")}:00`];
    if (!courts) return "white";

    const occupancyRate = courts / max_courts;

    if (occupancyRate >= 1) return "#FF0000";
    if (occupancyRate >= 0.5) return "#006400";
    if (occupancyRate > 0) return "#90EE90";
    return "white";
  };

  const transposedData = Array.from({ length: 15 }, (_, i) => {
    const hour = 8 + i;
    const rowData = { time: `${hour}:00` };
    days.forEach((day) => {
      rowData[day] = courtData[day]?.[`${hour.toString().padStart(2, "0")}:00`] || null;
    });
    return rowData;
  });

  // Team Selection Handlers
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
    <div style={{
      margin: 0,
      padding: 0,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <AppMenubar />
      
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Side: Court Availability */}
        <div style={{
          width: '60%',
          overflowY: 'auto',
          padding: '20px',
          borderRight: '1px solid #ddd'
        }}>
          <h2 className="text-2xl font-bold mb-4">場地預約情況</h2>
          {days.length > 0 ? (
            <DataTable
              value={transposedData}
              scrollable
              scrollHeight="calc(100vh - 200px)"
              tableStyle={{ minWidth: "100%" }}
              style={{
                width: "100%",
                border: "1px solid #ddd",
              }}
            >
              <Column
                field="time"
                header="時間"
                style={{
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  backgroundColor: "#f7f7f7",
                }}
                frozen
              />
              {days.map((day) => (
                <Column
                  key={day}
                  field={day}
                  header={day}
                  body={(rowData) => (
                    <div
                      style={{
                        backgroundColor: getColorForTimeSlot(day, parseInt(rowData.time, 10)),
                        width: "100%",
                        height: "40px",
                      }}
                    >
                      &nbsp;
                    </div>
                  )}
                  style={{ textAlign: "center", whiteSpace: "nowrap" }}
                />
              ))}
            </DataTable>
          ) : (
            <p style={{ textAlign: "center" }}>載入中...</p>
          )}
        </div>

        {/* Right Side: Team and Time Slot Selection */}
        <div style={{
          width: '40%',
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 className="text-2xl font-bold mb-6">選擇隊伍與時段志願</h2>

          {/* Date Dropdown */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">選擇日期:</label>
            <Dropdown
              value={selectedDate}
              options={days.map((day) => ({ label: day, value: day }))}
              onChange={(e) => setSelectedDate(e.value)}
              placeholder="選擇日期"
              style={{
                width: "100%",
              }}
            />
          </div>

          {/* Team Selection */}
          <div className="mb-6">
            <label htmlFor="teamSelect" className="block mb-2 font-semibold">選擇隊伍:</label>
            <select 
              id="teamSelect" 
              value={selectedTeam} 
              onChange={handleTeamSelection}
              className="w-full p-2 border rounded"
            >
              <option value="">請選擇隊伍</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.teamname}
                </option>
              ))}
            </select>
          </div>

          {/* Team Details */}
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
            <h3 className="block mb-2 font-semibold">選擇時段志願序</h3>
            <p className="text-sm text-gray-600 mb-4">請依照優先順序選擇時段，系統將依照志願序進行分配。第一志願為必填，第二、三志願為選填。</p>
            
            {/* First Preference */}
            <div className="mb-4">
              <label htmlFor="firstPreference" className="block mb-2">第一志願時段:</label>
              <select
                id="firstPreference"
                value={preferences.first}
                onChange={(e) => handlePreferenceChange('first', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">請選擇時段</option>
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
                className="w-full p-2 border rounded"
              >
                <option value="">請選擇時段</option>
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
                className="w-full p-2 border rounded"
              >
                <option value="">請選擇時段</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            label="開始預約"
            className="p-button-primary w-full"
            onClick={handleConfirmReservation}
          />
        </div>
      </div>
    </div>
  );
}