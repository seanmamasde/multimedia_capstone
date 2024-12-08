"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import "./page.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000); // Redirect to login after 2 seconds
    } else {
      const { error } = await res.json();
      setError(error);
    }
  };

  return (
    <div className="page">
      <Card className="register-container">
        <h1 className="title">註冊新帳號</h1>
        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">註冊成功！將自動跳轉至登入頁面。</p>}
        <form onSubmit={handleRegister} className="form">
          <div className="form-field">
            <span className="input-with-icon">
              <i className="pi pi-envelope"></i>
              <InputText
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入電子郵件"
                required
              />
            </span>
          </div>
          <div className="form-field">
            <span className="input-with-icon">
              <i className="pi pi-user"></i>
              <InputText
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號"
                required
              />
            </span>
          </div>
          <div className="form-field">
            <span className="input-with-icon">
              <i className="pi pi-lock"></i>
              <Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                toggleMask
                feedback={false}
                required
              />
            </span>
          </div>
          <div className="form-field">
            <span className="input-with-icon">
              <i className="pi pi-lock"></i>
              <Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="確認密碼"
                toggleMask
                feedback={false}
                required
              />
            </span>
          </div>
          <Button label="註冊" type="submit" className="submit-button" />
        </form>
      </Card>
    </div>
  );
}
