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