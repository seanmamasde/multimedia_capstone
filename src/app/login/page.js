"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberedUsername");
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem("token", token);
      router.push("/home");
    } else {
      const { error } = await res.json();
      setError(error);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>羽球場地預約系統</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label>帳號</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div>
            <label>密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.checkboxGroup}>
            <label style={styles.checkbox}>
              <input type="checkbox" /> 記住我
            </label>
            <span style={styles.forgotPassword} onClick={() => router.push("/forgot-password")}>
              忘記密碼？
            </span>
          </div>
          <button type="submit" style={styles.modalButton}>
            登入
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh", // 全螢幕高度
    backgroundColor: "#f0f0f0", // 背景顏色
    margin: 0, // 移除預設外邊距
    overflow: "hidden", // 禁止超出
  },
  container: {
    width: "90%", // 調整為百分比以適配不同螢幕
    maxWidth: "400px", // 最大寬度
    padding: "15px", // 減少內邊距
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
  },
  title: {
    color: "#333",
    marginBottom: "15px", // 減少標題下方的空間
    fontSize: "1.5rem", // 減少字體大小
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px", // 減少表單欄位間距
  },
  checkboxGroup: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  forgotPassword: {
    color: "blue",
    textDecoration: "underline",
    cursor: "pointer",
  },
  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    width: "300px",
  },
  input: {
    width: "100%",
    padding: "8px", // 減少輸入框內邊距
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  modalButton: {
    width: "100%",
    padding: "8px", // 減少按鈕內邊距
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  modalClose: {
    marginTop: "10px",
    padding: "5px",
    backgroundColor: "#ccc",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
