"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import "./page.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState(null);

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
      setSubmittedEmail(email); // Save the submitted email
      setEmail(""); // Clear the input field
    } else {
      const { error } = await res.json();
      setMessage(error || "發送失敗，請稍後再試！");
    }
  };

  return (
    <div className="page">
      <Card className="login-container">
        <h1 className="title">忘記密碼</h1>
        {message && !submittedEmail && <p className="error-text">{message}</p>}
        {!submittedEmail ? (
          <>
            <div className="form-field">
              <span className="input-with-icon">
                <i className="pi pi-envelope"></i>
                <InputText
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="請輸入電子郵件"
                  required
                />
              </span>
            </div>
            <br />
            <Button
              label="發送重置連結"
              onClick={handleForgotPassword}
              className="submit-button"
            />
          </>
        ) : (
          <p>
            {message} <br />
            <strong>{submittedEmail}</strong>
          </p>
        )}
      </Card>
    </div>
  );
}
