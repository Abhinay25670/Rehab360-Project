import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config/api';

const LifestyleRecommendationEditor = ({ patient, doctor }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for new recommendation
  const [newRecommendation, setNewRecommendation] = useState({
    category: 'diet',
    description: '',
    priority: 'medium',
    targetDate: ''
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/lifestyle/patient/${patient._id}`, {
          headers: { Authorization: `${localStorage.getItem('token')}` }
        });
        if (res.data) {
          setRecommendations(res.data.recommendations || []);
          setNotes(res.data.notes || '');
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error('Failed to fetch recommendations');
        }
      }
      setLoading(false);
    };

    fetchRecommendations();
  }, [patient._id]);

  const handleAddRecommendation = () => {
    if (!newRecommendation.description.trim()) {
      toast.error('Please enter a recommendation description');
      return;
    }

    const recommendation = {
      ...newRecommendation,
      targetDate: newRecommendation.targetDate || undefined
    };

    setRecommendations([...recommendations, recommendation]);
    setNewRecommendation({
      category: 'diet',
      description: '',
      priority: 'medium',
      targetDate: ''
    });
  };

  const handleRemoveRecommendation = (index) => {
    const updated = [...recommendations];
    updated.splice(index, 1);
    setRecommendations(updated);
  };

  const handleSaveRecommendations = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/lifestyle`, {
        patient: patient._id,
        recommendations,
        notes
      }, {
        headers: { Authorization: `${localStorage.getItem('token')}` }
      });
      toast.success('Recommendations saved successfully');
    } catch (err) {
      toast.error('Failed to save recommendations');
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Current Recommendations</h3>
        
        {recommendations.length === 0 ? (
          <p className="text-gray-500">No recommendations yet. Add some below.</p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {rec.category}
                      </span>
                      <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                      {rec.targetDate && (
                        <span className="text-xs text-gray-500">
                          Target: {new Date(rec.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="mt-1">{rec.description}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveRecommendation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Add New Recommendation</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newRecommendation.category}
              onChange={(e) => setNewRecommendation({...newRecommendation, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="diet">Diet</option>
              <option value="exercise">Exercise</option>
              <option value="sleep">Sleep</option>
              <option value="stress">Stress Management</option>
              <option value="habits">Habits</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={newRecommendation.priority}
              onChange={(e) => setNewRecommendation({...newRecommendation, priority: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (optional)</label>
            <input
              type="date"
              value={newRecommendation.targetDate}
              onChange={(e) => setNewRecommendation({...newRecommendation, targetDate: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
          <textarea
            value={newRecommendation.description}
            onChange={(e) => setNewRecommendation({...newRecommendation, description: e.target.value})}
            rows={2}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., Reduce sugar intake to less than 25g per day"
          />
        </div>
        <button
          onClick={handleAddRecommendation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Recommendation
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes for the patient..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveRecommendations}
          disabled={saving}
          className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${
            saving ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Saving...' : 'Save Recommendations'}
        </button>
      </div>
    </div>
  );
};

export default LifestyleRecommendationEditor;