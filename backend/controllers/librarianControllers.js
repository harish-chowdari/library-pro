const connection = require("../db");
const S3 = require("../s3");

const addBook = async (req, res) => {
  try {
    const response = await S3.uploadFile(process.env.AWS_BUCKET_NAME, req.files.bookImage[0]);
    const { bookName, authorName, isbnNumber, publishedDate, description, numberOfCopies, fine } = req.body;

    const [result] = await connection.query(
      `INSERT INTO books (bookName, authorName, isbnNumber, publishedDate, bookImage, description, numberOfCopies, fine) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookName, authorName, isbnNumber, publishedDate, response.Location, description, numberOfCopies, fine]
    );

    res.status(201).json({ message: "Book added successfully", bookId: result.insertId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const publishBookByUser = async (req, res) => {
  try {
    const { bookName, authorName, isbnNumber, publishedDate, bookImage, description, numberOfCopies, fine } = req.body;

    const [result] = await connection.query(
      `INSERT INTO books (bookName, authorName, isbnNumber, publishedDate, bookImage, description, numberOfCopies, fine) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookName, authorName, isbnNumber, publishedDate, bookImage, description, numberOfCopies, fine]
    );

    res.status(201).json({ bookAdded: "Book added successfully", bookId: result.insertId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const addWillUseBy = async (req, res) => {
    const { bookId } = req.params;
    const { willUseBy } = req.body;

    try {
        const [bookRows] = await connection.query("SELECT * FROM books WHERE id = ?", [bookId]);

        if (bookRows.length === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        await connection.query("INSERT INTO useByDates (bookId, willUseBy) VALUES (?, ?)", [
            bookId, willUseBy
        ]);

        const [updatedUseByDates] = await connection.query("SELECT * FROM useByDates WHERE bookId = ?", [bookId]);

        return res.json(updatedUseByDates);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const addFeedback = async (req, res) => {
    const { bookId } = req.params;
    const { userId, rating, feedback } = req.body;

    try {
        const [bookRows] = await connection.query("SELECT * FROM books WHERE id = ?", [bookId]);

        if (bookRows.length === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        const [result] = await connection.query(
            "INSERT INTO feedbacks (bookId, userId, rating, feedback) VALUES (?, ?, ?, ?)",
            [bookId, userId, rating, feedback]
        );

        return res.status(201).json({ message: "Feedback added successfully", feedbackId: result.insertId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const increaseCopy = async (req, res) => {
  try {
    const { bookId } = req.params;

    await connection.query(`UPDATE books SET numberOfCopies = numberOfCopies + 1 WHERE id = ?`, [bookId]);
    const [updatedBook] = await connection.query(`SELECT * FROM books WHERE id = ?`, [bookId]);

    res.status(200).json({ message: "Book copy count increased", book: updatedBook[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const decreaseCopy = async (req, res) => {
  try {
    const { bookId } = req.params;

    const [bookData] = await connection.query(`SELECT * FROM books WHERE id = ?`, [bookId]);
    if (bookData.length === 0) return res.status(404).json({ message: "Book not found" });

    if (bookData[0].numberOfCopies > 0) {
      await connection.query(`UPDATE books SET numberOfCopies = numberOfCopies - 1 WHERE id = ?`, [bookId]);
    } else {
      return res.status(400).json({ message: "Cannot decrease, no copies left" });
    }

    const [updatedBook] = await connection.query(`SELECT * FROM books WHERE id = ?`, [bookId]);
    res.status(200).json({ message: "Book copy count decreased", book: updatedBook[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const fetchAllBooks = async (req, res) => {
  try {
    const [books] = await connection.query(`SELECT * FROM books ORDER BY publishedDate DESC`);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const [book] = await connection.query(`SELECT * FROM books WHERE id = ?`, [id]);

    if (book.length === 0) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(book[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const [book] = await connection.query(`SELECT * FROM books WHERE id = ?`, [id]);
    if (book.length === 0) return res.status(404).json({ message: "Book not found" });

    await connection.query(`DELETE FROM books WHERE id = ?`, [id]);
    res.status(200).json({ message: "Book deleted successfully", deletedBook: book[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getBookSuggestions = async (req, res) => {
  try {
    const { searchQuery } = req.params;
    const [books] = await connection.query(
      `SELECT bookName FROM books WHERE bookName LIKE ? OR authorName LIKE ?`,
      [`%${searchQuery}%`, `%${searchQuery}%`]
    );
    res.status(200).json(books);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
    addBook,
    addWillUseBy,
    fetchAllBooks,
    getBookById,
    increaseCopy,
    decreaseCopy,
    addFeedback,
    deleteBookById,
    getBookSuggestions,
    publishBookByUser,
};
