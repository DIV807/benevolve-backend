const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    points: { type: Number, default: 0 },  
    badges: { type: [String], default: [] }
});

// Check if the model is already defined in mongoose.models
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
