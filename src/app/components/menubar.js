"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menubar } from "primereact/menubar";
import { Menu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import "../components/menubar.css";

export default function AppMenubar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const avatarMenu = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(decodeJwt(token));
      setUser(payload.username);
    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);

  const decodeJwt = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const isActive = (route) => (pathname === route ? "activeMenuItem" : "");

  const items = [
    {
      label: "首頁",
      icon: "pi pi-home",
      command: () => router.push("/home"),
      className: isActive("/home"),
    },
    {
      label: "我的隊伍",
      icon: "pi pi-users",
      command: () => router.push("/team"),
      className: isActive("/team"),
    },
    {
      label: "打球",
      icon: "pi pi-folder",
      items: [
        {
          label: "登記當週",
          icon: "pi pi-bolt",
          command: () => router.push("/play/register"),
          className: isActive("/play/register"),
        },
        {
          label: "預約下週",
          icon: "pi pi-palette",
          command: () => router.push("/play/reserve"),
          className: isActive("/play/reserve"),
        },
      ],
    },
    {
      label: "查詢紀錄",
      icon: "pi pi-table",
      command: () => router.push("/record"),
      className: isActive("/record"),
    },
  ];

  const avatarMenuItems = [
    { label: "Profile", icon: "pi pi-user", command: () => router.push("/profile") },
    // { label: "Settings", icon: "pi pi-cog", command: () => router.push("/settings") },
    { label: "Logout", icon: "pi pi-sign-out", command: handleLogout },
  ];

  const start = (
    <img
      alt="logo"
      src="/assets/nycu_logo.svg"
      height="16"
      className="logo"
    />
  );

  const end = user && (
    <div className="flex align-items-center gap-2">
      <Avatar
        label={user[0].toUpperCase()}
        shape="circle"
        className="customAvatar p-avatar-circle"
        onClick={(e) => avatarMenu.current.toggle(e)}
      />
      <Menu model={avatarMenuItems} popup ref={avatarMenu} className="avatarMenu" />
    </div>
  );

  return (
    <div className="customMenubar">
      <Menubar model={items} start={start} end={end} />
    </div>
  );
}
