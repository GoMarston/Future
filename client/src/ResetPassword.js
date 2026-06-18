import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000";

function ResetPassword() {
  // Берём токен из URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Если токена нет — показываем ошибку
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0D12" }}>
        <div style={{ background: "#0D0D12", padding: "40px", borderRadius: "16px", border: "1px solid #FF444466", maxWidth: "400px", width: "100%" }}>
          <h1 style={{ color: "#FF4444", textAlign: "center" }}>Ошибка</h1>
          <p style={{ color: "#C9D1D9", textAlign: "center" }}>Неверная или отсутствующая ссылка для сброса пароля.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/reset-password`, { token, newPassword });
      setMessage(res.data.message);
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка сброса пароля");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0D12" }}>
      <div style={{ background: "#0D0D12", padding: "40px", borderRadius: "16px", border: "1px solid #00FF8833", maxWidth: "400px", width: "100%" }}>
        <h1 style={{ color: "#FFFFFF", textAlign: "center" }}>Сброс пароля</h1>
        {message && <p style={{ color: "#00FF88", textAlign: "center" }}>{message}</p>}
        {error && <p style={{ color: "#FF4444", textAlign: "center" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              background: "#0D0D12",
              color: "#C9D1D9",
              border: "1px solid #1A1A2E",
              borderRadius: "8px",
            }}
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              background: "#0D0D12",
              color: "#C9D1D9",
              border: "1px solid #1A1A2E",
              borderRadius: "8px",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#00FF8822",
              color: "#00FF88",
              border: "1px solid #00FF8866",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Сбросить пароль
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;