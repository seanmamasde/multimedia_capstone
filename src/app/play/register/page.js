"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/utils/jwtAuth";
import AppMenubar from "../../components/menubar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import "./page.css";

export default function CourtRegistration() {
  const router = useRouter();
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [courtData, setCourtData] = useState({});

  // Introduce a refresh state
  const [refresh, setRefresh] = useState(false);

  // Team selection states
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamDetails, setTeamDetails] = useState(null);
  const [username, setUsername] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // Confirmation dialog states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sidebar for registration panel
  const [showSidebar, setShowSidebar] = useState(false);

  // Generate time slots
  const timeSlotOptions = Array.from({ length: 15 }, (_, i) => {
    const slot = `${(i + 8).toString().padStart(2, '0')}:00`;
    return { label: slot, value: slot };
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    let uname;
    try {
      const payload = JSON.parse(decodeJwt(token));
      uname = payload.username;
      setUsername(uname);
    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    // Generate next 7 days
    const today = new Date();
    const generatedDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      return date.toISOString().split("T")[0];
    });

    setDays(generatedDays);
    setSelectedDate((prev) => prev || generatedDays[0]);

    fetchUserTeams(uname);
    fetchCourtData(generatedDays[0], generatedDays[generatedDays.length - 1]);
  }, [router, refresh]);

  // Fetch teams for the current user
  const fetchUserTeams = async (uname) => {
    try {
      const response = await fetch(`/api/dbConnect/teamsByUname?uname=${uname}`, { cache: 'no-store' });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("獲取隊伍資料錯誤:", error);
    }
  };

  // Fetch court availability data
  const fetchCourtData = async (startDate, endDate) => {
    try {
      const response = await fetch(`/api/courts?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' });
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
      const response = await fetch(`/api/dbConnect/teamByTid?tid=${teamId}`, { cache: 'no-store' });
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

  const getCellBackgroundColor = (date, timeSlot) => {
    const courtInfo = courtData[date]?.[`${timeSlot.toString().padStart(2, "0")}:00`];

    // Empty timestamp logic
    if (!courtInfo) {
      if (timeSlot % 2 === 1) return "#fcfcfc"; // Darker background
      return "#ffffff"; // White background
    }

    // Occupancy rate logic
    const occupancyRate = (courtInfo.reserved / courtInfo.total) * 100;

    if (occupancyRate === 100) return "#FF0000"; // Fully booked
    if (occupancyRate >= 50) return "#006400"; // High occupancy
    if (occupancyRate > 0) return "#90EE90"; // Low occupancy
  };

  const handleTimeSlotSelection = (e) => {
    setSelectedTimeSlot(e.target.value);
  };

  const handleStartRegistration = () => {
    if (!selectedTeam || !selectedTimeSlot) {
      alert("請選擇隊伍和時間段！");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          teamId: selectedTeam,
        }),
      });

      const result = await response.json();
      if (response.status === 200) {
        alert(`登記成功！已分配場地：${result.assignedCourt}`);
        setShowConfirmation(false);
        setShowSidebar(false);
        setRefresh(prev => !prev);
      } else if (response.status === 202) {
        alert(`已加入候補名單！目前候補順位：${result.waitlistPosition}`);
        setShowConfirmation(false);
        setShowSidebar(false);
        setRefresh(prev => !prev);
      } else {
        alert(`登記失敗: ${result.message}`);
      }
    } catch (error) {
      alert('登記過程發生錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
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

  // Table footer (optional) - can be used for a similar button like in /team/page.js
  const renderFooter = () => {
    return (
      <div className="footer-container">
        <Button
          icon="pi pi-bars"
          label="顯示登記面板"
          className="p-button-text p-button-plus"
          onClick={() => setShowSidebar(true)}
        />
      </div>
    );
  };

  return (
    <div>
      <AppMenubar />
      <br />
      <h1 className="title">場地登記</h1>
      <div className="teams-table-container">
        <DataTable
          value={transposedData}
          className="teams-table"
          stripedRows
          emptyMessage="沒有資料"
          scrollable
          scrollHeight="calc(100vh - 250px)"
          tableStyle={{ minWidth: "60rem" }}
          footer={renderFooter()}
        >
          <Column
            field="time"
            header="時間"
            alignHeader="center"
            style={{ textAlign: "center", whiteSpace: "nowrap", backgroundColor: "#f7f7f7" }}
            frozen
          />
          {days.map((day) => (
            <Column
              key={day}
              field={day}
              header={day}
              alignHeader="center"
              body={(rowData) => {
                const bgColor = getCellBackgroundColor(day, parseInt(rowData.time, 10));
                return (
                  <div
                    style={{
                      backgroundColor: bgColor,
                      width: "128px",
                      height: "72px",
                      marginTop: "-16px",
                      marginBottom: "-16px",
                      marginLeft: "-16px",
                      marginRight: "-16px",
                    }}
                  />
                );
              }}
              style={(rowData) => ({
                textAlign: "center",
                whiteSpace: "nowrap",
                padding: "0",
              })}
            />
          ))}
        </DataTable>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        header="確認登記資訊"
        visible={showConfirmation}
        style={{ width: "30rem" }}
        modal
        onHide={() => setShowConfirmation(false)}
      >
        {teamDetails && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>隊伍名稱:</strong> {teamDetails.teamname}</p>
            <p><strong>日期:</strong> {selectedDate}</p>
            <p><strong>時段:</strong> {selectedTimeSlot}</p>
            <p><strong>隊伍成員:</strong></p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              {Array.from({ length: teamDetails.memberNum }).map((_, idx) => (
                <li key={idx}>
                  {teamDetails[`uname${idx + 1}`]}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: "4rem", marginTop: "2rem" }}>
          <Button
            label="取消"
            className="p-button-text"
            onClick={() => setShowConfirmation(false)}
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? "處理中..." : "確認登記"}
            className="p-button-primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          />
        </div>
      </Dialog>

      {/* Sidebar for Registration Panel */}
      <Sidebar visible={showSidebar} position="right" onHide={() => setShowSidebar(false)} style={{ width: '300px' }}>
        <h2 className="sidebar-title">選擇隊伍與時段</h2>
        <div className="selection-container">
          <label htmlFor="dateSelect" className="form-label">選擇日期:</label>
          <Dropdown
            id="dateSelect"
            value={selectedDate}
            options={days.map((day) => ({ label: day, value: day }))}
            onChange={(e) => setSelectedDate(e.value)}
            className="form-dropdown"
          />
        </div>

        {/* Team Selection */}
        <div className="selection-container">
          <label htmlFor="teamSelect" className="form-label">選擇隊伍:</label>
          <Dropdown
            id="teamSelect"
            value={selectedTeam}
            options={teams.map(t => ({ label: t.teamname, value: t.id }))}
            onChange={handleTeamSelection}
            className="form-dropdown"
            placeholder="選擇隊伍"
          />
        </div>

        {/* Display selected team details */}
        {teamDetails && (
          <Card title="隊伍詳情" className="team-details-card">
            <p><strong>隊伍名稱:</strong> {teamDetails.teamname}</p>
            <p><strong>成員數量:</strong> {teamDetails.memberNum}</p>
            <div className="team-members-list">
              <p><strong>成員列表:</strong></p>
              <ul>
                {Array.from({ length: teamDetails.memberNum }).map((_, idx) => (
                  <li key={idx}>
                    成員 {idx + 1}: {teamDetails[`uname${idx + 1}`]}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        {/* Time Slot Selection */}
        <div className="selection-container">
          <label htmlFor="timeSlotSelect" className="form-label">選擇時段:</label>
          <Dropdown
            id="timeSlotSelect"
            value={selectedTimeSlot}
            options={timeSlotOptions}
            onChange={handleTimeSlotSelection}
            className="form-dropdown"
            placeholder="選擇時段"
          />
        </div>

        {/* Confirm Button */}
        <Button
          label="登記"
          className="p-button-primary w-full confirm-button"
          onClick={handleStartRegistration}
          style={{ marginTop: '1rem' }}
        />
      </Sidebar>
    </div>
  );
}
