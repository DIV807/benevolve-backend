# Live Indian Volunteering Events Integration

This backend now supports fetching and syncing live **Indian volunteering events** using **Google Custom Search API** instead of using dummy data.

## Features

- ✅ Fetches events from Indian sources only using Google Custom Search API
- ✅ Searches across major Indian volunteering platforms (Volunteers.org, Goodera, Impaac, OpenContribute)
- ✅ Automatic daily sync at 2:00 AM
- ✅ Manual sync endpoint
- ✅ Duplicate detection
- ✅ Future events filtering
- ✅ Automatic skill extraction from descriptions
- ✅ Searches across 15 major Indian cities (Mumbai, Delhi, Bangalore, etc.)
- ✅ Rate limit handling and batch processing

## Setup

### 1. API Keys Configuration

Add the following environment variables to your `.env` file:

```env
# Google Custom Search API (Required)
GOOGLE_CSE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here

# MongoDB Connection (if not already set)
MONGO_URI=your_mongodb_connection_string
```

### 2. Getting Google Custom Search API Keys

**This is the only API you need to set up:**

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable "Custom Search API"
4. Go to "Credentials" and create an API key
5. Go to https://programmablesearchengine.google.com/controlpanel/create
6. Create a Custom Search Engine
7. Add these sites to search:
   - `volunteers.org`
   - `goodera.com`
   - `impaac.org`
   - `opencontribute.com`
8. Copy your Search Engine ID (CX)
9. Add both to your `.env` file:
   - `GOOGLE_CSE_API_KEY=your_api_key`
   - `GOOGLE_CSE_ID=your_search_engine_id`

**Note:** The free tier of Google Custom Search API allows 100 queries per day. For production use, you may need to upgrade to a paid plan.

## Usage

### Manual Sync

You can manually trigger event sync in two ways:

#### Option 1: Using the API Endpoint
```bash
POST http://localhost:5000/api/events/sync
```

#### Option 2: Running the Script Directly
```bash
node syncLiveEvents.js
```

### Automatic Sync

The server automatically syncs events daily at 2:00 AM. This is configured in `server.js` using node-cron.

To change the schedule, modify the cron expression in `server.js`:
```javascript
// Current: Daily at 2 AM
cron.schedule('0 2 * * *', ...)

// Examples:
// Every 6 hours: '0 */6 * * *'
// Every day at midnight: '0 0 * * *'
// Every Monday at 9 AM: '0 9 * * 1'
```

## Event Sources

The system uses **Google Custom Search API only** to fetch events from Indian volunteering platforms:

- **Volunteers.org** - India's largest volunteering platform (450,000+ hours since 2011)
- **Goodera** - Corporate volunteering with 500+ vetted nonprofits
- **Impaac Foundation** - Non-profit charity platform connecting volunteers with NGOs
- **OpenContribute** - Platform connecting volunteers with causes across India

The system searches these platforms across 15 major Indian cities to find volunteering opportunities.

## Event Data Structure

Each event includes:
- `name`: Event title
- `date`: Event date (only future events are stored)
- `location`: Event location
- `description`: Event description
- `skills`: Automatically extracted skills from description
- `source`: Source of the event (Eventbrite, Idealist, etc.)
- `externalId`: Original ID from the source API

## Skill Extraction

The system automatically extracts relevant skills from event descriptions using keyword matching:
- Teaching, Community, Environmental, Healthcare
- Technology, Communication, Teamwork, Leadership
- Counseling, First Aid, Fundraising, Event Management
- And more...

## Troubleshooting

### No events are being fetched

1. **Check API keys**: Make sure `EVENTBRITE_TOKEN` is set in `.env`
2. **Check API limits**: Some APIs have rate limits
3. **Check logs**: Look for error messages in the console
4. **Test manually**: Run `node syncLiveEvents.js` to see detailed logs

### Duplicate events

The system automatically detects and skips duplicate events based on:
- Event name
- Event date

### Events not showing up

- Make sure events are in the future (past events are filtered out)
- Check MongoDB connection
- Verify the sync completed successfully

## Migration from Dummy Data

To replace dummy data with live events:

1. **Option 1: Keep both** (Recommended)
   - Live events will be added alongside existing events
   - Duplicates are automatically skipped

2. **Option 2: Clear and replace**
   ```javascript
   // In MongoDB or using a script
   await Event.deleteMany({ source: 'Manual' });
   ```

## API Endpoints

### Get All Events
```
GET /api/events
```

### Sync Events (Manual)
```
POST /api/events/sync
```

### Search Events
```
GET /api/events/search?q=volunteer
```

## Notes

- **Events are fetched from India only** - focuses on Indian volunteering opportunities
- **Uses Google Custom Search API only** - no other APIs required
- Searches across 15 major Indian cities: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Surat, Lucknow, Kanpur, Nagpur, Indore, Thane
- Only future events are stored in the database
- The sync process may take a few minutes depending on API response times
- **Rate Limits:** Google Custom Search API free tier allows 100 queries per day. The system processes cities in batches with delays to respect rate limits
- If you hit rate limits, the sync will continue with available results

## Rate Limit Management

The system automatically:
- Processes cities in batches of 3
- Adds 1-second delays between batches
- Handles rate limit errors gracefully
- Continues processing even if some cities fail

If you need more than 100 queries per day, consider:
- Upgrading to Google Custom Search API paid plan
- Reducing the number of cities searched
- Running syncs less frequently

