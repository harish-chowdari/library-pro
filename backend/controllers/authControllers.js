const connection = require("../db");

// Create Librarian Account
const createLibrarianAccount = async (req, res) => {
    try {
        const { email, name, password } = req.body;

        // Check if the librarian already exists
        const [existing] = await connection.query("SELECT * FROM librarians WHERE email = ?", [email]);
        if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });

        // Insert the new librarian
        const [result] = await connection.query("INSERT INTO librarians (email, name, password) VALUES (?, ?, ?)", [email, name, password]);
        
        // Retrieve the newly created librarian
        const [librarian] = await connection.query("SELECT * FROM librarians WHERE id = ?", [result.insertId]);
        
        return res.json({ message: "Account created successfully", librarian: librarian[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Librarian Login
const librarianLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find librarian by email
        const [rows] = await connection.query("SELECT * FROM librarians WHERE email = ?", [email]);

        if (rows.length === 0) return res.status(400).json({ message: "User Not Found" });

        const librarian = rows[0];

        // Check password
        if (librarian.password === password) {
        return res.json({ message: "Login successful", librarian });
        } else {
        return res.status(400).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get Librarian by ID
const getLibrarianById = async (req, res) => {
  try {
        const { id } = req.params;

        // Find librarian by ID
        const [rows] = await connection.query("SELECT * FROM librarians WHERE id = ?", [id]);

        if (rows.length === 0) return res.status(400).json({ message: "Librarian not found" });

        const librarian = rows[0];
        return res.json({ message: "Librarian found", librarian });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Create User Account
const createUserAccount = async (req, res) => {
    try {
        const { email, name, password } = req.body;

        // Check if the user already exists
        const [existing] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) return res.status(400).json({ message: "Email already exists" });

        // Insert the new user
        const [result] = await connection.query("INSERT INTO users (email, name, password) VALUES (?, ?, ?)", [email, name, password]);
        
        // Retrieve the newly created user
        const [user] = await connection.query("SELECT * FROM users WHERE id = ?", [result.insertId]);

        return res.json({ message: "Account created successfully", user: user[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// User Login
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const [rows] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length === 0) return res.status(400).json({ message: "User Not Found" });

        const user = rows[0];

        // Check password
        if (user.password === password) {
        return res.json({ message: "Login successful", user });
        } else {
        return res.status(400).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get User by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user by ID
        const [rows] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);

        if (rows.length === 0) return res.status(400).json({ message: "User not found" });

        const user = rows[0];
        return res.json({ message: "User found", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createLibrarianAccount,
    librarianLogin,
    getLibrarianById,
    createUserAccount,
    userLogin,
    getUserById
};
