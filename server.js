require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

// ========== ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ==========
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "it_platform",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// ========== НАСТРОЙКА ПОЧТЫ ==========
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ========== ПОЛЬЗОВАТЕЛИ ==========
app.post("/register", async (req, res) => {
  const { email, password_hash, name } = req.body;
  if (!email || !password_hash || !name) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
      [email, password_hash, name]
    );
    const userId = result.rows[0].id;
    const token = generateToken();
    await pool.query("INSERT INTO sessions (user_id, token) VALUES ($1, $2)", [userId, token]);
    res.json({ id: userId, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password_hash } = req.body;
  if (!email || !password_hash) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }
  try {
    const result = await pool.query(
      "SELECT id, email, name FROM users WHERE email = $1 AND password_hash = $2",
      [email, password_hash]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const user = result.rows[0];
    const token = generateToken();
    await pool.query("INSERT INTO sessions (user_id, token) VALUES ($1, $2)", [user.id, token]);
    res.json({ ...user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Токен не предоставлен" });
  }
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const userResult = await pool.query("SELECT id, email, name FROM users WHERE id = $1", [userId]);
    res.json(userResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Токен обязателен" });
  }
  try {
    await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    res.json({ message: "Выход выполнен" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, email, name FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ПОСТЫ ==========
app.get("/posts", async (req, res) => {
  const postType = req.query.type;
  let query = `
    SELECT p.*, u.name as author_name 
    FROM forum_posts p
    JOIN users u ON p.author_id = u.id
  `;
  const params = [];
  if (postType) {
    query += ` WHERE p.type = $1`;
    params.push(postType);
  }
  query += ` ORDER BY p.created_at DESC`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/posts", async (req, res) => {
  const { content, topic_id, author_id, type } = req.body;
  if (!content || !topic_id || !author_id) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO forum_posts (content, topic_id, author_id, type) VALUES ($1, $2, $3, $4) RETURNING id",
      [content, topic_id, author_id, type || "project"]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const postResult = await pool.query("SELECT author_id FROM forum_posts WHERE id = $1", [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Пост не найден" });
    }
    if (postResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: "Нет прав для удаления" });
    }
    await pool.query("DELETE FROM forum_posts WHERE id = $1", [postId]);
    res.json({ message: "Пост удалён" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  if (!content) return res.status(400).json({ error: "Текст поста обязателен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const postResult = await pool.query("SELECT author_id FROM forum_posts WHERE id = $1", [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Пост не найден" });
    }
    if (postResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: "Нет прав для редактирования" });
    }
    await pool.query("UPDATE forum_posts SET content = $1 WHERE id = $2", [content, postId]);
    res.json({ message: "Пост обновлён" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== КОММЕНТАРИИ ==========
app.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as author_name 
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  if (!content) return res.status(400).json({ error: "Текст комментария обязателен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const result = await pool.query(
      "INSERT INTO comments (content, post_id, author_id) VALUES ($1, $2, $3) RETURNING id",
      [content, postId, userId]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/comments/:id", async (req, res) => {
  const commentId = req.params.id;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const commentResult = await pool.query("SELECT author_id FROM comments WHERE id = $1", [commentId]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Комментарий не найден" });
    }
    if (commentResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: "Нет прав для удаления" });
    }
    await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
    res.json({ message: "Комментарий удалён" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/comments/:id", async (req, res) => {
  const commentId = req.params.id;
  const { content } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  if (!content) return res.status(400).json({ error: "Текст комментария обязателен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const commentResult = await pool.query("SELECT author_id FROM comments WHERE id = $1", [commentId]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Комментарий не найден" });
    }
    if (commentResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: "Нет прав для редактирования" });
    }
    await pool.query("UPDATE comments SET content = $1 WHERE id = $2", [content, commentId]);
    res.json({ message: "Комментарий обновлён" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADR ==========
app.get("/projects", async (req, res) => {
  try {
    const result = await pool.query(`SELECT DISTINCT project_id FROM adr`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/adr/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM adr WHERE project_id = $1 ORDER BY id DESC", [projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/adr", async (req, res) => {
  const { project_id, title, status, context, options, decision, consequences, related_adr, extra } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const result = await pool.query(
      `INSERT INTO adr (project_id, title, status, context, options, decision, consequences, related_adr, extra, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [project_id, title, status, context, options, decision, consequences, related_adr, extra, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/adr/:id", async (req, res) => {
  const adrId = req.params.id;
  const { title, status, context, options, decision, consequences, related_adr, extra } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const adrResult = await pool.query("SELECT author_id FROM adr WHERE id = $1", [adrId]);
    if (adrResult.rows.length === 0) {
      return res.status(404).json({ error: "ADR не найден" });
    }
    if (adrResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: "Нет прав для редактирования" });
    }
    const result = await pool.query(
      `UPDATE adr SET
        title = $1,
        status = $2,
        context = $3,
        options = $4,
        decision = $5,
        consequences = $6,
        related_adr = $7,
        extra = $8
       WHERE id = $9
       RETURNING *`,
      [title, status, context, options, decision, consequences, related_adr, extra, adrId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/adr/:id", async (req, res) => {
  const adrId = req.params.id;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const adrResult = await pool.query("SELECT author_id FROM adr WHERE id = $1", [adrId]);
    if (adrResult.rows.length === 0) {
      return res.status(404).json({ error: "ADR не найден" });
    }
    if (adrResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: "Нет прав для удаления" });
    }
    await pool.query("DELETE FROM adr WHERE id = $1", [adrId]);
    res.json({ message: "ADR удалён" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== СООБЩЕНИЯ ==========
app.get("/contacts", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email,
        (SELECT content FROM messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1) as last_message
       FROM users u
       JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
       WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.id != $1
       ORDER BY (SELECT created_at FROM messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1) DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const currentUserId = sessionResult.rows[0].user_id;
    const result = await pool.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [currentUserId, userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/messages", async (req, res) => {
  const { receiver_id, content } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Токен не предоставлен" });
  if (!receiver_id || !content) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }
  try {
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1", [token]);
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: "Неверная сессия" });
    }
    const userId = sessionResult.rows[0].user_id;
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [userId, receiver_id, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ВОССТАНОВЛЕНИЕ ПАРОЛЯ ==========
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email обязателен" });
  }
  try {
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь с таким email не найден" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("INSERT INTO password_resets (email, token) VALUES ($1, $2)", [email, token]);
    const resetLink = `http://localhost:3001/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"NEONHUB" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Восстановление пароля NEONHUB",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D0D12; padding: 30px; border-radius: 12px; border: 1px solid #00FF8844;">
          <h1 style="color: #00FF88; text-align: center;">NEON<span style="color: #FFFFFF;">HUB</span></h1>
          <p style="color: #C9D1D9; text-align: center;">Вы запросили восстановление пароля.</p>
          <p style="color: #C9D1D9; text-align: center;">Перейдите по ссылке ниже, чтобы сбросить пароль:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background: #00FF8822; color: #00FF88; padding: 12px 24px; border-radius: 8px; border: 1px solid #00FF8866; text-decoration: none; font-weight: 600;">
              Сбросить пароль
            </a>
          </div>
          <p style="color: #8B949E; font-size: 0.8rem; text-align: center;">Ссылка действует 1 час. Если вы не запрашивали восстановление — проигнорируйте это письмо.</p>
          <p style="color: #5A6370; font-size: 0.7rem; text-align: center; margin-top: 16px;">${resetLink}</p>
        </div>
      `,
    });
    res.json({ message: "Ссылка для сброса отправлена на ваш email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Токен и новый пароль обязательны" });
  }
  try {
    const resetResult = await pool.query(
      "SELECT email FROM password_resets WHERE token = $1 AND created_at > NOW() - INTERVAL '1 hour'",
      [token]
    );
    if (resetResult.rows.length === 0) {
      return res.status(400).json({ error: "Неверный или просроченный токен" });
    }
    const email = resetResult.rows[0].email;
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [newPassword, email]);
    await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);
    res.json({ message: "Пароль успешно обновлён" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ЗАПУСК ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});