const dotenv = require('dotenv');
const mongoose = require("mongoose");
const User = require("./models/User");

dotenv.config();

const mongoURI = 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ Error connecting to MongoDB:', err);
    process.exit(1);
  });
  

const sampleUsers = [
    { name: "Aarav Sharma", email: "aarav@example.com", password: "securepass123", points: 120, badges: ["🏅 Super Volunteer"] },
    { name: "Sanya Mehta", email: "sanya@example.com", password: "mypassword", points: 80, badges: ["🎖 Active Helper"] },
    { name: "Rohan Gupta", email: "rohan@example.com", password: "rohanpass", points: 30, badges: ["⭐ Rising Star"] },
];

const insertUsers = async () => {
    try {
        await User.insertMany(sampleUsers);
        console.log("✅ Sample users added successfully");
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error adding users:", error);
    }
};

insertUsers();
