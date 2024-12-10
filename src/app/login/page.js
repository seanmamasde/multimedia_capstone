"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import "./page.css";

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
    <div className="page">
      <Card className="login-container">
        <h1 className="title">羽球場地預約系統</h1>
        {error && <p className="error-text">帳號或密碼錯誤</p>}
        <form onSubmit={handleSubmit} className="form">
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
                className="w-full"
                pt={{ iconField: { root: { className: 'w-full' } } }}
              />
            </span>
          </div>
          <div className="checkbox-group">
            <div className="checkbox-remember">
              <Checkbox
                inputId="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.checked)}
                style={{ marginRight: "0.5rem" }}
              />
              <label htmlFor="rememberMe">記住我</label>
            </div>
          </div>
          <Button label="登入" type="submit" className="submit-button" />
          <Button
            label="註冊"
            type="button"
            className="register-button"
            onClick={() => router.push("login/register")}
          />
        </form>
      </Card>
    </div>
  );
}
