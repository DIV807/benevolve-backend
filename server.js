const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

const authenticateToken = require('./middleware/authenticateToken');

const Volunteer = require('./models/Volunteer');
const NGO = require('./models/NGO');
const Event = require('./models/Event');


const communityRoutes = require("./routes/communityRoutes");



const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');



const leaderboardRoutes = require("./routes/leaderboard");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiledisplay"); 


const eventRoutes = require("./routes/eventRoutes");


const locationRoutes = require("./routes/locationRoutes");

const publicEventsRoute = require("./routes/publicEvents");

const chatRoutes = require("./routes/chatRoutes");
const impactStoryRoutes = require("./routes/impactStoryRoutes");
const setupChatSocket = require("./socketHandlers/chatHandler");

const syncLiveEvents = require("./syncLiveEvents");
const cron = require('node-cron');





dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json()); 

app.use("/api", eventRoutes);

app.use("/api", locationRoutes);

app.use("/api/users", leaderboardRoutes); // Leaderboard API
app.use("/api/auth", authRoutes); // Authentication API
app.use("/api/profile", profileRoutes); // Register Profile API

app.use("/api/community", communityRoutes);

app.use("/api", publicEventsRoute);

app.use("/api/chat", chatRoutes);
app.use("/api/impact-stories", impactStoryRoutes);


const vocabPath = path.join(__dirname, 'model', 'tfidf_vectorizer_vocab.json');
const vocabIndex = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));


function tokenize(text) {
  return text.toLowerCase().split(/\W+/).filter(Boolean);
}

// Vectorizer
function vectorize(text) {
  const vec = new Array(Object.keys(vocabIndex).length).fill(0);
  tokenize(text).forEach(word => {
    if (vocabIndex[word] !== undefined) vec[vocabIndex[word]] = 1;
  });
  return vec;
}



let mlModel;

(async () => {
  try {
    // Load saved weights
    const weightsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'model', 'model_weights.json'), 'utf-8'));

    mlModel = tf.sequential();
    mlModel.add(tf.layers.dense({ inputShape: [200], units: 64, activation: 'relu' }));
    mlModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    mlModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    const weightTensors = mlModel.getWeights().map((w, i) => tf.tensor(weightsData[i]));
    mlModel.setWeights(weightTensors);

    console.log("✅ ML model loaded for search");
  } catch (err) {
    console.error("⚠️ Could not load ML model:", err.message);
  }
})();


// 🔹 Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Setup Socket.io for real-time chat
    setupChatSocket(io);
    
    // Schedule automatic event sync (runs daily at 2 AM)
    cron.schedule('0 2 * * *', () => {
      console.log('🔄 Running scheduled event sync...');
      syncLiveEvents().catch(err => {
        console.error('❌ Scheduled sync failed:', err);
      });
    });
    console.log('✅ Scheduled daily event sync at 2:00 AM');
    
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Socket.io server ready for real-time chat`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Hello, Benevolve Backend!');
});




// 🔹 Volunteer Signup Route 
app.post('/api/volunteers/signup', async (req, res) => {
  console.log(' Received Volunteer Signup Request:', req.body);

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
      password: hashedPassword, 
      interests,
      availability,
    });

    await newVolunteer.save();
    res.status(201).json({ message: "🎉 Volunteer registered successfully!" });
  } catch (error) {
    console.error(' Volunteer Signup Error:', error);
    res.status(500).json({ message: "Internal server error!", error: error.message });
  }
});

// 🔹 NGO Signup Route (with password hashing)
app.post('/api/ngos/signup', async (req, res) => {
  console.log(' Received NGO Signup Request:', req.body);

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

// 🔍 Search API for Events (moved to eventRoutes.js to avoid route conflicts)
// The search route is now handled in routes/eventRoutes.js before the :eventId route




app.post('/api/events/:eventId/volunteer', authenticateToken, async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id; 

  try {
      const event = await Event.findById(eventId);

      if (!event) {
          return res.status(404).json({ message: "Event not found" });
      }

      // Convert userId to string for comparison
      const userIdStr = userId.toString();
      const isAlreadyRegistered = event.volunteers && event.volunteers.some(
          volId => volId.toString() === userIdStr
      );

      if (isAlreadyRegistered) {
          return res.status(400).json({ message: "Already registered for this event" });
      }

      event.volunteers = event.volunteers || []; 
      event.volunteers.push(userId);
      await event.save();

      res.status(200).json({ message: "Successfully registered as volunteer" });
  } catch (error) {
      console.error("❌ Volunteer registration error:", error);
      if (error.name === 'CastError') {
          return res.status(400).json({ message: "Invalid event ID" });
      }
      res.status(500).json({ message: "Internal Server Error" });
  }
});

// 🔄 Manual sync endpoint for live events
app.post('/api/events/sync', async (req, res) => {
  try {
    console.log('🔄 Manual event sync triggered');
    res.status(202).json({ message: 'Event sync started. Check server logs for progress.' });
    
    // Run sync in background
    syncLiveEvents().catch(err => {
      console.error('❌ Manual sync failed:', err);
    });
  } catch (error) {
    console.error('❌ Error triggering sync:', error);
    res.status(500).json({ message: 'Failed to trigger sync' });
  }
});






app.get('/', (req, res) => {
  res.send('Hello, Benevolve Backend!');
});



