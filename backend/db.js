const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const db = connection.promise();

async function initDatabase() {

    // librarians
    await db.query(`
        CREATE TABLE IF NOT EXISTS librarians (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // users
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // books
    await db.query(`
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookName VARCHAR(255) NOT NULL,
            authorName VARCHAR(255) NOT NULL,
            isbnNumber VARCHAR(100) NOT NULL,
            publishedDate DATE NOT NULL,
            bookImage TEXT,
            description TEXT,
            numberOfCopies INT NOT NULL DEFAULT 1,
            fine DECIMAL(10, 2),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // useByDates
    await db.query(`
        CREATE TABLE IF NOT EXISTS useByDates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookId INT NOT NULL,
            willUseBy DATE NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE
        )
    `);

    // feedbacks
    await db.query(`
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookId INT NOT NULL,
            userId INT NOT NULL,
            rating INT NOT NULL,
            feedback TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);


    // cart
    await db.query(`
        CREATE TABLE IF NOT EXISTS carts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`);    

    // cart_items
    await db.query(`
        CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cartId INT NOT NULL,
        bookId VARCHAR(255) NOT NULL,
        FOREIGN KEY (cartId) REFERENCES carts(id) ON DELETE CASCADE
    )`);

    // reserved_books
    await db.query(`
        CREATE TABLE IF NOT EXISTS reserved_books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,  
            bookId INT NOT NULL,  
            fine VARCHAR(255),
            createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            willUseBy DATE,
            submitStatus VARCHAR(255),
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE 
        )`);

    // submissions
    await db.query(`
            CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )`);

    // submission_items
    await db.query(`
        CREATE TABLE IF NOT EXISTS submission_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submissionId INT NOT NULL,
            bookId INT NOT NULL,
            bookName VARCHAR(255),
            authorName VARCHAR(255),
            isbnNumber VARCHAR(255),
            publishedDate VARCHAR(255),
            bookImage TEXT,
            description TEXT,
            submittedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submissionId) REFERENCES submissions(id) ON DELETE CASCADE,
            FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE
        )`);


    // publications
    await db.query(`
        CREATE TABLE IF NOT EXISTS publications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bookName VARCHAR(255) NOT NULL,
            authorName VARCHAR(255) NOT NULL,
            isbnNumber VARCHAR(100) NOT NULL,
            publishedDate VARCHAR(100) NOT NULL,
            bookImage TEXT,
            description TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);


    // emails: one per user per day
    await db.query(`
        CREATE TABLE IF NOT EXISTS emails (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            user_id      INT NOT NULL,
            created_date DATE NOT NULL,
            UNIQUE KEY uq_emails_user_date (user_id, created_date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) 
    `);

    // email_items: which book reminders have been sent (unique per email, book, date)
    await db.query(`
        CREATE TABLE IF NOT EXISTS email_items (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            email_id     INT NOT NULL,
            book_id      INT NOT NULL,
            created_date DATE NOT NULL,
            UNIQUE KEY uq_items_email_book_date (email_id, book_id, created_date),
            FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id)  REFERENCES books(id) ON DELETE CASCADE
        )
    `);
  


    console.log("Tables ensured."); 
}

connection.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err);
    } else {
        console.log("Connected to MySQL");
        initDatabase().catch(console.error);
    }
});

module.exports = db;