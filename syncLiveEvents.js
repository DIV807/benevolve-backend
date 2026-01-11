const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const EventFetcher = require('./services/eventFetcher');

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://benevolve8:siyakeram@cluster0.ht3br.mongodb.net/benevolvedb?retryWrites=true&w=majority&appName=Cluster0';

/**
 * Sync live volunteering events from multiple sources to database
 */
async function syncLiveEvents() {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI && mongoURI.includes('benevolve8:siyakeram')) {
      console.warn('⚠️ Using default MongoDB URI. For production, set MONGO_URI in .env file with correct credentials.');
    }

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('✅ Using existing MongoDB connection');
    }

    const fetcher = new EventFetcher();
    
    // Fetch events from India only
    const locations = ['India'];
    console.log('🔄 Fetching live Indian volunteering events...');
    
    const liveEvents = await fetcher.fetchAllEvents(locations, 'volunteer');
    
    // Filter to only future events
    const futureEvents = fetcher.filterFutureEvents(liveEvents);
    
    console.log(`📊 Found ${futureEvents.length} future events to sync`);

    if (futureEvents.length === 0) {
      console.log('⚠️ No events found. Make sure Google Custom Search API keys (GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID) are configured in .env file');
      if (mongoose.connection.readyState !== 0 && require.main === module) {
        mongoose.connection.close();
      }
      return;
    }

    let added = 0;
    let skipped = 0;

    // Insert events into database (skip duplicates)
    for (const eventData of futureEvents) {
      try {
        // Check if event already exists (by name and date)
        const existingEvent = await Event.findOne({
          name: eventData.name,
          date: eventData.date
        });

        if (existingEvent) {
          skipped++;
          continue;
        }

        // Create new event
        const event = new Event({
          name: eventData.name,
          date: eventData.date,
          location: eventData.location,
          skills: eventData.skills,
          description: eventData.description,
          source: eventData.source || 'Manual',
          externalId: eventData.externalId || null
        });

        await event.save();
        added++;
        console.log(`✅ Added: ${eventData.name} (${eventData.location})`);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error
          skipped++;
        } else {
          console.error(`❌ Error saving event "${eventData.name}":`, error.message);
        }
      }
    }

    console.log('\n📈 Sync Summary:');
    console.log(`   ✅ Added: ${added} events`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped} events`);
    console.log(`   📊 Total in database: ${await Event.countDocuments()}`);

    // Only close connection if we opened it
    if (mongoose.connection.readyState !== 0 && require.main === module) {
      mongoose.connection.close();
    }
    console.log('✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Error syncing events:', error);
    // Only close connection if we opened it
    if (mongoose.connection.readyState !== 0 && require.main === module) {
      mongoose.connection.close();
    }
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncLiveEvents();
}

module.exports = syncLiveEvents;

