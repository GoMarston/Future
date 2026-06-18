import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000";

function Messages({ user, token }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/contacts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setContacts(res.data))
    .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const filtered = res.data.filter(u => u.id !== user.id);
      setAllUsers(filtered);
    })
    .catch(err => console.error(err));
  }, [token, user.id]);

  useEffect(() => {
    if (selectedContact) {
      axios.get(`${API_URL}/messages/${selectedContact.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));
    }
  }, [selectedContact, token]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    axios.post(`${API_URL}/messages`, {
      receiver_id: selectedContact.id,
      content: newMessage
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      setNewMessage("");
      return axios.get(`${API_URL}/messages/${selectedContact.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    })
    .then(res => setMessages(res.data))
    .catch(err => console.error(err));
  };

  return (
    <div style={{ display: "flex", height: "70vh", border: "1px solid #1A1A2E", borderRadius: "8px", background: "#0D0D12" }}>
      {/* Левая панель — контакты */}
      <div style={{ width: "30%", borderRight: "1px solid #1A1A2E", overflowY: "auto", padding: "10px" }}>
        <h3 style={{ color: "#C9D1D9" }}>Контакты</h3>
        <button
          onClick={() => setShowUserList(!showUserList)}
          style={{
            marginBottom: "10px",
            width: "100%",
            padding: "8px",
            background: "#00FF8822",
            color: "#00FF88",
            border: "1px solid #00FF8866",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          ✉️ Написать новое сообщение
        </button>

        {showUserList && (
          <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "10px", background: "#1A1A2E", borderRadius: "6px", padding: "4px" }}>
            {allUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  setSelectedContact(u);
                  setShowUserList(false);
                }}
                style={{
                  padding: "8px",
                  marginBottom: "4px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#C9D1D9",
                  background: "transparent",
                }}
                onMouseEnter={(e) => e.target.style.background = "#0D0D12"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                {u.name}
              </div>
            ))}
          </div>
        )}

        {contacts.length === 0 ? (
          <p style={{ color: "#8B949E" }}>Нет сообщений. Напишите кому-нибудь!</p>
        ) : (
          contacts.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedContact(c)}
              style={{
                padding: "10px",
                marginBottom: "5px",
                borderRadius: "4px",
                cursor: "pointer",
                color: "#C9D1D9",
                background: selectedContact?.id === c.id ? "#1A1A2E" : "transparent",
              }}
            >
              <strong>{c.name}</strong>
              <div style={{ fontSize: "0.8rem", color: "#8B949E" }}>{c.last_message || "Нет сообщений"}</div>
            </div>
          ))
        )}
      </div>

      {/* Правая панель — чат */}
      <div style={{ width: "70%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px" }}>
        {selectedContact ? (
          <>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <h3 style={{ color: "#00FF88" }}>{selectedContact.name}</h3>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    textAlign: m.sender_id === user.id ? "right" : "left",
                    padding: "5px 10px",
                    margin: "5px 0",
                    background: m.sender_id === user.id ? "#00FF8822" : "#1A1A2E",
                    borderRadius: "8px",
                    maxWidth: "70%",
                    marginLeft: m.sender_id === user.id ? "auto" : "0",
                    color: "#C9D1D9",
                  }}
                >
                  {m.content}
                  <div style={{ fontSize: "0.6rem", color: "#8B949E" }}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <input
                type="text"
                placeholder="Напишите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#0D0D12",
                  color: "#C9D1D9",
                  border: "1px solid #1A1A2E",
                  borderRadius: "6px",
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
                }}
              >
                Отправить
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8B949E" }}>
            <p>Приятного дня! 👋</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;