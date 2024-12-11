"use client";

import AppMenubar from "../components/menubar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/utils/jwtAuth";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import "./page.css";

export default function Team() {
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // "create" or "edit"

  // Form states for create/edit dialog
  const [teamName, setTeamName] = useState("");
  const [numMembers, setNumMembers] = useState(1);
  const [userNames, setUserNames] = useState(["", "", "", ""]);

  const [uname, setUname] = useState(null);
  const [originalTeam, setOriginalTeam] = useState(null); // For edit comparison
  const [editingTeamId, setEditingTeamId] = useState(null); // Track which team is being edited

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    let username = "";
    try {
      const payload = JSON.parse(decodeJwt(token));
      username = payload.username;
      setUname(username);
    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    fetchUsers(username);
  }, [router, refresh]);

  const fetchUsers = async (username) => {
    if (!username) return;
    const res = await fetch(`/api/dbConnect/teamsByUname?uname=${username}`, { cache: 'no-store' });
    const data = await res.json();
    console.log('Fetched Teams:', data);
    setTeams(data);
  };

  const deleteTeam = async () => {
    try {

      if (!deleteData) return;

      const { id } = deleteData;

      await fetch("/api/dbConnect/deleteTeam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tid: id }),
      });

      setConfirmDelete(false);
      setDeleteData(null);
      setRefresh((prev) => !prev);
      alert("隊伍刪除成功");
    } catch {
      alert("刪除隊伍失敗");
    }
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-info"
          onClick={() => openEditDialog(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-danger"
          onClick={() => {
            setConfirmDelete(true);
            setDeleteData(rowData);
          }}
        />
      </div>
    );
  };

  const emptyPlaceholder = (data) => {
    return data ? data : "-";
  };

  const renderFooter = () => {
    return (
      <div className="footer-container">
        <Button
          icon="pi pi-plus"
          label="新增隊伍"
          className="p-button-text p-button-plus"
          onClick={openCreateDialog}
        />
      </div>
    );
  };

  const openCreateDialog = () => {
    // Reset fields for create mode
    setDialogMode("create");
    setTeamName("");
    setNumMembers(1);
    setUserNames((prev) => {
      const newArr = ["", "", "", ""];
      if (uname) newArr[0] = uname; // current user as first member
      return newArr;
    });
    setEditingTeamId(null);
    setOriginalTeam(null);
    setShowDialog(true);
  };

  const openEditDialog = async (teamData) => {
    // For edit mode, load the team data
    setDialogMode("edit");
    setEditingTeamId(teamData.id);
    setTeamName(teamData.teamname);

    // Determine memberNum based on which uname fields are populated
    const members = [teamData.uname1, teamData.uname2, teamData.uname3, teamData.uname4].filter(u => u);
    const memberNum = members.length;

    setNumMembers(memberNum);
    setUserNames([
      teamData.uname1 || "",
      teamData.uname2 || "",
      teamData.uname3 || "",
      teamData.uname4 || "",
    ]);

    setOriginalTeam(teamData);
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that current user is part of the team
    if (!userNames.slice(0, numMembers).includes(uname)) {
      alert(`你必須是隊伍的一員。`);
      return;
    }

    // Validate all users
    const validateRes = await fetch("/api/dbConnect/validateUsers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userNames: userNames.slice(0, numMembers) }),
    });

    const data = await validateRes.json();

    if (data.missingUsers.length !== 0) {
      alert(`無效成員 ${data.missingUsers}，請確認成員名稱`);
      return;
    }

    if (dialogMode === "create") {
      // Create team
      const res = await fetch("/api/dbConnect/createTeam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: teamName,
          numMembers: numMembers,
          userNames: userNames,
        }),
      });

      if (res.status === 200) {
        alert("隊伍建立成功");
        setShowDialog(false);
        setRefresh((prev) => !prev);
      } else {
        alert("建立隊伍失敗");
      }
    } else if (dialogMode === "edit") {
      // Check if changed
      const updatedTeam = {
        id: editingTeamId,
        teamname: teamName,
        memberNum: numMembers,
        uname1: userNames[0],
        uname2: userNames[1],
        uname3: userNames[2],
        uname4: userNames[3],
      };

      if (JSON.stringify(updatedTeam) === JSON.stringify(originalTeam)) {
        alert("無改動");
        return;
      }

      const res = await fetch("/api/dbConnect/editTeam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team: updatedTeam }),
      });

      if (res.status === 200) {
        alert("隊伍更新成功");
        setShowDialog(false);
        setRefresh((prev) => !prev);
      } else {
        alert("更新隊伍失敗");
      }
    }
  };

  const memberOptions = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
  ];

  return (
    <div>
      <AppMenubar />
      <br />
      <h1 className="title">隊伍管理</h1>
      <div className="teams-table-container">
        <DataTable
          value={teams}
          className="teams-table"
          stripedRows
          emptyMessage="沒有隊伍"
          tableStyle={{ minWidth: "50rem" }}
          footer={renderFooter()}
        >
          <Column field="teamname" header="隊伍名稱"></Column>
          <Column
            field="uname1"
            header="成員 1"
            body={(rowData) => emptyPlaceholder(rowData.uname1)}
          ></Column>
          <Column
            field="uname2"
            header="成員 2"
            body={(rowData) => emptyPlaceholder(rowData.uname2)}
          ></Column>
          <Column
            field="uname3"
            header="成員 3"
            body={(rowData) => emptyPlaceholder(rowData.uname3)}
          ></Column>
          <Column
            field="uname4"
            header="成員 4"
            body={(rowData) => emptyPlaceholder(rowData.uname4)}
          ></Column>
          <Column
            body={actionTemplate}
            header="操作"
            alignHeader="center"
            style={{ textAlign: "center" }}
          ></Column>
        </DataTable>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog
        header="確認刪除"
        visible={confirmDelete}
        style={{ width: "20rem" }}
        modal
        onHide={() => setConfirmDelete(false)}
      >
        <div style={{ marginTop: "-1rem" }}>
          <p style={{ textAlign: "center" }}>
            確定要刪除 <strong>{deleteData?.teamname}</strong> 嗎?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "4rem", marginTop: "1rem" }}>
            <Button
              label="取消"
              className="p-button-text"
              onClick={() => setConfirmDelete(false)}
            />
            <Button
              label="確認刪除"
              className="p-button-danger"
              onClick={deleteTeam}
            />
          </div>
        </div>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog
        header={dialogMode === "create" ? "建立隊伍" : "編輯隊伍"}
        visible={showDialog}
        style={{ width: "30rem" }}
        modal
        onHide={() => setShowDialog(false)}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginLeft: "-0.25rem" }}>
            {/* Team Name */}
            <div className="team-edit-field" style={{ display: "flex", alignItems: "center", marginBottom: "1rem", marginTop: "0.5rem" }}>
              <label
                htmlFor="teamName"
                style={{ width: "30%", textAlign: "left", marginRight: "1rem" }}
              >
                隊伍名稱:
              </label>
              <InputText
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                style={{ width: "100%", height: "40px" }}
              />
            </div>

            {/* Number of Members */}
            <div className="team-edit-field" style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
              <label
                htmlFor="numMembers"
                style={{ width: "30%", textAlign: "left", marginRight: "1rem" }}
              >
                隊伍人數:
              </label>
              <Dropdown
                id="numMembers"
                value={numMembers}
                onChange={(e) => setNumMembers(e.value)}
                options={memberOptions}
                placeholder="Select Number of Members"
                style={{ width: "100%" }}
              />
            </div>

            {/* Member Inputs */}
            {[...Array(numMembers)].map((_, index) => (
              <div key={index} className="team-edit-field" style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                <label
                  htmlFor={`userName-${index}`}
                  style={{ width: "30%", textAlign: "left", marginRight: "1rem" }}
                >
                  成員 {index + 1}<br />帳號名稱:
                </label>
                <InputText
                  type="text"
                  id={`userName-${index}`}
                  value={userNames[index]}
                  onChange={(e) => {
                    const newUserNames = [...userNames];
                    newUserNames[index] = e.target.value;
                    setUserNames(newUserNames);
                  }}
                  required
                  style={{ width: "100%", height: "40px" }}
                />
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginRight: "25px" }}>
            <Button
              label="取消"
              className="p-button-text"
              onClick={() => setShowDialog(false)}
              style={{ marginRight: "30px" }}
            />
            <Button
              type="submit"
              label={dialogMode === "create" ? "建立" : "更新"}
              className="p-button-primary"
            />
          </div>
        </form>
      </Dialog>
    </div >
  );
}

