"use client";

import AppMenubar from "../menubar";
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import "@/style/teams.css"
import { decodeJwt } from "@/utils/jwtAuth";

export default function Team() {
  const [teams, setTeams] = useState([]);
  const [refresh, setRefresh] = useState(false);
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

  const RedirectEditTeams = (e, params) => {
    e.preventDefault();
    router.push(`/team/edit${params}`);
  }

  const RedirectCreateTeam = (e) => {
    e.preventDefault();
    router.push("/team/create")
  }

  const deleteTeam = (e, tid, tname) => {
    e.preventDefault();

    const confirmDelete = window.confirm(`確定要刪除${ tname }嗎?`);
    if (!confirmDelete) return;

    fetch("/api/dbConnect/deleteTeam", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tid: tid })
      });
    
    setRefresh(prev => !prev);
  }

  const RenderTeams = () => {
    return (
      <div className="teams-field">
        {teams.map((team, index) => (
          <div key={index} className="teams-container">
            <div onClick={(e) => RedirectEditTeams(e, `?tid=${team.id}`)}>
              <h2>{team.teamname}</h2>
              <p>Members: {team.memberNum}</p>
              <ul>
                {Array.from({ length: team.memberNum }).map((_, i) => (
                  <li key={i}>{team[`uname${i + 1}`]}</li>
                ))}
              </ul>
            </div>
            <input type="button" value="✖" onClick={(e) => deleteTeam(e, team.id, team.teamname)}></input>
          </div>
        ))}
        <input className = "teams-create" type="button" value="+" onClick={RedirectCreateTeam}></input>
      </div>
    );
  }

  return (
    <div>
      <AppMenubar />
      <h1>我的隊伍</h1>
      <RenderTeams />
    </div>
  );
}
