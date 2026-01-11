const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; 

    if (!token) {
        return res.status(403).json({ message: "Token is required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token expired. Please log in again." });
            }
            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = user; 
        next();
    });
}

module.exports = authenticateToken; 


