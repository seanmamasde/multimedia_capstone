// // src/app/play/reserve/page.js
// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import AppMenubar from "../../menubar";

// export default function Reserve() {
//   const [days, setDays] = useState([]);
//   const [selectedDate, setSelectedDate] = useState("");
//   const [courtData, setCourtData] = useState({});
//   const router = useRouter();

//   useEffect(() => {
//     const today = new Date();
//     const generatedDays = Array.from({ length: 7 }, (_, i) => {
//       const date = new Date();
//       date.setDate(today.getDate() + 7 + i);
//       return date.toISOString().split("T")[0];
//     });

//     setDays(generatedDays);
//     setSelectedDate(generatedDays[0]);

//     // Fetch court data
//     fetchCourtData(generatedDays[0], generatedDays[generatedDays.length - 1]);
//   }, []);

//   const fetchCourtData = async (startDate, endDate) => {
//     try {
//       const response = await fetch(
//         `/api/courts?startDate=${startDate}&endDate=${endDate}`
//       );
//       const data = await response.json();
      
//       // Transform data into a more usable format
//       const transformed = {};
//       data.forEach(court => {
//         const dateKey = new Date(court.date).toISOString().split('T')[0];
//         if (!transformed[dateKey]) {
//           transformed[dateKey] = {};
//         }
//         transformed[dateKey][court.timeSlot] = {
//           reserved: court.reservedCourts,
//           total: court.totalCourts
//         };
//       });
//       setCourtData(transformed);
//     } catch (error) {
//       // console.error("Error fetching court data:", error);
//     }
//   };

//   const getColorForTimeSlot = (date, timeSlot) => {
//     const courtInfo = courtData[date]?.[`${timeSlot.toString().padStart(2, '0')}:00`];
//     if (!courtInfo) return "white"; // Default color for no data

//     const occupancyRate = (courtInfo.reserved / courtInfo.total) * 100;
    
//     if (occupancyRate == 100) return "#FF0000";
//     if (occupancyRate >= 50) return "#006400";
//     if (occupancyRate > 0) return "#90EE90";
//     return "white";
//   };

//   const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i);

//   const handleReserve = () => {
//     router.push(`/play/reserve/team_time?date=${selectedDate}`);
//   };

//   return (
//     <div>
//       <AppMenubar />
//       <div className="p-6">
//         <h1 className="text-2xl font-bold mb-6">預約下週 Reservation</h1>
//         {days.length > 0 ? (
//           <>
//             <div style={{ overflowX: 'auto' }}>
//               <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
//                 <thead>
//                   <tr>
//                     <th style={{
//                       border: '1px solid black',
//                       padding: '8px',
//                       textAlign: 'center',
//                       backgroundColor: '#f0f0f0',
//                       minWidth: '120px'
//                     }}>
//                       日期
//                     </th>
//                     {timeSlots.map((hour) => (
//                       <th key={hour} style={{
//                         border: '1px solid black',
//                         padding: '8px',
//                         textAlign: 'center',
//                         backgroundColor: '#f0f0f0',
//                         minWidth: '80px'
//                       }}>
//                         {`${hour}:00`}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {days.map((day) => (
//                     <tr key={day}>
//                       <td style={{
//                         border: '1px solid black',
//                         padding: '8px',
//                         textAlign: 'center',
//                         backgroundColor: '#f0f0f0'
//                       }}>
//                         {day}
//                       </td>
//                       {timeSlots.map((hour) => (
//                         <td
//                           key={`${day}-${hour}`}
//                           style={{
//                             border: '1px solid black',
//                             backgroundColor: getColorForTimeSlot(day, hour),
//                             width: '80px',
//                             height: '40px',
//                             padding: '0',
//                           }}
//                         >
//                           &nbsp;
//                         </td>
//                       ))}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             <div style={{
//               marginTop: '20px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '10px'
//             }}>
//               <label htmlFor="dateSelect" style={{ whiteSpace: 'nowrap' }}>選擇日期:</label>
//               <select
//                 id="dateSelect"
//                 value={selectedDate}
//                 onChange={(e) => setSelectedDate(e.target.value)}
//                 style={{
//                   padding: '8px',
//                   borderRadius: '4px',
//                   border: '1px solid #ddd'
//                 }}
//               >
//                 {days.map((day) => (
//                   <option key={day} value={day}>
//                     {day}
//                   </option>
//                 ))}
//               </select>
//               <button
//                 onClick={handleReserve}
//                 style={{
//                   backgroundColor: '#2196F3',
//                   color: 'white',
//                   padding: '8px 16px',
//                   borderRadius: '4px',
//                   border: 'none',
//                   cursor: 'pointer'
//                 }}
//               >
//                 開始預約
//               </button>
//             </div>
//           </>
//         ) : (
//           <p>載入中...</p>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AppMenubar from "../../menubar";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";

export default function Reserve() {
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [courtData, setCourtData] = useState({});
  const router = useRouter();

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

  const handleReserve = () => {
    router.push(`/play/reserve?date=${selectedDate}`);
  };

  return (
    <div style={{ margin: 0, padding: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppMenubar />
      <div style={{ flex: 1, overflow: "hidden",  paddingTop: "30px" }}>
        {days.length > 0 ? (
          <div style={{ height: "calc(100vh - 140px)", overflowY: "auto" }}>
            <DataTable
              value={transposedData}
              scrollable
              scrollHeight="calc(100vh - 140px)"
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
          gap: "10px",
          height: "80px",
          borderTop: "1px solid #ddd",
          padding: "10px",
        }}
      >
        <Dropdown
          value={selectedDate}
          options={days.map((day) => ({ label: day, value: day }))}
          onChange={(e) => setSelectedDate(e.value)}
          placeholder="選擇日期"
          style={{ width: "150px" }}
        />
        <Button
          label="預約"
          icon="pi pi-check"
          className="p-button-primary"
          onClick={handleReserve}
          style={{ width: "120px" }}
        />
      </div>
    </div>
  );
}
