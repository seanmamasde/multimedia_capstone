"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AppMenubar from "../../components/menubar";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";

export default function Register() {
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [courtData, setCourtData] = useState({});
  const router = useRouter();

  useEffect(() => {
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

  const getColorForTimeSlot = (date, timeSlot) => {
    const courtInfo = courtData[date]?.[`${timeSlot.toString().padStart(2, "0")}:00`];
    if (!courtInfo) return "white";

    const occupancyRate = (courtInfo.reserved / courtInfo.total) * 100;

    if (occupancyRate === 100) return "#FF0000";
    if (occupancyRate >= 50) return "#006400";
    if (occupancyRate > 0) return "#90EE90";
    return "white";
  };

  const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i);

  const transposedData = timeSlots.map((hour) => {
    const rowData = { time: `${hour}:00` };
    days.forEach((day) => {
      rowData[day] = courtData[day]?.[`${hour.toString().padStart(2, "0")}:00`] || null;
    });
    return rowData;
  });

  const handleRegister = () => {
    router.push(`/play/register/team_time?date=${selectedDate}`);
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        height: "100vh",
        overflow: "hidden", // Disable page scrolling
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppMenubar />
      <div style={{ flex: 1, overflow: "auto", paddingTop: "40px" }}> {/* Reduced paddingTop */}
        {days.length > 0 ? (
          <div style={{ paddingBottom: "80px" }}>
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
              {/* Frozen Column (First Column) */}
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
              {/* Dynamic Columns for Dates */}
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
          </div>
        ) : (
          <p style={{ textAlign: "center" }}>載入中...</p>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "20px",
          height: "80px",
          borderTop: "1px solid #ddd",
          padding: "10px",
          backgroundColor: "white",
          position: "sticky",
          bottom: 0,
          zIndex: 10
        }}
      >
        <Dropdown
          value={selectedDate}
          options={days.map((day) => ({ label: day, value: day }))}
          onChange={(e) => setSelectedDate(e.value)}
          placeholder="選擇日期"
          style={{
            width: "150px",
            marginRight: "10px"
          }}
        />
        <Button
          label="開始登記"
          className="p-button-primary"
          onClick={handleRegister}
          style={{ width: "100px" }}
        />
      </div>
    </div>
  );
}
