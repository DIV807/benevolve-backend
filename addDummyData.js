const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Group = require('./models/Group');
const Thread = require('./models/Thread');
const ImpactStory = require('./models/ImpactStory');
const Volunteer = require('./models/Volunteer');
const NGO = require('./models/NGO');
const Chat = require('./models/Chat');

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Dummy groups data
const dummyGroups = [
  {
    name: "Environmental Warriors",
    description: "A community dedicated to environmental conservation and sustainability. Join us to make a positive impact on our planet!",
    category: "Environment",
    members: []
  },
  {
    name: "Education for All",
    description: "Promoting education and literacy in underserved communities. Together we can bridge the education gap!",
    category: "Education",
    members: []
  },
  {
    name: "Health & Wellness Advocates",
    description: "Supporting health initiatives and wellness programs across communities. Your health matters!",
    category: "Health",
    members: []
  },
  {
    name: "Tech for Good",
    description: "Using technology to solve social problems. Join developers, designers, and innovators making a difference!",
    category: "Technology",
    members: []
  },
  {
    name: "Community Builders",
    description: "Building stronger, more connected communities through volunteer work and local initiatives.",
    category: "Community",
    members: []
  },
  {
    name: "Disaster Relief Network",
    description: "Rapid response team for disaster relief and emergency assistance. Be ready to help when it matters most!",
    category: "Other",
    members: []
  },
  {
    name: "Youth Mentorship Program",
    description: "Empowering the next generation through mentorship, guidance, and support. Shape futures!",
    category: "Education",
    members: []
  },
  {
    name: "Green Energy Initiative",
    description: "Promoting renewable energy and sustainable practices. Let's power the future responsibly!",
    category: "Environment",
    members: []
  }
];

// Dummy discussions (threads) data
const dummyThreads = [
  {
    title: "Best Practices for Beach Cleanup",
    content: "I've been organizing beach cleanups for the past year and wanted to share some tips:\n\n1. Always bring gloves and reusable bags\n2. Coordinate with local authorities\n3. Sort waste properly for recycling\n4. Document your impact with photos\n\nWhat are your experiences? Share your tips below!",
    tags: ["environment", "cleanup", "tips"],
    group: null
  },
  {
    title: "How to Engage More Volunteers?",
    content: "Our NGO is struggling to attract and retain volunteers. We've tried social media campaigns and local events, but the turnout is still low. Any suggestions on effective volunteer engagement strategies?\n\nWhat has worked for your organization?",
    tags: ["volunteers", "engagement", "strategy"],
    group: null
  },
  {
    title: "Impact Story: Teaching Coding to Underprivileged Kids",
    content: "Last month, we completed a 4-week coding bootcamp for 50 kids from low-income families. The results were amazing:\n\n- 45 kids completed the course\n- 3 students got internships\n- Parents reported increased confidence\n\nThis is why we do what we do! 💪",
    tags: ["education", "coding", "impact"],
    group: null
  },
  {
    title: "Fundraising Ideas for Small NGOs",
    content: "We're a small NGO with limited resources. Looking for creative fundraising ideas that don't require a huge budget. What has worked for you?\n\nSome ideas we're considering:\n- Online crowdfunding\n- Community events\n- Corporate partnerships\n\nWould love to hear your thoughts!",
    tags: ["fundraising", "ngo", "resources"],
    group: null
  },
  {
    title: "Mental Health Support in Communities",
    content: "Mental health awareness is crucial, especially in underserved communities. We're planning a mental health awareness campaign and would appreciate any resources, tips, or collaboration opportunities.\n\nLet's break the stigma together!",
    tags: ["health", "mental-health", "awareness"],
    group: null
  },
  {
    title: "Sustainable Living Tips",
    content: "Share your best sustainable living tips! Here are mine:\n\n1. Reduce single-use plastics\n2. Compost organic waste\n3. Use public transport or bike\n4. Support local and sustainable brands\n5. Reduce energy consumption\n\nWhat are your favorite sustainable practices?",
    tags: ["sustainability", "environment", "lifestyle"],
    group: null
  },
  {
    title: "Technology Solutions for NGOs",
    content: "What technology tools have made the biggest impact on your NGO's operations? We're looking to digitize our processes and would love recommendations for:\n\n- Volunteer management systems\n- Donation platforms\n- Communication tools\n- Impact tracking software",
    tags: ["technology", "ngo", "tools"],
    group: null
  },
  {
    title: "Community Garden Success Story",
    content: "Our community garden project has been running for 6 months now! We've:\n\n- Grown over 200kg of vegetables\n- Engaged 30+ volunteers\n- Donated produce to local food banks\n- Created a beautiful green space\n\nAnyone interested in starting their own? Happy to share our experience!",
    tags: ["community", "gardening", "success"],
    group: null
  }
];

// Dummy stories data
const dummyStories = [
  {
    title: "Transforming Lives Through Education",
    content: "Over the past year, our education initiative has reached over 500 children in rural areas. We set up learning centers, provided books and supplies, and trained local volunteers as teachers. The impact has been incredible - children who couldn't read are now writing stories, and many have gained confidence to pursue higher education. One student, Priya, went from being unable to read to winning a district-level essay competition!",
    category: "Education",
    location: "Rural Maharashtra, India",
    impactMetrics: {
      peopleHelped: 500,
      hoursVolunteered: 2000,
      fundsRaised: 50000,
      itemsDonated: 1000
    },
    tags: ["education", "rural", "transformation"],
    isApproved: true,
    isFeatured: true
  },
  {
    title: "Beach Cleanup: 2 Tons of Waste Removed",
    content: "Last weekend, 200 volunteers came together to clean up Juhu Beach in Mumbai. In just 4 hours, we collected over 2 tons of plastic waste, glass, and other debris. The beach is now cleaner, and we've raised awareness about marine pollution. Many local businesses have pledged to reduce single-use plastics. This is just the beginning!",
    category: "Environment",
    location: "Mumbai, India",
    impactMetrics: {
      peopleHelped: 200,
      hoursVolunteered: 800,
      fundsRaised: 0,
      itemsDonated: 0
    },
    tags: ["environment", "cleanup", "beach"],
    isApproved: true,
    isFeatured: false
  },
  {
    title: "Tech Training for Senior Citizens",
    content: "We launched a program to teach senior citizens how to use smartphones and the internet. Over 100 seniors have completed the course, and they can now video call their families, use online banking, and access government services. The joy on their faces when they made their first video call was priceless!",
    category: "Technology",
    location: "Delhi, India",
    impactMetrics: {
      peopleHelped: 100,
      hoursVolunteered: 400,
      fundsRaised: 0,
      itemsDonated: 0
    },
    tags: ["technology", "seniors", "digital-literacy"],
    isApproved: true,
    isFeatured: false
  },
  {
    title: "Disaster Relief: Flood Response",
    content: "When floods hit Assam, our disaster relief team was on the ground within 24 hours. We distributed food, water, medical supplies, and temporary shelter to over 1000 affected families. Volunteers worked day and night to ensure everyone received help. The community's resilience and our volunteers' dedication were truly inspiring.",
    category: "Disaster Relief",
    location: "Assam, India",
    impactMetrics: {
      peopleHelped: 1000,
      hoursVolunteered: 3000,
      fundsRaised: 200000,
      itemsDonated: 5000
    },
    tags: ["disaster-relief", "flood", "emergency"],
    isApproved: true,
    isFeatured: true
  },
  {
    title: "Mental Health Awareness Campaign",
    content: "We organized a month-long mental health awareness campaign in schools and colleges. Through workshops, counseling sessions, and awareness drives, we reached over 2000 students. Many came forward to share their struggles and seek help. The campaign helped break the stigma around mental health in our community.",
    category: "Health",
    location: "Bangalore, India",
    impactMetrics: {
      peopleHelped: 2000,
      hoursVolunteered: 600,
      fundsRaised: 30000,
      itemsDonated: 0
    },
    tags: ["health", "mental-health", "awareness"],
    isApproved: true,
    isFeatured: false
  },
  {
    title: "Community Garden Project",
    content: "Our community garden has become a hub of activity! We've transformed a vacant lot into a thriving garden where community members grow vegetables together. The garden has not only provided fresh produce but also brought neighbors together, creating a stronger sense of community. Children learn about gardening, and we donate excess produce to local food banks.",
    category: "Community",
    location: "Pune, India",
    impactMetrics: {
      peopleHelped: 150,
      hoursVolunteered: 1200,
      fundsRaised: 15000,
      itemsDonated: 0
    },
    tags: ["community", "gardening", "sustainability"],
    isApproved: true,
    isFeatured: false
  },
  {
    title: "Blood Donation Drive Success",
    content: "Our quarterly blood donation drive collected 500 units of blood, helping save countless lives. Over 400 donors participated, and we partnered with local hospitals to ensure the blood reached those in need. The event also raised awareness about the importance of regular blood donation.",
    category: "Health",
    location: "Hyderabad, India",
    impactMetrics: {
      peopleHelped: 400,
      hoursVolunteered: 200,
      fundsRaised: 0,
      itemsDonated: 500
    },
    tags: ["health", "blood-donation", "lifesaving"],
    isApproved: true,
    isFeatured: false
  },
  {
    title: "Women Entrepreneurship Bootcamp",
    content: "We conducted a 3-month bootcamp for aspiring women entrepreneurs. 50 women completed the program, learning business planning, marketing, and financial management. 20 participants have already started their businesses, and many others are in the planning phase. Empowering women economically creates a ripple effect in communities!",
    category: "Community",
    location: "Chennai, India",
    impactMetrics: {
      peopleHelped: 50,
      hoursVolunteered: 900,
      fundsRaised: 75000,
      itemsDonated: 0
    },
    tags: ["community", "women", "entrepreneurship"],
    isApproved: true,
    isFeatured: true
  }
];

const insertDummyData = async () => {
  try {
    // Get or create dummy users for groups and content
    let volunteers = await Volunteer.find().limit(5);
    let ngos = await NGO.find().limit(3);
    
    // If no users exist, create some dummy users
    if (volunteers.length === 0 && ngos.length === 0) {
      console.log('⚠️ No users found. Creating dummy users...');
      const dummyVolunteers = [
        { name: "Aarav Sharma", email: "aarav@example.com", password: "dummy123", interests: "Environment, Education", availability: "Weekends" },
        { name: "Sanya Mehta", email: "sanya@example.com", password: "dummy123", interests: "Health, Community", availability: "Evenings" },
        { name: "Rohan Gupta", email: "rohan@example.com", password: "dummy123", interests: "Technology", availability: "Flexible" }
      ];
      volunteers = await Volunteer.insertMany(dummyVolunteers);
      
      const dummyNGOs = [
        { name: "Green Earth Foundation", email: "greenearth@example.com", password: "dummy123", missionStatement: "Environmental conservation", areasOfOperation: "Mumbai, Delhi" },
        { name: "Education First", email: "edufirst@example.com", password: "dummy123", missionStatement: "Promoting education", areasOfOperation: "Bangalore, Pune" }
      ];
      ngos = await NGO.insertMany(dummyNGOs);
    }
    
    const allUsers = [...volunteers, ...ngos];
    if (allUsers.length === 0) {
      console.log('❌ No users available. Please create users first.');
      mongoose.connection.close();
      return;
    }
    
    // Insert dummy groups
    console.log('📦 Adding dummy groups...');
    const createdGroups = [];
    for (const groupData of dummyGroups) {
      // Check if group already exists
      const existingGroup = await Group.findOne({ name: groupData.name });
      if (existingGroup) {
        console.log(`⏭️  Group "${groupData.name}" already exists, skipping...`);
        createdGroups.push(existingGroup);
        continue;
      }
      
      // Assign random creator and add some members
      const creator = allUsers[Math.floor(Math.random() * allUsers.length)];
      const memberCount = Math.floor(Math.random() * 5) + 3; // 3-7 members
      const members = [{ user: creator._id, userType: creator.email.includes('@example.com') && creator.name ? 'Volunteer' : 'NGO' }];
      
      // Add more random members
      for (let i = 0; i < memberCount - 1; i++) {
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        if (!members.some(m => m.user.toString() === randomUser._id.toString())) {
          members.push({
            user: randomUser._id,
            userType: randomUser.email && randomUser.email.includes('@example.com') && randomUser.name ? 'Volunteer' : 'NGO'
          });
        }
      }
      
      const newGroup = new Group({
        ...groupData,
        creator: creator._id,
        members
      });
      
      const savedGroup = await newGroup.save();
      createdGroups.push(savedGroup);
      console.log(`✅ Created group: ${groupData.name}`);
      
      // Create chat room for this group
      const room = `group-${savedGroup._id}`;
      const existingChat = await Chat.findOne({ room });
      if (!existingChat) {
        const groupChat = new Chat({
          room,
          messages: [],
          participants: []
        });
        await groupChat.save();
        console.log(`💬 Created chat room for group: ${groupData.name}`);
      }
    }
    
    // Insert dummy threads/discussions
    console.log('\n📝 Adding dummy discussions...');
    for (const threadData of dummyThreads) {
      // Check if thread already exists
      const existingThread = await Thread.findOne({ title: threadData.title });
      if (existingThread) {
        console.log(`⏭️  Thread "${threadData.title}" already exists, skipping...`);
        continue;
      }
      
      const author = allUsers[Math.floor(Math.random() * allUsers.length)];
      const authorType = author.email && author.email.includes('@example.com') && author.name ? 'Volunteer' : 'NGO';
      
      // Randomly assign some threads to groups
      let assignedGroup = null;
      if (Math.random() > 0.4 && createdGroups.length > 0) {
        assignedGroup = createdGroups[Math.floor(Math.random() * createdGroups.length)]._id;
      }
      
      const newThread = new Thread({
        ...threadData,
        author: {
          user: author._id,
          userType: authorType,
          name: author.name
        },
        group: assignedGroup,
        replies: [] // Start with no replies, users can add them
      });
      
      await newThread.save();
      console.log(`✅ Created discussion: ${threadData.title}`);
    }
    
    // Insert dummy stories
    console.log('\n📖 Adding dummy stories...');
    for (const storyData of dummyStories) {
      // Check if story already exists
      const existingStory = await ImpactStory.findOne({ title: storyData.title });
      if (existingStory) {
        console.log(`⏭️  Story "${storyData.title}" already exists, skipping...`);
        continue;
      }
      
      const author = allUsers[Math.floor(Math.random() * allUsers.length)];
      const authorType = author.email && author.email.includes('@example.com') && author.name ? 'Volunteer' : 'NGO';
      
      const newStory = new ImpactStory({
        ...storyData,
        author: {
          user: author._id,
          userType: authorType,
          name: author.name
        },
        likes: [] // Start with no likes
      });
      
      await newStory.save();
      console.log(`✅ Created story: ${storyData.title}`);
    }
    
    console.log('\n🎉 Dummy data added successfully!');
    console.log(`✅ Created ${createdGroups.length} groups`);
    console.log(`✅ Created ${dummyThreads.length} discussions`);
    console.log(`✅ Created ${dummyStories.length} stories`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error adding dummy data:', error);
    mongoose.connection.close();
  }
};

insertDummyData();

