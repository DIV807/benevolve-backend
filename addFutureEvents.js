const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event'); 

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Generate future dates starting from today
const today = new Date();
today.setHours(0, 0, 0, 0);

const getFutureDate = (daysFromNow) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const sampleEvents = [
  {
    name: "Tech for Good Hackathon",
    date: getFutureDate(30),
    location: "Mumbai",
    skills: ["JavaScript", "Python", "AI"],
    description: "A hackathon focused on technology solutions for social impact."
  },
  {
    name: "Community Cleanup Drive",
    date: getFutureDate(45),
    location: "Delhi",
    skills: ["Teamwork", "Public Speaking"],
    description: "Join us to clean up parks and spread awareness about waste management."
  },
  {
    name: "Mental Health Awareness Webinar",
    date: getFutureDate(20),
    location: "Bangalore",
    skills: ["Counseling", "Communication"],
    description: "An online event discussing mental health challenges and support systems."
  },
  {
    name: "Code for Climate",
    date: getFutureDate(60),
    location: "Hyderabad",
    skills: ["Python", "Data Science"],
    description: "Develop AI-based solutions to tackle climate change issues."
  },
  {
    name: "Cleanliness Drive - Mumbai Beach",
    date: getFutureDate(25),
    location: "Juhu Beach, Mumbai",
    skills: ["Teamwork", "Environmental Awareness"],
    description: "Join us for a beach cleanup to make Mumbai's coastline cleaner!"
  },
  {
    name: "Tech for Good - AI for NGOs",
    date: getFutureDate(40),
    location: "Bangalore",
    skills: ["Machine Learning", "Data Science", "AI"],
    description: "A workshop on how AI can help NGOs streamline their work."
  },
  {
    name: "Tree Plantation Drive",
    date: getFutureDate(35),
    location: "Delhi",
    skills: ["Gardening", "Sustainability"],
    description: "Plant trees in urban areas to make Delhi greener!"
  },
  {
    name: "Blood Donation Camp",
    date: getFutureDate(15),
    location: "Pune",
    skills: ["Medical Knowledge", "Public Relations"],
    description: "Donate blood and save lives. Volunteers needed to manage registrations."
  },
  {
    name: "Teaching Underprivileged Kids",
    date: getFutureDate(50),
    location: "Kolkata",
    skills: ["Teaching", "Communication"],
    description: "Help educate children from low-income backgrounds."
  },
  {
    name: "Animal Welfare Drive",
    date: getFutureDate(30),
    location: "Chennai",
    skills: ["Animal Care", "Empathy"],
    description: "Assist in rescuing and caring for stray animals."
  },
  {
    name: "Women's Safety Awareness Campaign",
    date: getFutureDate(45),
    location: "Hyderabad",
    skills: ["Public Speaking", "Self-defense"],
    description: "An initiative to educate and empower women regarding safety measures."
  },
  {
    name: "Recycling & Waste Management Workshop",
    date: getFutureDate(55),
    location: "Ahmedabad",
    skills: ["Sustainability", "Problem-Solving"],
    description: "Learn how to recycle and manage waste effectively."
  },
  {
    name: "Elderly Care Volunteering",
    date: getFutureDate(32),
    location: "Jaipur",
    skills: ["Compassion", "Patience"],
    description: "Spend time with senior citizens and help them with daily activities."
  },
  {
    name: "Village Digital Literacy Program",
    date: getFutureDate(70),
    location: "Varanasi",
    skills: ["Teaching", "Computer Basics"],
    description: "Teach basic computer skills to villagers to improve digital literacy."
  },
  {
    name: "Flood Relief Support",
    date: getFutureDate(90),
    location: "Assam",
    skills: ["Disaster Management", "First Aid"],
    description: "Help distribute relief material and provide support to flood-affected areas."
  },
  {
    name: "Women Entrepreneurship Bootcamp",
    date: getFutureDate(100),
    location: "Bhopal",
    skills: ["Business Planning", "Finance"],
    description: "Support women entrepreneurs by mentoring them in starting businesses."
  },
  {
    name: "AI for Social Good Hackathon",
    date: getFutureDate(120),
    location: "Hyderabad",
    skills: ["Python", "AI/ML"],
    description: "Build AI-powered solutions for real-world social challenges."
  },
  {
    name: "Rural Healthcare Awareness Camp",
    date: getFutureDate(75),
    location: "Nagpur",
    skills: ["Medical Knowledge", "Communication"],
    description: "Spread awareness about hygiene, nutrition, and common diseases."
  },
  {
    name: "Public Transport Accessibility Survey",
    date: getFutureDate(85),
    location: "Lucknow",
    skills: ["Data Collection", "Problem-Solving"],
    description: "Assist in surveying local transportation to improve accessibility."
  },
  {
    name: "Underprivileged Kids' Art Workshop",
    date: getFutureDate(95),
    location: "Chandigarh",
    skills: ["Painting", "Creativity"],
    description: "Conduct an art session to help children express creativity."
  },
  {
    name: "Coding for Beginners - Free Workshop",
    date: getFutureDate(65),
    location: "Bangalore",
    skills: ["JavaScript", "Web Development"],
    description: "A free coding bootcamp for students with no prior experience."
  },
  {
    name: "Mental Health Support Group",
    date: getFutureDate(130),
    location: "Jaipur",
    skills: ["Counseling", "Active Listening"],
    description: "Facilitate discussions on mental well-being and provide peer support."
  },
  {
    name: "Plastic-Free City Awareness Drive",
    date: getFutureDate(80),
    location: "Indore",
    skills: ["Public Speaking", "Community Outreach"],
    description: "Spread awareness about reducing plastic usage in urban areas."
  },
  {
    name: "Elderly Home Assistance Program",
    date: getFutureDate(140),
    location: "Mysore",
    skills: ["Empathy", "Caregiving"],
    description: "Help elderly citizens by engaging in recreational activities."
  },
  {
    name: "Renewable Energy Workshop",
    date: getFutureDate(150),
    location: "Kochi",
    skills: ["Sustainability", "Solar Energy"],
    description: "Educate students about renewable energy and its applications."
  },
  {
    name: "Sports for Youth Development",
    date: getFutureDate(110),
    location: "Kolkata",
    skills: ["Coaching", "Leadership"],
    description: "Encourage sports participation among underprivileged kids."
  },
  {
    name: "Sign Language Learning Workshop",
    date: getFutureDate(68),
    location: "Delhi",
    skills: ["Sign Language", "Inclusive Communication"],
    description: "Teach basic sign language to promote inclusivity."
  },
  {
    name: "Safe Cycling & Road Safety Initiative",
    date: getFutureDate(115),
    location: "Ahmedabad",
    skills: ["Traffic Rules", "Public Speaking"],
    description: "Spread awareness on safe cycling and responsible road behavior."
  },
  {
    name: "STEM Workshop for Girls",
    date: getFutureDate(88),
    location: "Bangalore",
    skills: ["Science", "Coding"],
    description: "Encourage young girls to explore STEM fields."
  },
  {
    name: "Food Waste Reduction Campaign",
    date: getFutureDate(125),
    location: "Pune",
    skills: ["Sustainability", "Community Engagement"],
    description: "Educate restaurants and households on reducing food wastage."
  },
  {
    name: "Cancer Awareness Fundraiser",
    date: getFutureDate(160),
    location: "Hyderabad",
    skills: ["Event Management", "Marketing"],
    description: "Organize a fundraiser to support cancer treatment programs."
  },
  {
    name: "Tech Training for Senior Citizens",
    date: getFutureDate(105),
    location: "Mumbai",
    skills: ["Basic Computing", "Patience"],
    description: "Help seniors learn how to use smartphones and the internet."
  },
  {
    name: "DIY Home Gardening Workshop",
    date: getFutureDate(92),
    location: "Chennai",
    skills: ["Gardening", "Composting"],
    description: "Learn about organic gardening and sustainable farming techniques."
  },
  {
    name: "Book Donation & Literacy Drive",
    date: getFutureDate(135),
    location: "Patna",
    skills: ["Organizing", "Teaching"],
    description: "Donate books and tutor underprivileged students."
  },
  {
    name: "Cyber Security Awareness Drive",
    date: getFutureDate(72),
    location: "Noida",
    skills: ["Cybersecurity", "Public Awareness"],
    description: "Teach people about online safety and fraud prevention."
  },
  {
    name: "AI in Healthcare Panel Discussion",
    date: getFutureDate(82),
    location: "Bangalore",
    skills: ["Healthcare", "Artificial Intelligence"],
    description: "Experts discuss AI advancements in the healthcare industry."
  },
  {
    name: "Financial Literacy for Youth",
    date: getFutureDate(112),
    location: "Nagpur",
    skills: ["Finance", "Budgeting"],
    description: "Teach college students about savings and investments."
  },
  {
    name: "Zero-Waste Lifestyle Workshop",
    date: getFutureDate(145),
    location: "Surat",
    skills: ["Sustainability", "Recycling"],
    description: "Learn how to live a zero-waste lifestyle and reduce landfill waste."
  },
  {
    name: "Disaster Preparedness & Relief Training",
    date: getFutureDate(165),
    location: "Bhubaneswar",
    skills: ["Emergency Response", "Community Leadership"],
    description: "Train volunteers for disaster relief and emergency response."
  },
  {
    name: "Community Murals & Street Art Festival",
    date: getFutureDate(118),
    location: "Jaipur",
    skills: ["Painting", "Creativity"],
    description: "Beautify public spaces through street art and murals."
  },
  {
    name: "Ethical Hacking Workshop",
    date: getFutureDate(102),
    location: "Chennai",
    skills: ["Cybersecurity", "Ethical Hacking"],
    description: "Learn about ethical hacking and cyber threat detection."
  },
  {
    name: "AI for Accessibility - Tech Event",
    date: getFutureDate(78),
    location: "Delhi",
    skills: ["Machine Learning", "UX Design"],
    description: "Develop AI-based solutions for improving accessibility."
  }
];

const insertSampleEvents = async () => {
  try {
    // Check for duplicates before inserting
    let added = 0;
    let skipped = 0;

    for (const eventData of sampleEvents) {
      const existingEvent = await Event.findOne({
        name: eventData.name,
        date: eventData.date
      });

      if (existingEvent) {
        skipped++;
        continue;
      }

      const event = new Event(eventData);
      await event.save();
      added++;
      console.log(`✅ Added: ${eventData.name} (${eventData.date.toISOString().split('T')[0]})`);
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Added: ${added} events`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped} events`);
    console.log(`   📊 Total upcoming events in database: ${await Event.countDocuments({ date: { $gte: new Date() } })}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error adding sample events:', error);
    mongoose.connection.close();
  }
};

insertSampleEvents();
