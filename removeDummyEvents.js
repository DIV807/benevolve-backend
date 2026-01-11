const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';

/**
 * Safely remove dummy events from database
 * This script identifies dummy events by:
 * - source = 'Manual' (or missing source)
 * - externalId = null (no URL from live sources)
 */
async function removeDummyEvents(dryRun = true) {
  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
      console.log('✅ Connected to MongoDB\n');
    }

    // Get total count
    const totalEvents = await Event.countDocuments();
    console.log(`📊 Total events in database: ${totalEvents}\n`);

    // Identify dummy events
    // Dummy events typically have:
    // 1. source = 'Manual' (or missing source)
    // 2. externalId = null (no URL)
    const dummyEventsQuery = {
      $or: [
        { source: 'Manual' },
        { source: { $exists: false } },
        { externalId: null }
      ]
    };

    const dummyEvents = await Event.find(dummyEventsQuery);
    const dummyCount = dummyEvents.length;
    const liveCount = totalEvents - dummyCount;

    console.log('🔍 Analysis:');
    console.log(`   📝 Dummy events found: ${dummyCount}`);
    console.log(`   ✅ Live events (will be kept): ${liveCount}\n`);

    if (dummyCount === 0) {
      console.log('✨ No dummy events found! All events appear to be live data.');
      mongoose.connection.close();
      return;
    }

    // Show sample of dummy events
    console.log('📋 Sample of dummy events to be removed:');
    dummyEvents.slice(0, 10).forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.name} (${event.location}) - Source: ${event.source || 'None'}`);
    });
    if (dummyCount > 10) {
      console.log(`   ... and ${dummyCount - 10} more\n`);
    } else {
      console.log('');
    }

    // Show sample of live events (will be kept)
    const liveEvents = await Event.find({
      $and: [
        { source: { $ne: 'Manual' } },
        { source: { $exists: true } },
        { externalId: { $ne: null } }
      ]
    }).limit(5);

    if (liveEvents.length > 0) {
      console.log('✅ Sample of live events (will be kept):');
      liveEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.name} (${event.location}) - Source: ${event.source}`);
      });
      console.log('');
    }

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No events were deleted');
      console.log('💡 To actually delete dummy events, run:');
      console.log('   node removeDummyEvents.js --confirm\n');
    } else {
      // Actually delete
      const result = await Event.deleteMany(dummyEventsQuery);
      
      console.log('🗑️  Deletion Summary:');
      console.log(`   ✅ Deleted: ${result.deletedCount} dummy events`);
      console.log(`   ✅ Kept: ${liveCount} live events`);
      console.log(`   📊 Remaining in database: ${await Event.countDocuments()}\n`);
      console.log('✨ Dummy data removal completed successfully!');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error removing dummy events:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Check if --confirm flag is passed
const confirmDelete = process.argv.includes('--confirm');

if (confirmDelete) {
  console.log('⚠️  WARNING: This will permanently delete dummy events from your database!');
  console.log('⚠️  Make sure you have a backup if needed.\n');
  removeDummyEvents(false);
} else {
  console.log('🔍 Running in DRY RUN mode (preview only)\n');
  removeDummyEvents(true);
}






