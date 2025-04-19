const db = require('../db');

const addToSubmit = async (req, res) => {
  const {
    userId,
    bookId, 
    bookName,
    authorName,
    isbnNumber,
    publishedDate,
    bookImage,
    description,
    submittedOn
  } = req.body;

  if (!userId || !bookId || !bookName) {
    return res.status(400).json({ message: "userId, bookId, and bookName are required" });
  }

  try {
    const [existingSubmission] = await db.query(
      `SELECT id FROM submissions WHERE userId = ? LIMIT 1`, [userId]
    );

    let submissionId;

    if (existingSubmission.length === 0) {
      const [inserted] = await db.query(
        `INSERT INTO submissions (userId) VALUES (?)`, [userId]
      );
      submissionId = inserted.insertId;
    } else {
      submissionId = existingSubmission[0].id;
    }

    const [existingItem] = await db.query(
      `SELECT id FROM submission_items WHERE submissionId = ? AND bookId = ? LIMIT 1`,
      [submissionId, bookId]
    );

    if (existingItem.length > 0) {
      return res.status(200).json({ alreadySubmitted: "Book already added to submission" });
    }

    await db.query(
      `INSERT INTO submission_items (submissionId, bookId, bookName, authorName, isbnNumber, publishedDate, bookImage, description, submittedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submissionId,
        bookId,
        bookName,
        authorName,
        isbnNumber,
        publishedDate,
        bookImage,
        description,
        submittedOn || new Date()
      ]
    );

    return res.json({ submitionSuccess: "This book is submitted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};



const getSubmissionsByUserId = async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
  
    try {
      const [submission] = await db.query(
        `SELECT id FROM submissions WHERE userId = ? LIMIT 1`,
        [userId]
      );
  
      if (submission.length === 0) {
        return res.status(200).json({ message: "Submissions not found for the user" });
      }
  
      const submissionId = submission[0].id;
  
      const [items] = await db.query(
        `SELECT bookId, bookName, authorName, isbnNumber, publishedDate, bookImage, description, submittedOn FROM submission_items WHERE submissionId = ?`,
        [submissionId]
      );
  
      return res.json({ userId, submissionId, items });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };
  



module.exports = {
  addToSubmit,
  getSubmissionsByUserId
};