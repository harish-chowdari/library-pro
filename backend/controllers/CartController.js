const connection = require("../db");

async function addToCart(req, res) {
    try {
        const { userId, bookId } = req.body;
        
        if (!userId || !bookId) {
            return res.status(400).json({ message: "userId and bookId are required" });
        }

        // Use the stored procedure instead of direct queries
        const [result] = await connection.query(
            "CALL sp_add_to_cart(?, ?, @result)", 
            [userId, bookId]
        );
        
        // Get the output parameter value
        const [output] = await connection.query("SELECT @result AS result");
        
        if (output[0].result === 'Book already in cart') {
            return res.status(200).json({ alreadyAdded: output[0].result });
        }
        
        res.status(200).json({ message: output[0].result });
    } catch (error) {
        console.error(error);
        
        // Handle specific SQL errors
        if (error.sqlState === '45000') {
            return res.status(400).json({ message: error.sqlMessage });
        }
        
        res.status(500).json({ message: error.message });
    }
}

async function getCartItemsByUserId(req, res) {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        // Use the stored procedure to get cart items
        const [items] = await connection.query(
            "CALL sp_get_cart_items(?)",
            [userId]
        );
        
        // If no items found, stored procedure returns empty result set
        if (items[0].length === 0) {
            return res.status(200).json({ 
                userId, 
                items: [],
                message: "Cart is empty or not found" 
            });
        }

        res.status(200).json({ userId, items: items[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getCartItems(req, res) {
    try {
        // Use the stored procedure to get all carts
        const [results] = await connection.query("CALL sp_get_all_carts()");
        
        // The stored procedure already formats data appropriately
        res.status(200).json(results[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function removeFromCart(req, res) {
    try {
        const { userId, bookId } = req.body;

        if (!userId || !bookId) {
            return res.status(400).json({ message: "userId and bookId are required" });
        }

        // Use the stored procedure
        const [result] = await connection.query(
            "CALL sp_remove_from_cart(?, ?, @result)", 
            [userId, bookId]
        );
        
        // Get the output parameter value
        const [output] = await connection.query("SELECT @result AS result");
        
        if (output[0].result === 'Cart not found for this user') {
            return res.status(404).json({ message: output[0].result });
        }
        
        res.status(200).json({ message: output[0].result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function removeFromEveryOnesCart(req, res) {
    try {
        const { bookId } = req.body;
        
        if (!bookId) {
            return res.status(400).json({ message: "bookId is required" });
        }

        // This operation is best handled by direct SQL for simplicity
        // We could create a stored procedure for this as well
        await connection.query("DELETE FROM cart_items WHERE bookId = ?", [bookId]);

        res.status(200).json({ message: "Book removed from all carts successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while removing the book from carts" });
    }
}

// New method to get cart summary using the view
async function getCartSummary(req, res) {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        
        // Use the cart_details view
        const [cartDetails] = await connection.query(
            "SELECT * FROM cart_details WHERE userId = ?",
            [userId]
        );
        
        if (cartDetails.length === 0) {
            return res.status(200).json({ 
                userId, 
                cartItems: [],
                totalItems: 0,
                message: "Cart is empty or not found" 
            });
        }
        
        // Calculate summary data
        const totalItems = cartDetails.length;
        const totalPrice = cartDetails.reduce((sum, item) => sum + (item.price || 0), 0);
        
        res.status(200).json({
            userId,
            cartItems: cartDetails,
            totalItems,
            totalPrice,
            summary: `Your cart has ${totalItems} items with a total value of $${totalPrice.toFixed(2)}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    addToCart,
    getCartItemsByUserId,
    getCartItems,
    removeFromCart,
    removeFromEveryOnesCart,
    getCartSummary // Export the new method
};