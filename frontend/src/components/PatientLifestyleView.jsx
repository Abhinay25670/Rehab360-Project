import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config/api';

const PatientLifestyleView = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/lifestyle/patient`, {
          headers: { Authorization: `${localStorage.getItem('token')}` }
        });
        setRecommendations(res.data);
      } catch (err) {
        toast.error('Failed to fetch recommendations');
        console.error(err);
      }
      setLoading(false);
    };

    fetchRecommendations();
  }, []);

  const markAsCompleted = async (recId, recIndex, completed) => {
    try {
      const updatedRecs = [...recommendations];
      const doctorRecs = updatedRecs.find(r => r._id === recId).recommendations;
      doctorRecs[recIndex].completed = completed;
      
      await axios.put(`${API_URL}/api/lifestyle/${recId}`, {
        recommendations: doctorRecs
      }, {
        headers: { Authorization: `${localStorage.getItem('token')}` }
      });
      
      setRecommendations(updatedRecs);
      toast.success(`Recommendation marked as ${completed ? 'completed' : 'not completed'}`);
    } catch (err) {
      toast.error('Failed to update recommendation');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mx-auto text-4xl text-gray-400 mb-4">🌱</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">No lifestyle recommendations yet</h3>
        <p className="text-gray-500">Your doctor will provide personalized lifestyle recommendations here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendations.map((rec) => (
        <div key={rec._id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xl">👨‍⚕️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{rec.doctor.name}</h3>
              <p className="text-gray-600">{rec.doctor.specialty || 'Doctor'}</p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(rec.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {rec.notes && (
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Doctor's Notes</h4>
              <p className="text-blue-700">{rec.notes}</p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-800">Recommendations</h4>
            {rec.recommendations.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {item.category}
                      </span>
                      <span className={`capitalize px-2 py-1 text-xs rounded-full ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.priority} priority
                      </span>
                      {item.targetDate && (
                        <span className="text-xs text-gray-500">
                          Target: {new Date(item.targetDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800">{item.description}</p>
                  </div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={item.completed || false}
                      onChange={(e) => markAsCompleted(rec._id, index, e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Done</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientLifestyleView;