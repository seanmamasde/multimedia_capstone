"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("請輸入有效的電子郵件地址！");
      return;
    }

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setMessage("重置密碼連結已發送至您的電子郵件！");
    } else {
      const { error } = await res.json();
      setMessage(error || "發送失敗，請稍後再試！");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>忘記密碼</h1>
        <p>請輸入您的電子郵件地址以重置密碼：</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="請輸入電子郵件"
          style={styles.input}
        />
        <button onClick={handleForgotPassword} style={styles.button}>
          發送重置連結
        </button>
        {message && <p style={{ color: "red" }}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f0f0",
  },
  container: {
    width: "90%",
    maxWidth: "400px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  title: {
    marginBottom: "15px",
    fontSize: "1.5rem",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
};
