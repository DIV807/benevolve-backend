const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');


const Volunteer = require('./models/Volunteer');
const NGO = require('./models/NGO');
const Event = require('./models/Event');



const leaderboardRoutes = require("./routes/leaderboard");
const authRoutes = require("./routes/auth");

const profileRoutes = require("./routes/profiledisplay"); 


const eventRoutes = require("./routes/eventRoutes");


const locationRoutes = require("./routes/locationRoutes");


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json()); // ✅ Ensure server can handle JSON requests

app.use("/api", eventRoutes);

app.use("/api", locationRoutes);

app.use("/api/users", leaderboardRoutes); // Leaderboard API
app.use("/api/auth", authRoutes); // Authentication API
app.use("/api/profile", profileRoutes); // Register Profile API


// 🔹 Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Hello, Benevolve Backend!');
});




// 🔹 Volunteer Signup Route (with password hashing)
app.post('/api/volunteers/signup', async (req, res) => {
  console.log('🟢 Received Volunteer Signup Request:', req.body);

  const { name, email, password, interests, availability } = req.body;

  try {
    if (!name || !email || !password || !interests || !availability) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const existingVolunteer = await Volunteer.findOne({ email });
    if (existingVolunteer) {
      return res.status(400).json({ message: "Volunteer with this email already exists!" });
    }

    // 🔹 Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newVolunteer = new Volunteer({
      name,
      email,
      password: hashedPassword, // ✅ Store hashed password
      interests,
      availability,
    });

    await newVolunteer.save();
    res.status(201).json({ message: "🎉 Volunteer registered successfully!" });
  } catch (error) {
    console.error('❌ Volunteer Signup Error:', error);
    res.status(500).json({ message: "Internal server error!", error: error.message });
  }
});

// 🔹 NGO Signup Route (with password hashing)
app.post('/api/ngos/signup', async (req, res) => {
  console.log('🟢 Received NGO Signup Request:', req.body);

  const { name, email, password, missionStatement, areasOfOperation } = req.body;

  try {
    if (!name || !email || !password || !missionStatement || !areasOfOperation) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const existingNGO = await NGO.findOne({ email });
    if (existingNGO) {
      return res.status(400).json({ message: "NGO with this email already exists!" });
    }

    // 🔹 Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newNGO = new NGO({
      name,
      email,
      password: hashedPassword, // ✅ Store hashed password
      missionStatement,
      areasOfOperation,
    });

    await newNGO.save();
    res.status(201).json({ message: "🎉 NGO registered successfully!" });
  } catch (error) {
    console.error('❌ NGO Signup Error:', error);
    res.status(500).json({ message: "Internal server error!", error: error.message });
  }
});

// 🔍 Search API for Events
app.post('/api/events/search', async (req, res) => {
  const { interests, location, availability } = req.body;

  try {
    let query = {};

    // Match interests
    if (interests) {
      const interestsArray = interests.split(',').map(skill => skill.trim());
      query.skills = { $in: interestsArray };
    }

    // Match location (case insensitive)
    if (location) {
      query.location = { $regex: new RegExp(location, 'i') };
    }

    // Match availability (filter future events)
    if (availability) {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query);
    res.status(200).json({ events });
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});











app.get('/', (req, res) => {
  res.send('Hello, Benevolve Backend!');
});



