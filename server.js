const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Volunteer = require('./models/Volunteer');
const NGO = require('./models/NGO');
const Event = require('./models/Event');

dotenv.config();
const app = express();


app.use(cors()); 
app.use(express.json()); 

// 🔹 Connect to MongoDB 
const mongoURI = 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
   
    const port = 5000;
    app.listen(port, () => console.log(` Server is running on port ${port}`));
  })
  .catch((err) => {
    console.error(' Error connecting to MongoDB:', err);
    process.exit(1); 
  });


app.get('/', (req, res) => {
  res.send('Hello, Benevolve Backend!');
});



// Volunteer Signup Route
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

    const newVolunteer = new Volunteer({
      name,
      email,
      password, 
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



// 🔹 NGO Signup Route
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

    const newNGO = new NGO({
      name,
      email,
      password, 
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






// Search API for Events
app.post('/api/events/search', async (req, res) => {
  const { interests, location, availability } = req.body;

  try {
      
      let query = {};

      // Match skills
      if (interests) {
          const interestsArray = interests.split(',').map(skill => skill.trim());
          query.skills = { $in: interestsArray };
      }

      // Match location 
      if (location) {
          query.location = { $regex: new RegExp(location, 'i') };
      }

      if (availability) {
          query.date = { $gte: new Date() }; 
      }

      const events = await Event.find(query);

      res.status(200).json({ events });
  } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});







// ✅ Import Routes
const leaderboardRoutes = require("./routes/leaderboard"); // Ensure this path is correct

// ✅ Use Routes
app.use("/api/users", leaderboardRoutes); // Leaderboard API will be available at "/api/users/leaderboard"
