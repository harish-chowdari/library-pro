// controllers/reminderController.js

const db         = require("../db");              // your mysql2 promise connection
const nodemailer = require("nodemailer");
const moment     = require("moment");
const cron       = require("node-cron");

let isRunning = false;

/**
 * 1) Fetch all *overdue* reservations grouped by user.
 */
async function checkReserved() {
  const today = moment.utc().format("YYYY-MM-DD");
  const [rows] = await db.query(`
    SELECT 
      rb.userId      AS user_id,
      u.name         AS user_name,
      u.email        AS user_email,
      rb.bookId      AS book_id,
      b.bookName     AS book_name
    FROM reserved_books rb
    JOIN users u    ON u.id    = rb.userId
    JOIN books b    ON b.id    = rb.bookId
    WHERE DATE(rb.willUseBy) < ?
  `, [today]);

  const map = {};
  for (const r of rows) {
    if (!map[r.user_id]) {
      map[r.user_id] = {
        userId:   r.user_id,
        userName: r.user_name,
        userEmail:r.user_email,
        books:    []
      };
    }
    map[r.user_id].books.push({
      bookId:   r.book_id,
      bookName: r.book_name
    });
  }
  return Object.values(map);
}

/**
 * 2) Send reminders & log into emails/email_items.
 */
async function sendEmail() {
  const dueList = await checkReserved();
  if (dueList.length === 0) {
    return { message: "No overdue reservations." };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const today = moment.utc().format("YYYY-MM-DD");
  for (const u of dueList) {
    // Upsert an 'emails' row
    const [r] = await db.query(`
      INSERT INTO emails (user_id, created_date)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
    `, [u.userId, today]);
    const emailId = r.insertId;

    // Find already‐sent book IDs for today
    const [sentRows] = await db.query(
      `SELECT book_id FROM email_items WHERE email_id = ? AND created_date = ?`,
      [emailId, today]
    );
    const sentBookIds = sentRows.map(r => r.book_id);

    // Filter only the newly overdue ones
    const unsent = u.books.filter(b => !sentBookIds.includes(b.bookId));
    if (unsent.length === 0) continue;

    // Build & send the email
    const html = `
      <h1>Overdue Reminder</h1>
      <p>Dear ${u.userName},</p>
      <p>The following book${unsent.length>1?'s are':' is'} now overdue:</p>
      <ul>
        ${unsent.map(b => `<li>${b.bookName}</li>`).join("")}
      </ul>
      <p>Please return ${unsent.length>1?'them':'it'} as soon as possible.</p>
    `;
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      u.userEmail,
      subject: "Reminder: Overdue Books",
      html
    });

    // Log each new one into email_items
    const values = unsent
      .map(b => `(${emailId}, ${b.bookId}, '${today}')`)
      .join(",");
    await db.query(`
      INSERT IGNORE INTO email_items (email_id, book_id, created_date)
      VALUES ${values}
    `);
  }

  return { message: `Sent ${dueList.length} overdue reminder(s).` };
}

/**
 * 3) Manual email‑sent entry (mirrors your emailsSentHistory)
 */
async function emailsSentHistory(req, res) {
  const { userId, bookId } = req.body;
  if (!userId || !bookId) {
    return res.status(400).json({ error: "userId and bookId required" });
  }

  const today = moment.utc().format("YYYY-MM-DD");
  const [r] = await db.query(`
    INSERT INTO emails (user_id, created_date)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
  `, [userId, today]);
  const emailId = r.insertId;

  const [dup] = await db.query(
    `SELECT 1 FROM email_items WHERE email_id = ? AND book_id = ? AND created_date = ?`,
    [emailId, bookId, today]
  );
  if (dup.length) {
    return res.status(409).json({ error: "Already recorded today." });
  }

  await db.query(
    `INSERT INTO email_items (email_id, book_id, created_date)
     VALUES (?, ?, ?)`,
    [emailId, bookId, today]
  );
  return res.json({ message: "Recorded." });
}

/**
 * 4) Fetch today's email history
 */
async function getEmailsHistory(req, res) {
  const today = moment.utc().format("YYYY-MM-DD");
  const [rows] = await db.query(`
    SELECT
      e.user_id    AS userId,
      u.name       AS userName,
      u.email      AS userEmail,
      ei.book_id   AS bookId,
      b.bookName   AS bookName
    FROM emails e
    JOIN email_items ei ON ei.email_id = e.id
    JOIN users u        ON u.id = e.user_id
    JOIN books b        ON b.id = ei.book_id
    WHERE e.created_date = ?
  `, [today]);

  if (!rows.length) {
    return res.status(404).json({ message: "No email history for today." });
  }

  const map = {};
  for (const r of rows) {
    if (!map[r.userId]) {
      map[r.userId] = {
        userId:    r.userId,
        userName:  r.userName,
        userEmail: r.userEmail,
        books:     []
      };
    }
    map[r.userId].books.push({
      bookId:   r.bookId,
      bookName: r.bookName
    });
  }

  return res.json(Object.values(map));
}

// 5) Cron: run every 5 seconds, but thanks to our INSERT_IGNORE logic,
// it will actually only email *new* overdue items once per item per day.
cron.schedule("*/5 * * * * *", async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    const result = await sendEmail();
    console.log("Reminder job:", result);
  } catch (err) {
    console.error("Reminder job error:", err);
  } finally {
    isRunning = false;
  }
});

module.exports = {
  checkReserved,
  sendEmail,
  emailsSentHistory,
  getEmailsHistory
};
