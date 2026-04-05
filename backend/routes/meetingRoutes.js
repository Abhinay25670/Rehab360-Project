const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// US California feed (Code for Recovery Meeting Guide format)
const US_FEED_URL = 'https://sheets.code4recovery.org/storage/12Ga8uwMG4WJ8pZ_SEU7vNETp_aQZ-2yNVsYDFqIwHyE.json';

// Day name mapping (0=Sun, 1=Mon, ..., 6=Sat)
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Meeting type codes to human-readable
const TYPE_LABELS = {
  O: 'Open', C: 'Closed', W: 'Women', M: 'Men', BE: 'Newcomer',
  LGBTQ: 'LGBTQ+', X: 'Wheelchair Access', B: 'Big Book', D: 'Discussion',
  MED: 'Meditation', ST: 'Step Study', DR: 'Daily Reflections', S: 'Spanish'
};

// Haversine formula for distance in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Parse coordinates from meeting (can be "lat,lon" or "lat1,lon1,lat2,lon2" for online)
function parseCoordinates(meeting) {
  const coords = meeting.coordinates || meeting.formatted_address;
  if (!coords) return null;
  if (typeof coords === 'string') {
    const parts = coords.split(',').map(Number).filter(n => !isNaN(n));
    if (parts.length >= 2) return { lat: parts[0], lon: parts[1] };
  }
  return null;
}

// GET /api/meetings - Fetch meetings with optional filters
router.get('/', async (req, res) => {
  try {
    const { region = 'india', day, type, search, lat, lng, limit = 50 } = req.query;

    let meetings = [];

    if (region === 'us-california' || region === 'us') {
      // Fetch from US Code for Recovery feed
      const response = await fetch(US_FEED_URL);
      if (!response.ok) throw new Error('Failed to fetch US meetings');
      meetings = await response.json();
    } else {
      // Load India meetings from local JSON
      const indiaPath = path.join(__dirname, '../data/india-meetings.json');
      const data = fs.readFileSync(indiaPath, 'utf8');
      meetings = JSON.parse(data);
    }

    // Filter by day (0-6, Sunday-Saturday)
    if (day !== undefined && day !== '' && day !== 'all') {
      const dayNum = parseInt(day, 10);
      if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
        meetings = meetings.filter(m => {
          const meetingDay = Array.isArray(m.day) ? m.day : [m.day];
          return meetingDay.includes(dayNum);
        });
      }
    }

    // Filter by type (O, C, W, M, etc.)
    if (type && type !== 'all') {
      meetings = meetings.filter(m => (m.types || []).includes(type));
    }

    // Search by name, location, city, address
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      meetings = meetings.filter(m => {
        const name = (m.name || '').toLowerCase();
        const location = (m.location || '').toLowerCase();
        const city = (m.city || '').toLowerCase();
        const address = (m.formatted_address || m.address || '').toLowerCase();
        const regions = (m.regions || []).join(' ').toLowerCase();
        return name.includes(q) || location.includes(q) || city.includes(q) || address.includes(q) || regions.includes(q);
      });
    }

    // Add distance if lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lng);
      if (!isNaN(userLat) && !isNaN(userLon)) {
        meetings = meetings.map(m => {
          const coords = parseCoordinates(m);
          const distance = coords ? getDistanceKm(userLat, userLon, coords.lat, coords.lon) : null;
          return { ...m, distance_km: distance !== null ? Math.round(distance * 10) / 10 : null };
        });
        // Sort by distance (nulls last)
        meetings.sort((a, b) => {
          if (a.distance_km === null) return 1;
          if (b.distance_km === null) return -1;
          return a.distance_km - b.distance_km;
        });
      }
    }

    // Limit results
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    meetings = meetings.slice(0, limitNum);

    // Add human-readable fields
    meetings = meetings.map(m => ({
      ...m,
      day_name: Array.isArray(m.day) ? m.day.map(d => DAY_NAMES[d]).join(', ') : DAY_NAMES[m.day],
      type_labels: (m.types || []).map(t => TYPE_LABELS[t] || t),
      is_online: !!(m.conference_url || m.conference_phone)
    }));

    res.json({ meetings, region, count: meetings.length });
  } catch (error) {
    console.error('Meeting fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings', details: error.message });
  }
});

// GET /api/meetings/regions - List available regions
router.get('/regions', (req, res) => {
  res.json({
    regions: [
      { id: 'india', label: 'India', country: 'IN', icon: '🇮🇳' },
      { id: 'us-california', label: 'US - California', country: 'US', icon: '🇺🇸' }
    ]
  });
});

module.exports = router;
