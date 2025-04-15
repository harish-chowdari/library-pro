const connection = require("../db");

async function addToReserved(req, res) {
    try {
        const { userId, bookId, fine, createdDate = new Date(), willUseBy } = req.body;

        if (!userId || !bookId || !fine || !willUseBy) {
            return res.status(400).json({ message: "userId, bookId, fine, and willUseBy are required" });
        }

        // Fetch the book from the books table
        const [book] = await connection.query("SELECT * FROM books WHERE id = ?", [bookId]);

        if (book.length === 0) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Check if the user has already reserved the book
        const [userReservedBook] = await connection.query(
            "SELECT * FROM reserved_books WHERE userId = ? AND bookId = ?",
            [userId, bookId]
        );

        if (userReservedBook.length > 0) {
            return res.status(200).json({ alreadyReserved: "You have already reserved this book" });
        }

        // Check if the number of reserved copies is greater than or equal to the number of available copies
        const [reservedBooks] = await connection.query(
            "SELECT * FROM reserved_books WHERE bookId = ?",
            [bookId]
        );

        if (reservedBooks.length >= book[0].numberOfCopies) {
            return res.status(200).json({ allCopiesReserved: "All copies of this book have been reserved" });
        }

        // Proceed with adding the book to reserved
        await connection.query(
            "INSERT INTO reserved_books (userId, bookId, fine, createdDate, willUseBy) VALUES (?, ?, ?, ?, ?)",
            [userId, bookId, fine, createdDate, willUseBy]
        );

        return res.json({ reserved: "This book is reserved for you" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getBookCopiesCount(req, res) {
    try {
        const { bookId } = req.params;
        const [reservedCount] = await connection.query(
            "SELECT COUNT(*) AS reservedCount FROM reserved_books WHERE bookId = ?",
            [bookId]
        );
        res.json({ reservedCount: reservedCount[0].reservedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getReserved(req, res) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const [booksReserved] = await connection.query(
            `SELECT 
                reserved_books.*, 
                books.bookName, 
                books.authorName, 
                books.description,
                books.bookImage,
                books.numberOfCopies
             FROM reserved_books 
             JOIN books ON reserved_books.bookId = books.id 
             WHERE reserved_books.userId = ?`,
            [userId]
        );

        if (booksReserved.length === 0) {
            return res.status(200).json({ message: "Reserved not found" });
        }

        res.json({ booksReserved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}


async function getAllReserved(req, res) {
    try {
        const [allReserved] = await connection.query(
            "SELECT reserved_books.*, users.name AS userName, books.bookName AS bookName FROM reserved_books JOIN users ON reserved_books.userId = users.id JOIN books ON reserved_books.bookId = books.id"
        );

        if (allReserved.length === 0) {
            return res.status(200).json({ noReservedFound: "Reserved not found" });
        }

        res.json({ allReserved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getAllReservedToGroupBookId(req, res) {
    try {
        const [allReserved] = await connection.query("SELECT * FROM reserved_books");

        if (allReserved.length === 0) {
            return res.status(200).json({ noReservedFound: "No reserved books found" });
        }

        return res.json({ allReserved });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

async function getBookIdGroup(req, res) {
    try {
        const { bookId } = req.params;

        if (!bookId) {
            return res.status(400).json({ error: "bookId is required" });
        }

        const [allReserved] = await connection.query("SELECT * FROM reserved_books");

        const filteredReserved = allReserved
            .filter(reserved => reserved.bookId === bookId);

        if (filteredReserved.length === 0) {
            return res.status(200).json({ message: "No reserved books found for the specified bookId" });
        }

        return res.json({ result: filteredReserved });
    } catch (error) {
        console.error("Error in getBookIdGroup:", error);
        return res.status(500).json({ message: error.message });
    }
}

async function getNearestWillUseBy(req, res) {
    try {
        const { bookId } = req.params;
        const currentDate = new Date();

        const groupResponse = await getBookIdGroup({ params: { bookId } }, {});

        const result = groupResponse.result;

        if (!result || !Array.isArray(result) || result.length === 0) {
            return res.status(400).json({ message: "Invalid or empty result array" });
        }

        let nearestWillUseBy = null;
        let minDifference = Infinity;

        result.forEach(item => {
            const willUseByDate = new Date(item.willUseBy);
            willUseByDate.setDate(willUseByDate.getDate() + 1);

            const differenceInDays = Math.ceil((willUseByDate - currentDate) / (1000 * 60 * 60 * 24));

            if (willUseByDate >= currentDate) {
                if (differenceInDays <= minDifference) {
                    minDifference = differenceInDays;
                    nearestWillUseBy = willUseByDate;
                }
            }
        });

        res.json({ nearestWillUseBy });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function deleteBookFromReserved(req, res) {
    try {
        const { userId, bookId } = req.body;

        if (!userId || !bookId) {
            return res.status(400).json({ message: "userId and bookId are required" });
        }

        await connection.query(
            "DELETE FROM reserved_books WHERE userId = ? AND bookId = ?",
            [userId, bookId]
        );

        return res.status(200).json({ deletedFromReserved: "Book removed from reservation successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

async function updateReservedBook(req, res) {
    try {
        const { userId, bookId } = req.body;

        if (!userId || !bookId) {
            return res.status(400).json({ message: "userId and bookId are required" });
        }

        await connection.query(
            "UPDATE reserved_books SET submitStatus = 'Submitting' WHERE userId = ? AND bookId = ?",
            [userId, bookId]
        );

        return res.status(200).json({ updatedReservation: "Book submission request sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

async function removeFine(req, res) {
    try {
        const { userId, bookId } = req.params;

        if (!userId || !bookId) {
            return res.status(400).json({ message: "userId and bookId are required" });
        }

        await connection.query(
            "UPDATE reserved_books SET fine = NULL WHERE userId = ? AND bookId = ?",
            [userId, bookId]
        );

        return res.status(200).json({ fineRemoved: "Fine removed successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    addToReserved,
    getBookCopiesCount,
    getReserved, 
    getAllReserved,
    getAllReservedToGroupBookId,
    getBookIdGroup,
    getNearestWillUseBy,
    deleteBookFromReserved,
    updateReservedBook,
    removeFine
};
