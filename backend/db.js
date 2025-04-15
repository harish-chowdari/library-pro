const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const db = connection.promise();

async function initDatabase() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS librarians (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

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