const connection = require("../db");

async function addToCart(req, res) {
    try {
        const { userId, bookId } = req.body;
        
        // Check if a cart already exists for the user
        let [cartRows] = await connection.query("SELECT * FROM carts WHERE userId = ?", [userId]);
        
        // If the cart doesn't exist, create a new one
        if (cartRows.length === 0) {
            await connection.query(
                "INSERT INTO carts (userId) VALUES (?)", 
                [userId]
            );
            cartRows = await connection.query("SELECT * FROM carts WHERE userId = ?", [userId]);
        }
        
        const cartId = cartRows[0].id;

        // Check if the book is already in the cart
        const [existingItem] = await connection.query(
            "SELECT * FROM cart_items WHERE cartId = ? AND bookId = ?", 
            [cartId, bookId]
        );
        
        if (existingItem.length > 0) {
            return res.status(200).json({ alreadyAdded: "Book already added to cart" });
        }

        // Add the book to the cart
        await connection.query(
            "INSERT INTO cart_items (cartId, bookId) VALUES (?, ?)",
            [cartId, bookId]
        );

        res.status(200).json({ message: "Item added to cart successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getCartItemsByUserId(req, res) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        // Fetch the cart for the user
        const [cartRows] = await connection.query("SELECT * FROM carts WHERE userId = ?", [userId]);

        if (cartRows.length === 0) {
            return res.status(200).json({ message: "Cart not found for the user" });
        }

        const cartId = cartRows[0].id;

        // Fetch the items in the cart
        const [cartItems] = await connection.query(
            `SELECT books.* FROM cart_items
            JOIN books ON cart_items.bookId = books.id
            WHERE cart_items.cartId = ?`,
            [cartId]
        );

        res.status(200).json({ userId, items: cartItems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getCartItems(req, res) {
    try {
        const [carts] = await connection.query("SELECT * FROM carts");

        const cartItems = [];

        for (const cart of carts) {
            const [items] = await connection.query(
                `SELECT books.* FROM cart_items
                JOIN books ON cart_items.bookId = books.id
                WHERE cart_items.cartId = ?`,
                [cart.id]
            );
            cartItems.push({ userId: cart.userId, items });
        }

        res.status(200).json(cartItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function removeFromCart(req, res) {
    try {
        const { userId, bookId } = req.body;

        // Find the cart for the user
        const [cartRows] = await connection.query("SELECT * FROM carts WHERE userId = ?", [userId]);

        if (cartRows.length === 0) {
            return res.status(404).json({ message: "Cart not found for the user" });
        }

        const cartId = cartRows[0].id;

        // Remove the item from the cart
        await connection.query(
            "DELETE FROM cart_items WHERE cartId = ? AND bookId = ?",
            [cartId, bookId]
        );

        res.status(200).json({ message: "Item removed from cart successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function removeFromEveryOnesCart(req, res) {
    try {
        const { bookId } = req.body;

        // Remove the book from all carts
        await connection.query("DELETE FROM cart_items WHERE bookId = ?", [bookId]);

        res.status(200).json({ message: "Book removed from all carts successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while removing the book from carts" });
    }
}

module.exports = {
    addToCart,
    getCartItemsByUserId,
    getCartItems,
    removeFromCart,
    removeFromEveryOnesCart
};
