"use client";

import AppMenubar from "../components/menubar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/utils/jwtAuth";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import "./page.css";

export default function Team() {
  const [teams, setTeams] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const router = useRouter();

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
    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }

    const fetchUsers = async () => {
      const res = await fetch(`/api/dbConnect/teamsByUname?uname=${username}`);
      const data = await res.json();
      setTeams(data);
    };

    fetchUsers();
  }, [router, refresh]);

  const RedirectEditTeams = (params) => {
    router.push(`/team/edit${params}`);
  };

  const RedirectCreateTeam = () => {
    router.push("/team/create");
  };

  const deleteTeam = async () => {
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
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-pencil"
          className="p-button-text p-button-info"
          onClick={() => RedirectEditTeams(`?tid=${rowData.id}`)}
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

  const dialogFooter = (
    <div>
      <Button
        label="取消"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setConfirmDelete(false)}
      />
      <Button
        label="確認刪除"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={deleteTeam}
      />
    </div>
  );

  const renderFooter = () => {
    return (
      <div className="footer-container">
        <Button
          icon="pi pi-plus"
          label="新增隊伍"
          className="p-button-text p-button-plus"
          onClick={RedirectCreateTeam}
        />
      </div>
    );
  };

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
          footer={renderFooter()} // Provide a footer as a div
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
      <Dialog
        header="確認刪除"
        visible={confirmDelete}
        style={{ width: "400px" }}
        modal
        footer={dialogFooter}
        onHide={() => setConfirmDelete(false)}
      >
        <p>確定要刪除 {deleteData?.teamname} 嗎?</p>
      </Dialog>
    </div>
  );
}
