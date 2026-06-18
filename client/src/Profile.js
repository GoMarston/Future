import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000";

function Profile({ user, setUser, token }) {
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/posts?author_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserPosts(res.data))
      .catch((err) => console.error(err));
  }, [user.id, token]);

  const handleUpdateName = (e) => {
    e.preventDefault();
    axios
      .put(
        `${API_URL}/users/${user.id}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setUser({ ...user, name: newName });
        setEditMode(false);
        alert("Имя обновлено");
      })
      .catch((err) => console.error("Ошибка обновления:", err));
  };

  return (
    <div style={{ padding: "20px", background: "#0D0D12", borderRadius: "12px", color: "#C9D1D9" }}>
      <h2 style={{ color: "#FFFFFF" }}>Профиль пользователя</h2>
      <div style={{ background: "#1A1A2E", padding: "20px", borderRadius: "8px", border: "1px solid #00FF8822" }}>
        {!editMode ? (
          <div>
            <p style={{ color: "#C9D1D9" }}><strong style={{ color: "#FFFFFF" }}>Имя:</strong> {user.name}</p>
            <p style={{ color: "#C9D1D9" }}><strong style={{ color: "#FFFFFF" }}>Email:</strong> {user.email}</p>
            <button
              onClick={() => setEditMode(true)}
              style={{
                background: "#00FF8822",
                color: "#00FF88",
                border: "1px solid #00FF8866",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Редактировать профиль
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateName}>
            <label style={{ color: "#C9D1D9" }}>Новое имя:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              style={{
                display: "block",
                margin: "10px 0",
                padding: "8px",
                background: "#0D0D12",
                color: "#C9D1D9",
                border: "1px solid #1A1A2E",
                borderRadius: "6px",
                width: "100%",
                maxWidth: "300px",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#00FF8822",
                color: "#00FF88",
                border: "1px solid #00FF8866",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              style={{
                background: "#1A1A2E",
                color: "#8B949E",
                border: "1px solid #1A1A2E",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Отмена
            </button>
          </form>
        )}
      </div>

      <h3 style={{ color: "#FFFFFF", marginTop: "24px" }}>Мои посты</h3>
      {userPosts.length === 0 ? (
        <p style={{ color: "#8B949E" }}>У вас пока нет постов.</p>
      ) : (
        userPosts.map((post) => (
          <div key={post.id} style={{ background: "#1A1A2E", padding: "12px", borderRadius: "8px", marginBottom: "10px", border: "1px solid #00FF8822" }}>
            <p style={{ color: "#C9D1D9" }}>{post.content}</p>
            <small style={{ color: "#8B949E" }}>
              Тип: {post.type} | Дата: {new Date(post.created_at).toLocaleString()}
            </small>
          </div>
        ))
      )}
    </div>
  );
}

export default Profile;