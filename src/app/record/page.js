"use client";

import React, { useState, useEffect } from "react";
import AppMenubar from "../components/menubar";
import { decodeJwt } from "@/utils/jwtAuth";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import "./page.css";

export default function RecordPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    multiSortMeta: [],
    filters: {
      teamName: { value: null, matchMode: "contains" },
      date: { value: null, matchMode: "contains" },
      status: { value: null, matchMode: "contains" },
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return "未提供";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const checkStatus = (isWaitlist, isExpired) => {
    if (isExpired) return "已結束";
    return isWaitlist ? "候補中" : "已登記";
  };

  const fetchUserRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const payload = JSON.parse(decodeJwt(token));

      // Fetch teams by username
      const teamsResponse = await fetch(
        `/api/dbConnect/teamsByUname?uname=${payload.username}`
      );
      if (!teamsResponse.ok) {
        throw new Error("Failed to fetch teams");
      }

      const teamsData = await teamsResponse.json();

      // Fetch court records
      const courtsPromises = teamsData.map((team) =>
        fetch(`/api/courts?teamId=${team.id}&includeWaitlist=true`)
          .then((res) => res.json())
          .then((courts) => {
            return courts.map((court) => {
              const courtDate = new Date(court.date);
              const courtEndTime = new Date(
                courtDate.toISOString().split("T")[0] + " " + court.timeSlot
              );

              // Extend expiration time by 1 hour
              const extendedEndTime = new Date(courtEndTime.getTime() + 60 * 60 * 1000);

              return {
                ...court,
                isExpired: extendedEndTime < new Date(), // Check if expired
                recordType: 'court'
              };
            });
          })
      );

      // Fetch reservations
      const reservationsPromises = teamsData.map((team) =>
        fetch(`/api/reservations?teamId=${team.id}`)
          .then((res) => res.json())
          .then((reservations) => {
            return reservations.map((reservation) => ({
              ...reservation,
              teamName: team.teamname,
              recordType: 'reservation'
            }));
          })
      );

      const courtsData = await Promise.all(courtsPromises);
      const reservationsData = await Promise.all(reservationsPromises);

      // Combine and process records
      const formattedRecords = [];

      // Process court records
      teamsData.forEach((team, index) => {
        const teamCourts = courtsData[index];
        teamCourts.forEach((court) => {
          const teams = court.teams;
          const isWaitlisted = (court.waitlistTeams || []).includes(team.id);

          if (teams[team.id] || isWaitlisted) {
            formattedRecords.push({
              id: `court-${team.id}-${court.date}-${court.timeSlot}`,
              teamName: team.teamname,
              teamId: team.id,
              date: formatDate(court.date),
              time: court.timeSlot,
              status: checkStatus(isWaitlisted, court.isExpired),
              venue: isWaitlisted ? "候補中" : teams[team.id] || "未提供",
              recordType: 'court',
              originalDate: court.date,
              isWaitlisted: isWaitlisted,
              isExpired: court.isExpired,
            });
          }
        });
      });

      // Process reservation records
      teamsData.forEach((team, index) => {
        const teamReservations = reservationsData[index];
        teamReservations.forEach((reservation) => {
          if (reservation.preferences.first) {
            formattedRecords.push({
              id: `${reservation._id}`,
              teamName: team.teamname,
              teamId: team.id,
              date: formatDate(reservation.date),
              time: reservation.preferences.first,
              status: reservation.status === 'pending'
                ? `志願一`
                : reservation.status,
              venue: "待確認",
              recordType: 'reservation',
              originalDate: reservation.date,
              isExpired: new Date(reservation.date) < new Date(),
              preferences: reservation.preferences,
            });
          }
          if (reservation.preferences.second) {
            formattedRecords.push({
              id: `${reservation._id}`,
              teamName: team.teamname,
              teamId: team.id,
              date: formatDate(reservation.date),
              time: reservation.preferences.second,
              status: reservation.status === 'pending'
                ? `志願二`
                : reservation.status,
              venue: "待確認",
              recordType: 'reservation',
              originalDate: reservation.date,
              isExpired: new Date(reservation.date) < new Date(),
              preferences: reservation.preferences,
            });
          }
          if (reservation.preferences.third) {
            formattedRecords.push({
              id: `${reservation._id}`,
              teamName: team.teamname,
              teamId: team.id,
              date: formatDate(reservation.date),
              time: reservation.preferences.third,
              status: reservation.status === 'pending'
                ? `志願三`
                : reservation.status,
              venue: "待確認",
              recordType: 'reservation',
              originalDate: reservation.date,
              isExpired: new Date(reservation.date) < new Date(),
              preferences: reservation.preferences,
            });
          }
        });
      });

      // Sort records
      const finalRecords = formattedRecords.sort((a, b) => {
        return new Date(a.originalDate) - new Date(b.originalDate);
      });

      setRecords(finalRecords);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getFilteredAndSortedRecords = () => {
    let filtered = [...records];

    // Filtering logic remains the same
    Object.keys(lazyState.filters).forEach((field) => {
      const filter = lazyState.filters[field];
      if (filter && filter.value) {
        const value = filter.value.toLowerCase();
        filtered = filtered.filter((item) => {
          const fieldValue = (item[field] || "").toString().toLowerCase();
          return fieldValue.includes(value);
        });
      }
    });

    // Multiple sorting logic
    if (lazyState.multiSortMeta && lazyState.multiSortMeta.length > 0) {
      filtered.sort((data1, data2) => {
        for (let i = 0; i < lazyState.multiSortMeta.length; i++) {
          const meta = lazyState.multiSortMeta[i];
          const value1 = data1[meta.field];
          const value2 = data2[meta.field];

          let result = 0;
          if (value1 < value2) result = -1;
          else if (value1 > value2) result = 1;

          // If a difference is found, return according to the order
          if (result !== 0) {
            return meta.order * result;
          }
        }
        return 0;
      });
    }

    return filtered;
  };

  const onPage = (event) => {
    setLazyState((prev) => ({ ...prev, first: event.first, rows: event.rows }));
  };

  const onSort = (event) => {
    setLazyState((prev) => {
      const existingMeta = prev.multiSortMeta || [];
      const newMeta = event.multiSortMeta || [];

      // If no sort meta is provided, clear all sorting
      if (newMeta.length === 0) {
        return {
          ...prev,
          multiSortMeta: []
        };
      }

      const lastClicked = newMeta[0];
      const existingSort = existingMeta.find((m) => m.field === lastClicked.field);

      // Handle cycling for the clicked column
      if (existingSort) {
        if (existingSort.order === 1) {
          // Ascending -> Descending
          return {
            ...prev,
            multiSortMeta: [
              ...existingMeta.filter((m) => m.field !== lastClicked.field), // Remove old sort
              { field: lastClicked.field, order: -1 } // Add descending sort
            ]
          };
        } else if (existingSort.order === -1) {
          // Descending -> Remove sort
          return {
            ...prev,
            multiSortMeta: existingMeta.filter((m) => m.field !== lastClicked.field) // Remove sort entirely
          };
        }
      } else {
        // If no existing sort for this field, add ascending sort
        return {
          ...prev,
          multiSortMeta: [
            ...existingMeta, // Preserve existing sorting
            { field: lastClicked.field, order: 1 } // Add ascending sort
          ]
        };
      }
    });
  };

  const onFilter = (event) => {
    setLazyState((prev) => ({
      ...prev,
      first: 0,
      filters: event.filters,
    }));
  };

  useEffect(() => {
    fetchUserRecords();
  }, [router]);

  if (loading) return <div className="loading-screen">載入中...</div>;
  if (error) return <div className="error-screen">發生錯誤: {error}</div>;

  const filteredSortedRecords = getFilteredAndSortedRecords();
  const displayedRecords = filteredSortedRecords.slice(
    lazyState.first,
    lazyState.first + lazyState.rows
  );
  const totalFilteredRecords = filteredSortedRecords.length;

  const handleCancelRegistration = async (record) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const isConfirmed = window.confirm(
        `確定要取消登記以下紀錄嗎？\n\n隊伍名稱：${record.teamName}\n日期：${record.date}\n時間：${record.time}`
      );

      if (!isConfirmed)
        return;

      let response;
      if (record.recordType === 'court') {
        response = await fetch("/api/courts", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: record.originalDate,
            timeSlot: record.time,
            cancelledTeamId: record.teamId,
          }),
        });
      } else if (record.recordType === 'reservation') {
        const reservationId = record.id;
        response = await fetch("/api/reservations", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reservationId: reservationId,
          }),
        });
      }

      if (response.ok) {
        await fetchUserRecords();
        alert("取消成功");
      } else {
        const errorData = await response.json();
        alert(`取消失敗: ${errorData.message}`);
      }
    } catch (err) {
      console.error("Error cancelling registration:", err);
      alert("取消時發生錯誤");
    }
  };

  const actionTemplate = (rowData) => {
    let label = '';
    if (rowData.recordType === 'court') label = '取消登記';
    else if (rowData.status === '志願一') label = '取消預約';
    else
      return (
        <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
          {/* empty place holder to stretch height */}
        </div>
      );

    return (
      <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
        <Button
          label={label}
          className=" p-button-danger"
          onClick={() => handleCancelRegistration(rowData)}
          disabled={rowData.isExpired}
          style={{ width: "100%", borderRadius: "6px" }}
        />
      </div>
    );
  };

  // const removeSorting = () => {
  //   return (
  //     <div style={{ display: "flex", justifyContent: "flex-end" }}>
  //       <Button
  //         label="清除排序"
  //         icon="pi pi-times"
  //         onClick={() => setLazyState((prev) => ({ ...prev, multiSortMeta: [] }))}
  //         disabled={lazyState.multiSortMeta.length === 0}
  //       />
  //     </div>
  //   );
  // };

  return (
    <div>
      <AppMenubar />
      <div className="records-table-container">
        <h1 className="title">查詢紀錄</h1>
        <DataTable
          // header={removeSorting}
          value={displayedRecords}
          className="records-table"
          stripedRows
          lazy
          paginator
          // removableSort
          // filterDisplay="row"
          rows={lazyState.rows}
          rowGroupMode="rowspan"
          groupRowsBy={['teamName', 'date']}
          first={lazyState.first}
          totalRecords={totalFilteredRecords}
          onPage={onPage}
          onSort={onSort}
          onFilter={onFilter}
          sortMode="multiple"
          multiSortMeta={lazyState.multiSortMeta}
          filters={lazyState.filters}
          loading={loading}
          emptyMessage="沒有相關紀錄"
          tableStyle={{ minWidth: "60rem" }}
        >
          <Column
            field="teamName"
            header="隊伍名稱"
            alignHeader="center"
            style={{ textAlign: "center", width: "5rem" }}
            sortable
          ></Column>
          <Column
            field="date"
            header="日期"
            alignHeader="center"
            style={{ textAlign: "center", width: "5rem" }}
            sortable
          ></Column>
          <Column
            field="time"
            header="時間"
            alignHeader="center"
            style={{ textAlign: "center", width: "5rem" }}
            sortable
          ></Column>
          <Column
            field="status"
            header="狀態"
            // filter
            // filterPlaceholder="搜尋"
            alignHeader="center"
            style={{ textAlign: "center", width: "5rem" }}
            sortable
          ></Column>
          <Column
            field="venue"
            header="場地"
            alignHeader="center"
            style={{ textAlign: "center", width: "5rem" }}
            sortable
          ></Column>
          <Column
            body={actionTemplate}
            header="操作"
            alignHeader="center"
            style={{ textAlign: "center", width: "5rem" }}
          ></Column>
        </DataTable>
      </div>
    </div>
  );
}
