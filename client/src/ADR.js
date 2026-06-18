import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

function ADR({ user, token }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [adrList, setAdrList] = useState([]);
  const [newProject, setNewProject] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContext, setNewContext] = useState("");
  const [newOptions, setNewOptions] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newConsequences, setNewConsequences] = useState("");
  const [newStatus, setNewStatus] = useState("Предложено");
  const [editingAdr, setEditingAdr] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editContext, setEditContext] = useState("");
  const [editOptions, setEditOptions] = useState("");
  const [editDecision, setEditDecision] = useState("");
  const [editConsequences, setEditConsequences] = useState("");
  const [editRelated, setEditRelated] = useState("");
  const [editExtra, setEditExtra] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setProjects(res.data))
    .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
      axios.get(`${API_URL}/adr/${selectedProject}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setAdrList(res.data))
      .catch(err => console.error(err));
    }
  }, [selectedProject, token]);

  const handleCreateAdr = async (e) => {
    e.preventDefault();
    if (!newProject || !newTitle || !newContext || !newDecision || !newConsequences) {
      alert("Заполните все обязательные поля!");
      return;
    }
    const projectId = newProject.split(" ").join("").substring(0, 10);
    try {
      await axios.post(
        `${API_URL}/adr`,
        {
          project_id: projectId,
          title: newTitle,
          status: newStatus,
          context: newContext,
          options: newOptions,
          decision: newDecision,
          consequences: newConsequences,
          related_adr: "",
          extra: "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("ADR успешно создан!");
      setNewProject("");
      setNewTitle("");
      setNewContext("");
      setNewOptions("");
      setNewDecision("");
      setNewConsequences("");
      setNewStatus("Предложено");
      const res = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании ADR");
    }
  };

  const handleDeleteAdr = async (adrId) => {
    if (!window.confirm("Удалить это архитектурное решение?")) return;
    try {
      await axios.delete(`${API_URL}/adr/${adrId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("ADR удалён");
      const res = await axios.get(`${API_URL}/adr/${selectedProject || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdrList(res.data);
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении ADR");
    }
  };

  const handleEditAdr = (adr) => {
    setEditingAdr(adr.id);
    setEditTitle(adr.title);
    setEditStatus(adr.status);
    setEditContext(adr.context || "");
    setEditOptions(adr.options || "");
    setEditDecision(adr.decision || "");
    setEditConsequences(adr.consequences || "");
    setEditRelated(adr.related_adr || "");
    setEditExtra(adr.extra || "");
  };

  const handleUpdateAdr = async (e) => {
    e.preventDefault();
    if (!editTitle || !editContext || !editDecision || !editConsequences) {
      alert("Заполните все обязательные поля!");
      return;
    }
    try {
      await axios.put(
        `${API_URL}/adr/${editingAdr}`,
        {
          title: editTitle,
          status: editStatus,
          context: editContext,
          options: editOptions,
          decision: editDecision,
          consequences: editConsequences,
          related_adr: editRelated,
          extra: editExtra,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("ADR обновлён!");
      setEditingAdr(null);
      const res = await axios.get(`${API_URL}/adr/${selectedProject || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdrList(res.data);
    } catch (err) {
      console.error(err);
      alert("Ошибка при обновлении ADR");
    }
  };

  return (
    <div style={{ padding: "20px", background: "#0D0D12", borderRadius: "12px", minHeight: "70vh" }}>
      <div style={{ background: "#1A1A2E", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #00FF8833" }}>
        <h3 style={{ color: "#00FF88", marginBottom: "12px" }}>Создать новый ADR</h3>
        <form onSubmit={handleCreateAdr}>
          <input
            type="text"
            placeholder="Название проекта"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
            required
          />
          <input
            type="text"
            placeholder="Название решения"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
            required
          />
          <textarea
            placeholder="Контекст"
            value={newContext}
            onChange={(e) => setNewContext(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "80px", fontFamily: "inherit" }}
            required
          />
          <textarea
            placeholder="Варианты решений"
            value={newOptions}
            onChange={(e) => setNewOptions(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit" }}
          />
          <textarea
            placeholder="Решение"
            value={newDecision}
            onChange={(e) => setNewDecision(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "80px", fontFamily: "inherit" }}
            required
          />
          <textarea
            placeholder="Последствия"
            value={newConsequences}
            onChange={(e) => setNewConsequences(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit" }}
            required
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
          >
            <option value="Предложено">Предложено</option>
            <option value="Принято">Принято</option>
            <option value="Устарело">Устарело</option>
            <option value="Отменено">Отменено</option>
            <option value="Выполнено">Выполнено</option>
          </select>
          <button
            type="submit"
            style={{ background: "#00FF8822", color: "#00FF88", border: "1px solid #00FF8866", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
          >
            Создать ADR
          </button>
        </form>
      </div>

      {editingAdr && (
        <div style={{ background: "#1A1A2E", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #D2992266" }}>
          <h3 style={{ color: "#D29922" }}>✏️ Редактировать ADR</h3>
          <form onSubmit={handleUpdateAdr}>
            <input
              type="text"
              placeholder="Название решения"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
              required
            />
            <textarea
              placeholder="Контекст"
              value={editContext}
              onChange={(e) => setEditContext(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit" }}
              required
            />
            <textarea
              placeholder="Варианты решений"
              value={editOptions}
              onChange={(e) => setEditOptions(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit" }}
            />
            <textarea
              placeholder="Решение"
              value={editDecision}
              onChange={(e) => setEditDecision(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit" }}
              required
            />
            <textarea
              placeholder="Последствия"
              value={editConsequences}
              onChange={(e) => setEditConsequences(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px", minHeight: "60px", fontFamily: "inherit" }}
              required
            />
            <input
              type="text"
              placeholder="Связанные ADR"
              value={editRelated}
              onChange={(e) => setEditRelated(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
            />
            <input
              type="text"
              placeholder="Дополнительно"
              value={editExtra}
              onChange={(e) => setEditExtra(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
            />
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#0D0D12", color: "#C9D1D9", border: "1px solid #1A1A2E", borderRadius: "6px" }}
            >
              <option value="Предложено">Предложено</option>
              <option value="Принято">Принято</option>
              <option value="Устарело">Устарело</option>
              <option value="Отменено">Отменено</option>
              <option value="Выполнено">Выполнено</option>
            </select>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{ background: "#23863633", color: "#3FB950", border: "1px solid #23863666", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                💾 Сохранить
              </button>
              <button
                type="button"
                onClick={() => setEditingAdr(null)}
                style={{ background: "#1A1A2E", color: "#8B949E", border: "1px solid #1A1A2E", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" }}
              >
                ❌ Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 style={{ color: "#FFFFFF", marginBottom: "16px" }}>ADR — Архитектурные решения</h2>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedProject(null)}
          style={{ background: "#1A1A2E", color: "#C9D1D9", border: "1px solid #1A1A2E", padding: "6px 16px", borderRadius: "6px", cursor: "pointer" }}
        >
          Все проекты
        </button>
        {projects.map((p) => (
          <button
            key={p.project_id}
            onClick={() => setSelectedProject(p.project_id)}
            style={{ background: "#1A1A2E", color: "#C9D1D9", border: "1px solid #1A1A2E", padding: "6px 16px", borderRadius: "6px", cursor: "pointer" }}
          >
            Проект {p.project_id}
          </button>
        ))}
      </div>

      {adrList.length === 0 ? (
        <p style={{ color: "#8B949E" }}>Нет ADR для этого проекта. Добавьте первое архитектурное решение!</p>
      ) : (
        adrList.map((adr) => (
          <div key={adr.id} style={{ background: "#1A1A2E", padding: "16px", marginBottom: "16px", borderRadius: "8px", border: "1px solid #00FF8822" }}>
            <h3 style={{ color: "#00FF88" }}>{adr.title}</h3>
            <p style={{ color: "#C9D1D9" }}><strong>Статус:</strong> {adr.status}</p>
            <p style={{ color: "#C9D1D9" }}><strong>Контекст:</strong> {adr.context}</p>
            <p style={{ color: "#C9D1D9" }}><strong>Решение:</strong> {adr.decision}</p>
            <p style={{ color: "#C9D1D9" }}><strong>Последствия:</strong> {adr.consequences}</p>
            {adr.related_adr && <p style={{ color: "#C9D1D9" }}><strong>Связанные ADR:</strong> {adr.related_adr}</p>}
            {adr.extra && <p style={{ color: "#C9D1D9" }}><strong>Дополнительно:</strong> {adr.extra}</p>}
            <small style={{ color: "#8B949E" }}>Автор: {user?.name} | {new Date(adr.created_at).toLocaleString()}</small>
            {user && adr.author_id === user.id && (
              <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleEditAdr(adr)}
                  style={{ background: "#D2992233", color: "#D29922", border: "1px solid #D2992266", padding: "4px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => handleDeleteAdr(adr.id)}
                  style={{ background: "#DA363333", color: "#DA3633", border: "1px solid #DA363366", padding: "4px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  🗑️ Удалить
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ADR;