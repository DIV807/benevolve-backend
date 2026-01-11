const axios = require('axios');

/**
 * Service to fetch live Indian volunteering events using Google Custom Search API
 */

class EventFetcher {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_CSE_API_KEY;
    this.googleCseId = process.env.GOOGLE_CSE_ID;
    
    if (!this.googleApiKey || !this.googleCseId) {
      console.warn('⚠️ Google Custom Search API keys not found in environment variables');
    }
  }

  /**
   * Extract skills from event description using keywords
   */
  extractSkills(description) {
    const skillKeywords = {
      'Teaching': ['teach', 'education', 'tutor', 'learning', 'school'],
      'Community': ['community', 'outreach', 'public', 'social'],
      'Environmental': ['environment', 'cleanup', 'recycling', 'sustainability', 'green', 'climate'],
      'Healthcare': ['health', 'medical', 'hospital', 'care', 'wellness'],
      'Technology': ['tech', 'coding', 'programming', 'software', 'AI', 'data', 'digital'],
      'Communication': ['communication', 'public speaking', 'marketing', 'social media'],
      'Teamwork': ['team', 'collaboration', 'group', 'together'],
      'Leadership': ['lead', 'organize', 'manage', 'coordinate'],
      'Counseling': ['counsel', 'support', 'mental health', 'therapy'],
      'First Aid': ['first aid', 'emergency', 'safety', 'CPR'],
      'Fundraising': ['fundraise', 'donation', 'charity', 'raise money'],
      'Event Management': ['event', 'organize', 'coordinate', 'planning']
    };

    const desc = description.toLowerCase();
    const skills = [];

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        skills.push(skill);
      }
    }

    return skills.length > 0 ? skills : ['Volunteering', 'Community'];
  }

  /**
   * Fetch events using Google Custom Search API for Indian volunteering sites
   * Searches across multiple Indian volunteering platforms
   */
  async fetchFromGoogleCustomSearch(query = 'volunteer opportunities', city = 'Mumbai', startIndex = 1) {
    try {
      if (!this.googleApiKey || !this.googleCseId) {
        console.log('⚠️ Google Custom Search API not configured. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env');
        return { events: [], nextIndex: null };
      }

      // Search for Indian volunteering opportunities across multiple platforms
      const searchQuery = `${query} ${city} India site:volunteers.org OR site:goodera.com OR site:impaac.org OR site:opencontribute.com`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.googleCseId,
          q: searchQuery,
          num: 10, // Google CSE limit is 10 per request
          start: startIndex
        },
        timeout: 10000
      });

      const items = response.data.items || [];
      const events = items.map((item, index) => {
        // Try to extract date from snippet or title, otherwise use future date
        let eventDate = this.extractDateFromText(item.snippet || item.title || '');
        if (!eventDate) {
          // Distribute events over next 60 days
          eventDate = new Date();
          eventDate.setDate(eventDate.getDate() + (index % 60) + 1);
        }

        return {
          name: item.title || 'Volunteering Opportunity',
          date: eventDate,
          location: city,
          description: item.snippet || item.title || 'Volunteering opportunity in India',
          skills: this.extractSkills(item.snippet || item.title),
          source: 'Google Search',
          externalId: item.link,
          url: item.link
        };
      });

      // Check if there are more results
      const totalResults = parseInt(response.data.searchInformation?.totalResults || '0');
      const nextIndex = startIndex + 10 < totalResults ? startIndex + 10 : null;

      return { events, nextIndex };
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('❌ Google API rate limit exceeded. Please wait before trying again.');
      } else {
        console.error('❌ Error fetching from Google Custom Search:', error.message);
      }
      return { events: [], nextIndex: null };
    }
  }

  /**
   * Extract date from text (basic implementation)
   */
  extractDateFromText(text) {
    if (!text) return null;
    
    // Look for common date patterns
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,    // MM-DD-YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/,    // YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const date = new Date(match[0]);
          if (date && !isNaN(date.getTime()) && date > new Date()) {
            return date;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    return null;
  }

  /**
   * Fetch all events from Indian sources using Google Custom Search API only
   */
  async fetchAllEvents(locations = ['India'], query = 'volunteer') {
    if (!this.googleApiKey || !this.googleCseId) {
      console.error('❌ Google Custom Search API keys are required. Please set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in .env');
      return [];
    }

    const allEvents = [];

    // Major Indian cities to search
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
      'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
      'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane'
    ];

    console.log(`🔍 Searching for volunteering events in ${indianCities.length} Indian cities...`);

    // Fetch from Google Custom Search for each city
    // Process cities in batches to avoid rate limits
    for (let i = 0; i < indianCities.length; i += 3) {
      const cityBatch = indianCities.slice(i, i + 3);
      
      const fetchPromises = cityBatch.map(city => 
        this.fetchFromGoogleCustomSearch(query, city, 1)
      );

      const results = await Promise.allSettled(fetchPromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allEvents.push(...result.value.events);
          console.log(`   ✅ ${cityBatch[index]}: ${result.value.events.length} events`);
        }
      });

      // Small delay between batches to respect rate limits
      if (i + 3 < indianCities.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Remove duplicates based on URL (externalId) and name
    const uniqueEvents = this.removeDuplicates(allEvents);

    console.log(`✅ Total unique Indian events fetched: ${uniqueEvents.length}`);
    return uniqueEvents;
  }

  /**
   * Remove duplicate events based on URL (externalId) and name similarity
   */
  removeDuplicates(events) {
    const seen = new Set();
    const unique = [];

    for (const event of events) {
      // Use URL as primary key, fallback to name+date
      const key = event.externalId || 
                  `${event.name.toLowerCase().substring(0, 50)}_${event.date.toISOString().split('T')[0]}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(event);
      }
    }

    return unique;
  }

  /**
   * Filter events to only include future events
   */
  filterFutureEvents(events) {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now;
    });
  }
}

module.exports = EventFetcher;

