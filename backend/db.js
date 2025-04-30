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


    await db.query(`
        DELIMITER $$
        CREATE PROCEDURE IF NOT EXISTS sp_add_to_cart(IN p_userId INT, IN p_bookId INT, OUT p_result VARCHAR(255))
        BEGIN
          DECLARE cartId INT;
          SELECT id INTO cartId FROM carts WHERE userId = p_userId LIMIT 1;
          IF cartId IS NULL THEN
            INSERT INTO carts (userId) VALUES (p_userId);
            SET cartId = LAST_INSERT_ID();
          END IF;
          IF EXISTS (SELECT 1 FROM cart_items WHERE cartId = cartId AND bookId = p_bookId) THEN
            SET p_result = 'Book already in cart';
          ELSE
            INSERT INTO cart_items (cartId, bookId) VALUES (cartId, p_bookId);
            SET p_result = 'Book added to cart successfully';
          END IF;
        END$$
  
        CREATE PROCEDURE IF NOT EXISTS sp_get_cart_items(IN p_userId INT)
        BEGIN
          SELECT ci.id AS cartItemId, b.id AS bookId, b.bookName AS title, b.fine AS price
          FROM carts c
          JOIN cart_items ci ON ci.cartId = c.id
          JOIN books b ON b.id = ci.bookId
          WHERE c.userId = p_userId;
        END$$
  
        CREATE PROCEDURE IF NOT EXISTS sp_get_all_carts()
        BEGIN
          SELECT u.id AS userId, u.name AS userName, b.id AS bookId, b.bookName AS title, b.fine AS price
          FROM users u
          JOIN carts c ON u.id = c.userId
          JOIN cart_items ci ON ci.cartId = c.id
          JOIN books b ON b.id = ci.bookId;
        END$$
  
        CREATE PROCEDURE IF NOT EXISTS sp_remove_from_cart(IN p_userId INT, IN p_bookId INT, OUT p_result VARCHAR(255))
        BEGIN
          DECLARE cartId INT;
          SELECT id INTO cartId FROM carts WHERE userId = p_userId LIMIT 1;
          IF cartId IS NULL THEN
            SET p_result = 'Cart not found for this user';
          ELSE
            DELETE FROM cart_items WHERE cartId = cartId AND bookId = p_bookId;
            SET p_result = 'Book removed from cart';
          END IF;
        END$$
        DELIMITER ;
      `);
  
      // view
      await db.query(`
        CREATE OR REPLACE VIEW cart_details AS
        SELECT u.id AS userId, u.name AS userName, b.id AS bookId, b.bookName AS title, b.fine AS price, ci.id AS cartItemId
        FROM users u
        JOIN carts c ON u.id = c.userId
        JOIN cart_items ci ON ci.cartId = c.id
        JOIN books b ON b.id = ci.bookId;
      `);
  
      // audit table
      await db.query(`
        CREATE TABLE IF NOT EXISTS cart_audit (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cartItemId INT,
          cartId INT,
          bookId INT,
          action VARCHAR(50),
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
  
      // trigger
      await db.query(`
        DROP TRIGGER IF EXISTS after_cart_item_insert;
        CREATE TRIGGER after_cart_item_insert
        AFTER INSERT ON cart_items
        FOR EACH ROW
        INSERT INTO cart_audit (cartItemId, cartId, bookId, action)
        VALUES (NEW.id, NEW.cartId, NEW.bookId, 'INSERT');
      `);
  
      console.log("Tables, procedures, view, and trigger ensured.");
  }
  


    console.log("Tables ensured."); 

connection.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err);
    } else {
        console.log("Connected to MySQL");
        initDatabase().catch(console.error);
    }
});

module.exports = db;