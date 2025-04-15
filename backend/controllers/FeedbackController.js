const connection = require("../db");

async function sendFeedback(req, res) {
    try {
        const { bookId, userId, feedback, rating } = req.body;

        // Check if all required fields are present
        if (!bookId || !userId || !feedback || !rating) {
            return res.status(200).json({ message: "bookId, userId, feedback, and rating are required fields" });
        }

        // Check if the book exists
        const [bookRows] = await connection.query("SELECT * FROM books WHERE id = ?", [bookId]);
        if (bookRows.length === 0) {
            return res.status(200).json({ bookNotFound: "Book might be deleted from library" });
        }

        // Check if the user has already submitted feedback for this book
        const [existingFeedback] = await connection.query(
            "SELECT * FROM feedbacks WHERE bookId = ? AND userId = ?",
            [bookId, userId]
        );

        if (existingFeedback.length > 0) {
            return res.status(200).json({ alreadySubmitted: "You have already submitted feedback for this book" });
        }

        // Insert the feedback into the database
        await connection.query(
            "INSERT INTO feedbacks (bookId, userId, feedback, rating) VALUES (?, ?, ?, ?)",
            [bookId, userId, feedback, rating]
        );

        res.status(200).json({ fbSubmitted: "Feedback submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getFeedbacks(req, res) {
    try {
        const { bookId } = req.params;

        // Check if bookId is provided
        if (!bookId) {
            return res.status(400).json({ message: "bookId is required" });
        }

        // Find the feedbacks for the book
        const [feedbackRows] = await connection.query(
            `SELECT feedbacks.feedback, feedbacks.rating, users.name as userName 
            FROM feedbacks
            JOIN users ON feedbacks.userId = users.id
            WHERE feedbacks.bookId = ?`,
            [bookId]
        );

        if (feedbackRows.length === 0) {
            return res.status(200).json({ message: "No feedbacks found for this book" });
        }

        // Return the feedbacks array in the response
        const feedbacksArray = feedbackRows.map(feedback => ({
            userName: feedback.userName,
            feedback: feedback.feedback,
            rating: feedback.rating
        }));

        res.status(200).json({ feedbacks: feedbacksArray });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    sendFeedback,
    getFeedbacks
};
