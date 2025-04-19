const connection = require("../db");
const S3 = require("../s3");

const BookPublication = async (req, res) => {
    try {
        const { bookName, authorName, isbnNumber, publishedDate, description } = req.body;

        const s3Upload = await S3.uploadFile(
            process.env.AWS_BUCKET_NAME,
            req.files.bookImage[0]
        );

        const bookImage = s3Upload.Location;

        await connection.query(
            `INSERT INTO publications 
            (bookName, authorName, isbnNumber, publishedDate, bookImage, description) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [bookName, authorName, isbnNumber, publishedDate, bookImage, description]
        );

        res.status(201).json({ message: "Book added successfully" });
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).json({ message: error.message });
    }
};

const getPublications = async (req, res) => {
    try {
        const [rows] = await connection.query("SELECT * FROM publications ORDER BY createdAt DESC");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching publications:", error);
        res.status(500).json({ message: error.message });
    }
};

const deletePublication = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await connection.query("DELETE FROM publications WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Publication not found" });
        }

        res.status(200).json({ message: "Publication deleted successfully" });
    } catch (error) {
        console.error("Error deleting publication:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    BookPublication,
    getPublications,
    deletePublication
};
