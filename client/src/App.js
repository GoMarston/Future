import React, { useState, useEffect } from "react";
import axios from "axios";
import Profile from "./Profile";
import Comments from "./Comments";
import ADR from "./ADR";
import Messages from "./Messages";
import LoadingScreen from "./LoadingScreen";
import WelcomeLoading from "./WelcomeLoading";
import ResetPassword from "./ResetPassword";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    content: "",
    topic_id: 2,
    type: "project",
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState("forum");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(false);

  // ========== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ==========
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("token"));
    }
  }, []);

  // ========== ЗАГРУЗКА ПОСТОВ ==========
  useEffect(() => {
    if (user) {
      const url =
        activeFilter === "all"
          ? `${API_URL}/posts`
          : `${API_URL}/posts?type=${activeFilter}`;
      axios
        .get(url)
        .then((res) => setPosts(res.data))
        .catch((err) => console.error(err));
    }
  }, [user, activeFilter]);

  // ========== ВХОД ==========
  const handleLogin = (e) => {
    e.preventDefault();
    axios
      .post(`${API_URL}/login`, {
        email: loginEmail,
        password_hash: loginPassword,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setIsWelcomeLoading(true);
        setUser(res.data);
        setLoginEmail("");
        setLoginPassword("");
      })
      .catch((err) =>
        console.error("Ошибка входа:", err.response?.data || err)
      );
  };

  // ========== РЕГИСТРАЦИЯ ==========
  const handleRegister = (e) => {
    e.preventDefault();
    axios
      .post(`${API_URL}/register`, {
        email: regEmail,
        password_hash: regPassword,
        name: regName,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setIsWelcomeLoading(true);
        return axios.get(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
      })
      .then((res) => {
        setUser(res.data);
        setRegEmail("");
        setRegPassword("");
        setRegName("");
      })
      .catch((err) =>
        console.error("Ошибка регистрации:", err.response?.data || err)
      );
  };

  // ========== ВОССТАНОВЛЕНИЕ ПАРОЛЯ ==========
  const handleForgotPassword = (e) => {
    e.preventDefault();
    axios
      .post(`${API_URL}/forgot-password`, { email: resetEmail })
      .then((res) => {
        alert(res.data.message);
        setAuthMode("login");
        setResetEmail("");
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Ошибка отправки");
      });
  };

  // ========== ВЫХОД ==========
  const handleLogout = () => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .post(`${API_URL}/logout`, { token })
        .catch((err) => console.error(err));
    }
    localStorage.removeItem("token");
    setUser(null);
    setCurrentPage("forum");
  };

  // ========== СОЗДАНИЕ ПОСТА ==========
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;

    const postData = {
      content: newPost.content,
      topic_id: newPost.topic_id,
      author_id: user.id,
      type: newPost.type,
    };

    axios
      .post(`${API_URL}/posts`, postData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(() => axios.get(`${API_URL}/posts`))
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Ошибка при отправке:", err));

    setNewPost({ content: "", topic_id: 2, type: "project" });
  };

  // ========== УДАЛЕНИЕ ПОСТА ==========
  const handleDelete = async (postId) => {
    if (!window.confirm("Удалить пост?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.get(`${API_URL}/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Не удалось удалить пост");
    }
  };

  // ========== РЕДАКТИРОВАНИЕ ПОСТА ==========
  const handleEdit = (post) => {
    const newContent = prompt("Введите новый текст:", post.content);
    if (!newContent || newContent === post.content) return;

    const token = localStorage.getItem("token");
    axios
      .put(
        `${API_URL}/posts/${post.id}`,
        { content: newContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(async () => {
        const res = await axios.get(`${API_URL}/posts`);
        setPosts(res.data);
      })
      .catch((err) => console.error("Ошибка редактирования:", err));
  };

  // ========== ПРОВЕРКА ТОКЕНА В URL ==========
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token");
  if (resetToken) {
    return <ResetPassword />;
  }

  // ========== ЗАГРУЗОЧНЫЕ ЭКРАНЫ ==========
  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  if (isWelcomeLoading) {
    return (
      <WelcomeLoading
        userName={user?.name || "Гость"}
        onComplete={() => setIsWelcomeLoading(false)}
      />
    );
  }

  // ========== СТРАНИЦА ВХОДА ==========
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0D12",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#0D0D12",
            padding: "40px",
            borderRadius: "16px",
            border: "1px solid #00FF8833",
            boxShadow: "0 0 60px #00FF8811",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            NEON<span style={{ color: "#00FF88" }}>HUB</span>
          </h1>
          <p
            style={{
              color: "#8B949E",
              textAlign: "center",
              marginBottom: "24px",
              fontSize: "0.9rem",
            }}
          >
            Войдите или создайте аккаунт
          </p>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={() => setAuthMode("login")}
              style={{
                flex: 1,
                padding: "10px",
                background:
                  authMode === "login" ? "#00FF8822" : "transparent",
                color: authMode === "login" ? "#00FF88" : "#8B949E",
                border:
                  authMode === "login"
                    ? "1px solid #00FF8866"
                    : "1px solid #1A1A2E",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              Вход
            </button>
            <button
              onClick={() => setAuthMode("register")}
              style={{
                flex: 1,
                padding: "10px",
                background:
                  authMode === "register" ? "#00FF8822" : "transparent",
                color: authMode === "register" ? "#00FF88" : "#8B949E",
                border:
                  authMode === "register"
                    ? "1px solid #00FF8866"
                    : "1px solid #1A1A2E",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              Регистрация
            </button>
          </div>

          {authMode === "login" && (
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "8px",
                  fontSize: "1rem",
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
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Войти
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("reset")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#00FF88",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  padding: 0,
                  marginTop: "8px",
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Забыли пароль?
              </button>
            </form>
          )}

          {authMode === "register" && (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Имя"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "8px",
                  fontSize: "1rem",
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
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Зарегистрироваться
              </button>
            </form>
          )}

          {authMode === "reset" && (
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="Введите ваш email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginBottom: "12px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "8px",
                  fontSize: "1rem",
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
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Отправить ссылку
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8B949E",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  padding: 0,
                  marginTop: "8px",
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                Вернуться ко входу
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ========== ОСНОВНОЙ САЙТ ==========
  return (
    <div className="container">
      <div className="header">
        <div className="header-left">
          <h1>NEON<span>HUB</span></h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="nav">
            <button
              className={`nav-btn ${currentPage === "forum" ? "active" : ""}`}
              onClick={() => setCurrentPage("forum")}
            >
              Форум
            </button>
            <button
              className={`nav-btn ${currentPage === "adr" ? "active" : ""}`}
              onClick={() => setCurrentPage("adr")}
            >
              ADR
            </button>
            <button
              className={`nav-btn ${currentPage === "messages" ? "active" : ""}`}
              onClick={() => setCurrentPage("messages")}
            >
              Сообщения
            </button>
            <button
              className={`nav-btn ${currentPage === "profile" ? "active" : ""}`}
              onClick={() => setCurrentPage("profile")}
            >
              Профиль
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
      <p style={{ color: "#8B949E", fontSize: "0.85rem" }}>
        👤 <strong style={{ color: "#00FF88" }}>{user.name}</strong> —{" "}
        {user.email}
      </p>

      {currentPage === "forum" && (
        <>
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Поиск по постам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="filters">
            <button
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              Все посты
            </button>
            <button
              className={`filter-btn ${activeFilter === "project" ? "active" : ""}`}
              onClick={() => setActiveFilter("project")}
            >
              🚀 Поиск напарника
            </button>
            <button
              className={`filter-btn ${activeFilter === "knowledge" ? "active" : ""}`}
              onClick={() => setActiveFilter("knowledge")}
            >
              📚 База знаний
            </button>
            <button
              className={`filter-btn ${activeFilter === "adr" ? "active" : ""}`}
              onClick={() => setActiveFilter("adr")}
            >
              🏛️ Архитектура
            </button>
            <button
              className={`filter-btn ${activeFilter === "discussion" ? "active" : ""}`}
              onClick={() => setActiveFilter("discussion")}
            >
              💬 Обсуждения
            </button>
          </div>

          <form className="post-form" onSubmit={handleSubmit}>
            <textarea
              rows="3"
              placeholder="Текст поста..."
              value={newPost.content}
              onChange={(e) =>
                setNewPost({ ...newPost, content: e.target.value })
              }
            />
            <select
              value={newPost.type}
              onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
            >
              <option value="project">🚀 Поиск напарника</option>
              <option value="knowledge">📚 База знаний</option>
              <option value="adr">🏛️ Архитектурное решение</option>
              <option value="discussion">💬 Обсуждения</option>
            </select>
            <button type="submit">Создать пост</button>
          </form>

          <h2 style={{ color: "#C9D1D9" }}>Посты:</h2>
          {posts.length === 0 ? (
            <p style={{ color: "#8B949E" }}>Нет постов. Создай первый!</p>
          ) : (
            posts
              .filter((post) =>
                post.content.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((post) => (
                <div key={post.id} className="post-card">
                  <p className="post-content">{post.content}</p>
                  <div className="post-meta">
                    <span className={`post-type post-type-${post.type}`}>
                      {post.type === "project"
                        ? "🚀 Проект"
                        : post.type === "knowledge"
                        ? "📚 База знаний"
                        : post.type === "adr"
                        ? "🏛️ ADR"
                        : post.type === "discussion"
                        ? "💬 Обсуждение"
                        : post.type}
                    </span>
                    | Автор: {post.author_name || post.author_id} |{" "}
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                  {user && post.author_id === user.id && (
                    <div className="post-actions">
                      <button onClick={() => handleEdit(post)}>
                        ✏️ Редактировать
                      </button>
                      <button onClick={() => handleDelete(post.id)}>
                        🗑️ Удалить
                      </button>
                    </div>
                  )}
                  <Comments
                    postId={post.id}
                    token={localStorage.getItem("token")}
                    currentUser={user}
                  />
                </div>
              ))
          )}
        </>
      )}

      {currentPage === "adr" && (
        <ADR user={user} token={localStorage.getItem("token")} />
      )}

      {currentPage === "messages" && (
        <Messages user={user} token={localStorage.getItem("token")} />
      )}

      {currentPage === "profile" && (
        <Profile
          user={user}
          setUser={setUser}
          token={localStorage.getItem("token")}
        />
      )}
    </div>
  );
}

export default App;