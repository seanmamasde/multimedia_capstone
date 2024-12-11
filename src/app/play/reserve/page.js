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

export default function CourtReservation() {
  const router = useRouter();
  const max_courts = 60.0;

  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [courtData, setCourtData] = useState({});

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamDetails, setTeamDetails] = useState(null);
  const [username, setUsername] = useState(null);

  const [preferences, setPreferences] = useState({
    first: "",
    second: "",
    third: ""
  });

  // Sidebar and confirmation states
  const [showSidebar, setShowSidebar] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Introduce refresh state in case we want to refetch after changes
  const [refresh, setRefresh] = useState(false);

  const timeSlots = Array.from({ length: 15 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const today = new Date();
    const generatedDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      // Reserve scenario: next 7 days offset (just as original code states)
      date.setDate(today.getDate() + 7 + i);
      return date.toISOString().split("T")[0];
    });

    setDays(generatedDays);
    setSelectedDate(generatedDays[0]);

    fetchCourtData(generatedDays[0], generatedDays[generatedDays.length - 1]);

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
  }, [router, refresh]);

  const fetchCourtData = async (startDate, endDate) => {
    try {
      const response = await fetch(`/api/dbConnect/getReservation?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' });

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

        const firstPref = reservation.preferences.first;
        if (!transformed[dateKey][firstPref])
          transformed[dateKey][firstPref] = 1;
        else
          transformed[dateKey][firstPref]++;
      });

      setCourtData(transformed);
    } catch (error) {
      console.error("Error fetching court data:", error);
    }
  };

  const fetchUserTeams = async (uname) => {
    try {
      const response = await fetch(`/api/dbConnect/teamsByUname?uname=${uname}`, { cache: 'no-store' });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("獲取隊伍資料錯誤:", error);
    }
  };

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

  const getColorForTimeSlot = (date, timeSlot) => {
    const courts = courtData[date]?.[`${timeSlot.toString().padStart(2, "0")}:00`];
    if (!courts) return "white";

    if (courts >= 30) return "#FF0000";
    if (courts >= 6) return "#006400";
    if (courts >= 1) return "#90EE90";
    return "white";
  };

  const getCellBackgroundColor = (date, timeSlot) => {
    const courts = courtData[date]?.[`${timeSlot.toString().padStart(2, "0")}:00`];

    // Empty timestamp logic
    if (!courts) {
      if (timeSlot % 2 === 1) return "#fcfcfc"; // Darker background
      return "#ffffff"; // White background
    }

    if (courts >= 30) return "#FF0000"; // Fully booked
    if (courts >= 6) return "#006400"; // High occupancy
    if (courts >= 1) return "#90EE90"; // Low occupancy
  };

  const transposedData = Array.from({ length: 15 }, (_, i) => {
    const hour = 8 + i;
    const rowData = { time: `${hour}:00` };
    days.forEach((day) => {
      rowData[day] = courtData[day]?.[`${hour.toString().padStart(2, "0")}:00`] || null;
    });
    return rowData;
  });

  const handleTeamSelection = (e) => {
    const teamId = e.value;
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
    if (!preferences.first) {
      alert("請至少選擇第一志願時段！");
      return false;
    }
    if (!selectedTeam) {
      alert("請選擇隊伍！");
      return false;
    }
    return true;
  };

  const handleStartReservation = () => {
    if (!validatePreferences()) return;
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const { first, second, third } = preferences;
      const response = await fetch("/api/reserve_courts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          teamId: selectedTeam,
          preferences: { first, second, third },
        }),
      });

      if (response.ok) {
        alert("預約成功！");
        setShowConfirmation(false);
        setShowSidebar(false);
        setRefresh(prev => !prev);
      } else {
        const error = await response.json();
        alert(`預約失敗: ${error.message}`);
      }
    } catch (error) {
      alert("預約過程發生錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlotOptions = timeSlots.map(ts => ({ label: ts, value: ts }));

  // Table footer: Show Sidebar Button
  const renderFooter = () => {
    return (
      <div className="footer-container">
        <Button
          icon="pi pi-bars"
          label="顯示預約面板"
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
      <h1 className="title">場地預約</h1>
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
        header="確認預約資訊"
        visible={showConfirmation}
        style={{ width: "30rem" }}
        modal
        onHide={() => setShowConfirmation(false)}
      >
        {teamDetails && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>隊伍名稱:</strong> {teamDetails.teamname}</p>
            <p><strong>日期:</strong> {selectedDate}</p>
            <p><strong>志願時段:</strong></p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              {preferences.first && <li>第一志願: {preferences.first}</li>}
              {preferences.second && <li>第二志願: {preferences.second}</li>}
              {preferences.third && <li>第三志願: {preferences.third}</li>}
            </ul>
            <p><strong>隊伍成員:</strong></p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              {Array.from({ length: teamDetails.memberNum }).map((_, idx) => (
                <li key={idx}>{teamDetails[`uname${idx + 1}`]}</li>
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
            label={isSubmitting ? "處理中..." : "確認預約"}
            className="p-button-primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          />
        </div>
      </Dialog>

      {/* Sidebar for Reservation Panel */}
      <Sidebar visible={showSidebar} position="right" onHide={() => setShowSidebar(false)} style={{ width: '300px' }}>
        <h2 className="sidebar-title">選擇日期、隊伍與時段</h2>

        {/* Date Selection */}
        <div className="selection-container">
          <label className="form-label">選擇日期:</label>
          <Dropdown
            value={selectedDate}
            options={days.map((day) => ({ label: day, value: day }))}
            onChange={(e) => setSelectedDate(e.value)}
            className="form-dropdown"
            placeholder="選擇日期"
          />
        </div>

        {/* Team Selection */}
        <div className="selection-container">
          <label className="form-label">選擇隊伍:</label>
          <Dropdown
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

        {/* Preferences */}
        <div>
          <h3 className="preferences-title">選擇時段志願</h3>
          <p className="preferences-instruction">第一志願為<strong>必填</strong>，第二、三志願為<strong>選填</strong>。</p>
          <div className="selection-container">
            <label className="form-label">第一志願時段:</label>
            <Dropdown
              value={preferences.first}
              options={timeSlotOptions}
              onChange={(e) => handlePreferenceChange('first', e.value)}
              className="form-dropdown"
              placeholder="選擇第一志願時段"
            />
          </div>
          <div className="selection-container">
            <label className="form-label">第二志願時段: (選填)</label>
            <Dropdown
              value={preferences.second}
              options={timeSlotOptions}
              onChange={(e) => handlePreferenceChange('second', e.value)}
              className="form-dropdown"
              placeholder="選擇第二志願時段"
            />
          </div>
          <div className="selection-container">
            <label className="form-label">第三志願時段: (選填)</label>
            <Dropdown
              value={preferences.third}
              options={timeSlotOptions}
              onChange={(e) => handlePreferenceChange('third', e.value)}
              className="form-dropdown"
              placeholder="選擇第三志願時段"
            />
          </div>
        </div>

        <Button
          label="預約"
          className="p-button-primary w-full confirm-button"
          onClick={handleStartReservation}
          style={{ marginTop: '1rem' }}
        />
      </Sidebar>
    </div >
  );
}
