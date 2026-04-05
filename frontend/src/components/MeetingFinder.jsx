import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaClock, FaCalendarDay, FaSearch, FaGlobeAmericas, FaPhone, FaExternalLinkAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';
const US_CALIFORNIA_FEED_URL = 'https://sheets.code4recovery.org/storage/12Ga8uwMG4WJ8pZ_SEU7vNETp_aQZ-2yNVsYDFqIwHyE.json';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TYPE_LABELS = {
  O: 'Open', C: 'Closed', W: 'Women', M: 'Men', BE: 'Newcomer', LGBTQ: 'LGBTQ+', B: 'Big Book',
  D: 'Discussion', X: 'Wheelchair Access', DR: 'Daily Reflections', MED: 'Meditation', ST: 'Step Study',
  H: 'Hybrid', SP: 'Speaker', S: 'Spanish', XB: 'Wheelchair Bathroom'
};

const DAY_OPTIONS = [
  { value: 'all', label: 'Any day' },
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' }
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'O', label: 'Open' },
  { value: 'C', label: 'Closed' },
  { value: 'W', label: 'Women' },
  { value: 'M', label: 'Men' },
  { value: 'BE', label: 'Newcomer' },
  { value: 'LGBTQ', label: 'LGBTQ+' }
];

const MeetingFinder = ({ theme, darkMode }) => {
  const [region, setRegion] = useState('india');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch meetings
  useEffect(() => {
    const filterAndFormat = (rawMeetings, dayF, typeF, searchQ) => {
      let list = [...(rawMeetings || [])];
      if (dayF !== 'all') {
        const dayNum = parseInt(dayF, 10);
        if (!isNaN(dayNum)) list = list.filter(m => (Array.isArray(m.day) ? m.day : [m.day]).includes(dayNum));
      }
      if (typeF !== 'all') list = list.filter(m => (m.types || []).includes(typeF));
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase().trim();
        list = list.filter(m => {
          const name = (m.name || '').toLowerCase();
          const city = (m.city || '').toLowerCase();
          const address = (m.formatted_address || m.location || '').toLowerCase();
          const regions = (m.regions || []).join(' ').toLowerCase();
          return name.includes(q) || city.includes(q) || address.includes(q) || regions.includes(q);
        });
      }
      return list.slice(0, 50).map(m => ({
        ...m,
        day_name: Array.isArray(m.day) ? m.day.map(d => DAY_NAMES[d]).join(', ') : DAY_NAMES[m.day],
        type_labels: (m.types || []).map(t => TYPE_LABELS[t] || t)
      }));
    };

    const fetchMeetings = async () => {
      setLoading(true);
      setError(null);
      try {
        if (region === 'india') {
          try {
            const params = new URLSearchParams();
            params.set('region', region);
            if (dayFilter !== 'all') params.set('day', dayFilter);
            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (searchDebounce.trim()) params.set('search', searchDebounce.trim());
            if (useLocation && userLocation) {
              params.set('lat', userLocation.latitude);
              params.set('lng', userLocation.longitude);
            }
            params.set('limit', '50');
            const res = await axios.get(`${API_BASE_URL}/api/meetings?${params}`);
            setMeetings(res.data.meetings || []);
            return;
          } catch (apiErr) {
            // Fallback to local India data on any API failure (404, 500, network, etc.)
            const fallbackRes = await fetch('/data/india-meetings.json');
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              setMeetings(filterAndFormat(data, dayFilter, typeFilter, searchDebounce));
              return;
            }
            throw apiErr;
          }
        }

        // US California - try API first, then fallback to direct feed
        try {
          const params = new URLSearchParams();
          params.set('region', region);
          if (dayFilter !== 'all') params.set('day', dayFilter);
          if (typeFilter !== 'all') params.set('type', typeFilter);
          if (searchDebounce.trim()) params.set('search', searchDebounce.trim());
          if (useLocation && userLocation) {
            params.set('lat', userLocation.latitude);
            params.set('lng', userLocation.longitude);
          }
          params.set('limit', '50');
          const res = await axios.get(`${API_BASE_URL}/api/meetings?${params}`);
          setMeetings(res.data.meetings || []);
          return;
        } catch (apiErr) {
          // Fallback 1: fetch directly from Code for Recovery feed (may fail due to CORS)
          try {
            const fallbackRes = await fetch(US_CALIFORNIA_FEED_URL);
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              const list = Array.isArray(data) ? data : [];
              setMeetings(filterAndFormat(list, dayFilter, typeFilter, searchDebounce));
              return;
            }
          } catch (_) {}
          // Fallback 2: use local cached US California data
          const localRes = await fetch('/data/us-california-meetings.json');
          if (localRes.ok) {
            const data = await localRes.json();
            const list = Array.isArray(data) ? data : [];
            setMeetings(filterAndFormat(list, dayFilter, typeFilter, searchDebounce));
            return;
          }
          throw apiErr;
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load meetings');
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [region, dayFilter, typeFilter, searchDebounce, useLocation, userLocation]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setUseLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setError('Could not get your location. Using search instead.')
    );
  };

  const getDirectionsUrl = (meeting) => {
    const addr = meeting.formatted_address || [meeting.address, meeting.city, meeting.state].filter(Boolean).join(', ');
    if (!addr) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className={`text-xl font-semibold ${theme.text}`}>Find Support Meetings</h2>
        <p className={`text-sm ${theme.textSecondary} mt-1`}>
          Search for AA/NA meetings near you. Select your region and filter by day or type.
        </p>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl ${theme.card} border ${theme.border} space-y-4`}>
        {/* Region selector */}
        <div>
          <label className={`block text-sm font-medium ${theme.text} mb-2`}>Region</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRegion('india')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                region === 'india' ? theme.button : theme.buttonSecondary
              }`}
            >
              🇮🇳 India
            </button>
            <button
              onClick={() => setRegion('us-california')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                region === 'us-california' ? theme.button : theme.buttonSecondary
              }`}
            >
              🇺🇸 US - California
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
          <input
            type="text"
            placeholder="Search by city, group name, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-zinc-500`}
          />
        </div>

        {/* Day & Type filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-1`}>Day</label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-zinc-500`}
            >
              {DAY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-1`}>Meeting type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-zinc-500`}
            >
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Use my location */}
        <button
          onClick={handleUseLocation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${theme.buttonSecondary}`}
        >
          <FaMapMarkerAlt />
          {useLocation && userLocation ? 'Using your location' : 'Use my location'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={`p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm`}>
          {error}
        </div>
      )}

      {/* Results */}
      <div>
        <div className={`flex items-center justify-between mb-3`}>
          <span className={`text-sm ${theme.textSecondary}`}>
            {loading ? 'Loading...' : `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {loading ? (
          <div className={`flex items-center justify-center py-16 ${theme.textSecondary}`}>
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading meetings...</span>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className={`py-16 text-center ${theme.textSecondary}`}>
            <FaGlobeAmericas className="mx-auto text-4xl mb-3 opacity-50" />
            <p>No meetings found. Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
            {meetings.map((meeting) => (
              <div
                key={meeting.slug}
                className={`p-4 rounded-xl ${theme.card} border ${theme.border} hover:border-zinc-400/50 transition-colors`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold ${theme.text}`}>{meeting.name}</h3>
                    {meeting.distance_km != null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-zinc-200'} ${theme.text}`}>
                        {meeting.distance_km} km
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                    <FaCalendarDay className="flex-shrink-0" />
                    <span>{meeting.day_name}</span>
                    <span>•</span>
                    <FaClock className="flex-shrink-0" />
                    <span>{meeting.time}</span>
                  </div>

                  {meeting.type_labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {meeting.type_labels.map((t, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-zinc-700/80' : 'bg-zinc-100'} ${theme.text}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {(meeting.location || meeting.formatted_address) && (
                    <div className={`flex items-start gap-2 text-sm ${theme.textSecondary}`}>
                      <FaMapMarkerAlt className="flex-shrink-0 mt-0.5" />
                      <span>{meeting.formatted_address || meeting.location}</span>
                    </div>
                  )}

                  {meeting.contact && (
                    <div className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                      <FaPhone className="flex-shrink-0" />
                      <a href={`tel:${meeting.contact.replace(/\s/g, '')}`} className="text-blue-500 hover:underline">
                        {meeting.contact}
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {getDirectionsUrl(meeting) && (
                      <a
                        href={getDirectionsUrl(meeting)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${theme.buttonSecondary}`}
                      >
                        <FaMapMarkerAlt />
                        Directions
                      </a>
                    )}
                    {meeting.conference_url && (
                      <a
                        href={meeting.conference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700`}
                      >
                        <FaExternalLinkAlt />
                        Join online
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingFinder;
