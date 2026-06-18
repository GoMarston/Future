import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000";

function Comments({ postId, token, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/posts/${postId}/comments`)
      .then((res) => setComments(res.data))
      .catch((err) => console.error(err));
  }, [postId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    axios
      .post(
        `${API_URL}/posts/${postId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setNewComment("");
        return axios.get(`${API_URL}/posts/${postId}/comments`);
      })
      .then((res) => setComments(res.data))
      .catch((err) => console.error(err));
  };

  const handleDelete = (commentId) => {
    if (!window.confirm("Удалить комментарий?")) return;
    axios
      .delete(`${API_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => axios.get(`${API_URL}/posts/${postId}/comments`))
      .then((res) => setComments(res.data))
      .catch((err) => console.error(err));
  };

  const handleEdit = (comment) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  const handleUpdate = (commentId) => {
    if (!editText.trim()) return;
    axios
      .put(
        `${API_URL}/comments/${commentId}`,
        { content: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setEditingComment(null);
        return axios.get(`${API_URL}/posts/${postId}/comments`);
      })
      .then((res) => setComments(res.data))
      .catch((err) => console.error(err));
  };

  return (
    <div className="comments-section">
      <h4 style={{ color: "#C9D1D9" }}>Комментарии ({comments.length})</h4>
      {comments.length === 0 ? (
        <p style={{ color: "#8B949E" }}>Нет комментариев. Будьте первым!</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} style={{ marginBottom: "12px", paddingLeft: "10px" }}>
            {editingComment?.id === comment.id ? (
              <div>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: "70%",
                    padding: "8px",
                    background: "#0D0D12",
                    color: "#C9D1D9",
                    border: "1px solid #1A1A2E",
                    borderRadius: "6px",
                    marginRight: "10px",
                  }}
                />
                <button
                  onClick={() => handleUpdate(comment.id)}
                  style={{
                    background: "#00FF8822",
                    color: "#00FF88",
                    border: "1px solid #00FF8866",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setEditingComment(null)}
                  style={{
                    background: "#1A1A2E",
                    color: "#8B949E",
                    border: "1px solid #1A1A2E",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div>
                <div className="comment-author">{comment.author_name}</div>
                <div className="comment-text">{comment.content}</div>
                <div style={{ fontSize: "12px", color: "#8B949E" }}>
                  {new Date(comment.created_at).toLocaleString()}
                  {currentUser && comment.author_id === currentUser.id && (
                    <span style={{ marginLeft: "10px" }}>
                      <button
                        onClick={() => handleEdit(comment)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#8B949E",
                          cursor: "pointer",
                          fontSize: "12px",
                          marginRight: "6px",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#8B949E",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        🗑️
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
          type="text"
          placeholder="Написать комментарий..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
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
    </div>
  );
}

export default Comments;