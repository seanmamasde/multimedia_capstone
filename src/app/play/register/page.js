"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AppMenubar from "../../components/menubar";
import { decodeJwt } from "@/utils/jwtAuth";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";

export default function CourtRegistration() {
  const router = useRouter();
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [courtData, setCourtData] = useState({});
  
  // Team selection states
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamDetails, setTeamDetails] = useState(null);
  const [username, setUsername] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // Authentication and initial data fetching
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

    // Generate next 7 days
    const today = new Date();
    const generatedDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      return date.toISOString().split("T")[0];
    });

    setDays(generatedDays);
    setSelectedDate(generatedDays[0]);

    // Fetch court data
    fetchCourtData(generatedDays[0], generatedDays[generatedDays.length - 1]);
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

  // Fetch court availability data
  const fetchCourtData = async (startDate, endDate) => {
    try {
      const response = await fetch(
        `/api/courts?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      const transformed = {};
      data.forEach((court) => {
        const dateKey = new Date(court.date).toISOString().split("T")[0];
        if (!transformed[dateKey]) {
          transformed[dateKey] = {};
        }
        transformed[dateKey][court.timeSlot] = {
          reserved: court.reservedCourts,
          total: court.totalCourts,
        };
      });
      setCourtData(transformed);
    } catch (error) {
      console.error("Error fetching court data:", error);
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

  // Color coding for court availability
  const getColorForTimeSlot = (date, timeSlot) => {
    const courtInfo = courtData[date]?.[`${timeSlot.toString().padStart(2, "0")}:00`];
    if (!courtInfo) return "white";

    const occupancyRate = (courtInfo.reserved / courtInfo.total) * 100;

    if (occupancyRate === 100) return "#FF0000";
    if (occupancyRate >= 50) return "#006400";
    if (occupancyRate > 0) return "#90EE90";
    return "white";
  };

  // Event Handlers
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

  // Prepare data for court availability table
  const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i);
  const transposedData = timeSlots.map((hour) => {
    const rowData = { time: `${hour}:00` };
    days.forEach((day) => {
      rowData[day] = courtData[day]?.[`${hour.toString().padStart(2, "0")}:00`] || null;
    });
    return rowData;
  });

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppMenubar />
      <div style={{ flex: 1, display: 'flex', overflow: "hidden" }}>
        {/* Left Side: Court Availability */}
        <div style={{ width: '60%', overflow: 'auto', padding: '20px' }}>
          <h2 className="text-2xl font-bold mb-4">場地登記情況</h2>
          {days.length > 0 ? (
            <DataTable
              value={transposedData}
              scrollable
              scrollHeight="calc(100vh - 200px)"
              tableStyle={{ minWidth: "100%" }}
              style={{
                width: "100%",
                border: "1px solid #ddd",
                margin: 0,
                padding: 0,
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

        {/* Right Side: Team and Time Selection */}
        <div style={{ width: '40%', padding: '20px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
          <h2 className="text-2xl font-bold mb-6">選擇隊伍與時段</h2>
          <div className="mb-6">
            <label htmlFor="dateSelect" className="block mb-2 font-semibold">登記日期:</label>
            <Dropdown
              id="dateSelect"
              value={selectedDate}
              options={days.map((day) => ({ label: day, value: day }))}
              onChange={(e) => setSelectedDate(e.value)}
              className="w-full"
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
            <label htmlFor="timeSlotSelect" className="block mb-2 font-semibold">選擇時間段:</label>
            <select
              id="timeSlotSelect"
              value={selectedTimeSlot}
              onChange={handleTimeSlotSelection}
              className="w-full p-2 border rounded"
            >
              <option value="">請選擇時間段</option>
              {Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`).map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Confirm Button */}
          <Button
            label="確認登記"
            className="p-button-primary w-full"
            onClick={handleConfirmRegistration}
          />
        </div>
      </div>
    </div>
  );
}