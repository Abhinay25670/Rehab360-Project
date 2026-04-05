import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUserMd, 
  FaUserInjured, 
  FaChartLine, 
  FaFileMedical, 
  FaImage, 
  FaClipboardList,
  FaCalendarAlt,
  FaSearch,
  FaUpload,
  FaSpinner,
  FaEye,
  FaFileDownload,
  FaChartPie,
  FaChartBar,
  FaNotesMedical
} from 'react-icons/fa';
import { MdHealthAndSafety } from 'react-icons/md';
import { RiMentalHealthFill } from 'react-icons/ri';
import {useNavigate} from "react-router-dom"
import LifestyleRecommendationEditor from "../../components/LifestyleRecommendationEditor"
import { API_URL, ML_API_URL } from "../../config/api";

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [octImage, setOctImage] = useState(null);
  const [retinaImage, setRetinaImage] = useState(null);
  const navigate = useNavigate();
  const [diabetesData, setDiabetesData] = useState({
    HighBP: 0,
    HighChol: 0,
    CholCheck: 1,
    BMI: 25,
    Smoker: 0,
    Stroke: 0,
    HeartDiseaseorAttack: 0,
    PhysActivity: 1,
    Fruits: 1,
    Veggies: 1,
    HvyAlcoholConsump: 0,
    AnyHealthcare: 1,
    NoDocbcCost: 0,
    GenHlth: 3,
    MentHlth: 5,
    PhysHlth: 2,
    DiffWalk: 0,
    Sex: 1,
    Age: 8,
    Education: 5,
    Income: 6
  });
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [newReport, setNewReport] = useState({
  patient: '',
  type: '',
  findings: '',
  status: 'completed'
});
const [showReportModal, setShowReportModal] = useState(false);
const [reportLoading, setReportLoading] = useState(false);
const user = JSON.parse(localStorage.getItem("user"))

  // Mock patient data - in a real app, this would come from your backend
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from your backend
        const res = await axios.get(`${API_URL}/api/auth/patients`);
        
        setPatients(res.data);
      } catch (err) {
        toast.error('Failed to fetch patients');
        console.error(err);
      }
      setLoading(false);
    };

    fetchPatients();
  }, []);

  // Update your useEffect for reports to fetch real data
useEffect(() => {
  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReports(res.data);
    } catch (err) {
      toast.error('Failed to fetch reports');
      console.error(err);
    }
  };

  fetchReports();
}, []);

// Add this function to create a report from analysis results
const createReportFromAnalysis = () => {
  if (!analysisResults || !selectedPatient) return;

  const findings = analysisResults.unified_clinical_summary.priority_findings
    .concat(analysisResults.unified_clinical_summary.immediate_actions_required)
    .concat(analysisResults.unified_clinical_summary.follow_up_recommendations)
    .join('\n');

  setNewReport({
    patient: selectedPatient._id,
    type: analysisResults.analysis_type,
    findings,
    status: 'completed'
  });

  setShowAnalysisModal(false);
  setShowReportModal(true);
};

// Add this function to handle report submission
const handleCreateReport = async () => {
  setReportLoading(true);
  try {
    const res = await axios.post(`${API_URL}/api/reports`, newReport, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    setReports([...reports, res.data]);
    setShowReportModal(false);
    toast.success('Report created successfully');
  } catch (err) {
    toast.error('Failed to create report');
    console.error(err);
  }
  setReportLoading(false);
};

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'oct') {
        setOctImage(file);
      } else {
        setRetinaImage(file);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setDiabetesData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target.checked ? 1 : 0) : value
    }));
  };

  const runAnalysis = async () => {
  if (!selectedPatient) {
    toast.error('Please select a patient first');
    return;
  }

  setAnalysisLoading(true);
  try {
    // Prepare FormData for image uploads
    const formData = new FormData();
    
    // Add patient info to form data
    formData.append('patient_info', JSON.stringify({
      patient_id: selectedPatient.id,
      name: selectedPatient.name,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      medical_history: selectedPatient.diabetesStatus
    }));

    // Add OCT image if available
    if (octImage) {
      formData.append('file', octImage);
    }

    // Add retina image if available
    if (retinaImage) {
      formData.append('file', retinaImage);
    }

    // Add diabetes data
    formData.append('diabetes_data', JSON.stringify(diabetesData));

    // Determine which endpoint to call based on available data
    let endpoint = `${ML_API_URL}/analyze/comprehensive`;
    let analysesPerformed = [];
    
    if (octImage && retinaImage) {
      endpoint = `${ML_API_URL}/analyze/comprehensive`;
      analysesPerformed = [
        "OCT Classification", 
        "Diabetic Retinopathy Analysis",
        "Diabetes Risk Assessment"
      ];
    } else if (octImage) {
      endpoint = `${ML_API_URL}/analyze/oct`;
      analysesPerformed = ["OCT Classification"];
    } else if (retinaImage) {
      endpoint = `${ML_API_URL}/analyze/retina`;
      analysesPerformed = ["Diabetic Retinopathy Analysis"];
    } else {
      endpoint = `${ML_API_URL}/analyze/diabetes`;
      analysesPerformed = ["Diabetes Risk Assessment"];
    }

    // Make the API call
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });

    // Process the response based on the endpoint
    let analysisResults = {
      success: true,
      analysis_type: analysesPerformed.length > 1 
        ? "Comprehensive Medical Assessment with Detailed Reports" 
        : `${analysesPerformed[0]} Report`,
      analyses_performed: analysesPerformed,
      unified_clinical_summary: {
        priority_findings: [],
        immediate_actions_required: [],
        follow_up_recommendations: []
      }
    };

    // Handle different response structures
    if (endpoint.includes('oct')) {
      analysisResults.oct_analysis = {
        predicted_condition: response.data.prediction.predicted_condition,
        confidence: response.data.prediction.confidence,
        description: response.data.prediction.description,
        all_probabilities: response.data.prediction.all_probabilities
      };

      // Add to clinical summary
      analysisResults.unified_clinical_summary.priority_findings.push(
        `OCT: ${response.data.prediction.predicted_condition} detected`
      );

      if (response.data.detailed_report?.recommendations?.immediate_actions) {
        analysisResults.unified_clinical_summary.immediate_actions_required.push(
          ...response.data.detailed_report.recommendations.immediate_actions
        );
      }
    }

    if (endpoint.includes('retina')) {
      analysisResults.retina_analysis = {
        condition: response.data.prediction.condition,
        confidence: response.data.prediction.confidence,
        agreement: response.data.prediction.agreement,
        description: response.data.prediction.description,
        model_results: response.data.prediction.model_results
      };

      // Add to clinical summary
      analysisResults.unified_clinical_summary.priority_findings.push(
        `Retina: ${response.data.prediction.condition}`
      );

      if (response.data.detailed_report?.recommendations?.immediate_actions) {
        analysisResults.unified_clinical_summary.immediate_actions_required.push(
          ...response.data.detailed_report.recommendations.immediate_actions
        );
      }
    }

    if (endpoint.includes('diabetes')) {
      analysisResults.diabetes_analysis = {
        prediction_label: response.data.prediction.prediction_label,
        risk_probability: response.data.prediction.risk_probability,
        risk_level: response.data.prediction.risk_level,
        confidence: response.data.prediction.confidence
      };

      // Extract risk factors from the input data
      const riskFactors = [];
      if (diabetesData.HighBP === 1) riskFactors.push("High Blood Pressure");
      if (diabetesData.HighChol === 1) riskFactors.push("High Cholesterol");
      if (diabetesData.BMI >= 30) riskFactors.push("Obesity (BMI ≥ 30)");
      else if (diabetesData.BMI >= 25) riskFactors.push("Overweight (BMI ≥ 25)");
      if (diabetesData.Smoker === 1) riskFactors.push("Smoking History");
      if (diabetesData.HeartDiseaseorAttack === 1) riskFactors.push("Heart Disease History");
      if (diabetesData.PhysActivity === 0) riskFactors.push("Lack of Physical Activity");
      if (diabetesData.Age >= 9) riskFactors.push("Advanced Age");
      if (diabetesData.GenHlth >= 4) riskFactors.push("Poor General Health");

      analysisResults.diabetes_risk_factors = riskFactors;

      // Add to clinical summary
      analysisResults.unified_clinical_summary.priority_findings.push(
        `Diabetes Risk: ${response.data.prediction.risk_level}`
      );

      if (response.data.detailed_report?.clinical_recommendations?.immediate_medical_actions) {
        analysisResults.unified_clinical_summary.immediate_actions_required.push(
          ...response.data.detailed_report.clinical_recommendations.immediate_medical_actions
        );
      }
    }

    // Add follow-up recommendations from detailed reports if available
    if (response.data.detailed_report?.recommendations?.follow_up_care) {
      analysisResults.unified_clinical_summary.follow_up_recommendations.push(
        ...response.data.detailed_report.recommendations.follow_up_care
      );
    } else if (response.data.detailed_report?.clinical_recommendations?.monitoring_schedule) {
      analysisResults.unified_clinical_summary.follow_up_recommendations.push(
        ...response.data.detailed_report.clinical_recommendations.monitoring_schedule.recommended_tests.map(
          test => `Schedule ${test} test`
        )
      );
    }

    setAnalysisResults(analysisResults);
    setShowAnalysisModal(true);
    toast.success('Analysis completed successfully');

  } catch (err) {
    console.error('Analysis error:', err);
    toast.error(`Analysis failed: ${err.response?.data?.detail || err.message}`);
  } finally {
    setAnalysisLoading(false);
  }
};

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(report =>
    report.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Utility function to get risk level from probability
const getRiskLevel = (probability) => {
  if (probability < 20) return "Low";
  if (probability < 50) return "Moderate";
  if (probability < 80) return "High";
  return "Very High";
};

// Utility function to format diabetes prediction response
const formatDiabetesPrediction = (prediction) => {
  return {
    prediction_label: prediction.prediction === 1 ? "Diabetes" : "No Diabetes",
    risk_probability: prediction.risk_probability,
    risk_level: getRiskLevel(prediction.risk_probability),
    confidence: prediction.confidence
  };
};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-blue-800 text-white p-4 min-h-screen">
          <div className="flex items-center space-x-2 p-4 mb-8">
            <MdHealthAndSafety className="text-3xl" />
            <h1 className="text-xl font-bold">DiabetesDetect</h1>
          </div>
          <nav>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg mb-2 ${activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <FaChartLine />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg mb-2 ${activeTab === 'patients' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <FaUserInjured />
              <span>Patients</span>
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg mb-2 ${activeTab === 'analysis' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <FaFileMedical />
              <span>Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg mb-2 ${activeTab === 'reports' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <FaClipboardList />
              <span>Reports</span>
            </button>

            <button
              onClick={() => navigate('/doctor-appointment')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg mb-2 ${activeTab === '' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
            >
              <FaClipboardList />
              <span>Appointments</span>
            </button>
         
<button
  onClick={() => setActiveTab('lifestyle')}
  className={`flex items-center space-x-2 w-full p-3 rounded-lg mb-2 ${activeTab === 'lifestyle' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
>
  <RiMentalHealthFill />
  <span>Lifestyle</span>
</button>
          </nav>
          <div className="mt-8 p-4 bg-blue-900 rounded-lg">
            <div className="flex items-center space-x-2">
              <FaUserMd className="text-xl" />
              <div>
                <p className="font-medium">Dr. Smith</p>
                <p className="text-sm text-blue-200">Ophthalmologist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <ToastContainer position="top-right" autoClose={3000} />

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Doctor Dashboard</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Total Patients</p>
                      <h2 className="text-3xl font-bold">{patients.length}</h2>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FaUserInjured className="text-blue-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Reports Generated</p>
                      <h2 className="text-3xl font-bold">{reports.length}</h2>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FaFileMedical className="text-green-600 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">High Risk Patients</p>
                      <h2 className="text-3xl font-bold">3</h2>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <RiMentalHealthFill className="text-red-600 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaChartPie className="mr-2 text-blue-500" />
                    Diabetes Risk Distribution
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
                    <p className="text-gray-500">Pie chart visualization would go here</p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaChartBar className="mr-2 text-blue-500" />
                    Recent Reports
                  </h3>
                  <div className="space-y-4">
                    {reports.slice(0, 3).map(report => (
                      <div key={report.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{report.patientName}</p>
                          <span className="text-sm text-gray-500">{report.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{report.type}</p>
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            report.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                          <button className="text-xs text-blue-600 hover:underline">View Details</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  Upcoming Appointments
                </h3>
                <div className="space-y-4">
                  {patients
                    .filter(p => p.nextAppointment)
                    .sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment))
                    .slice(0, 3)
                    .map(patient => (
                      <div key={patient.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                        <img 
                          src={patient.image} 
                          alt={patient.name} 
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.diabetesStatus}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(patient.nextAppointment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(patient.nextAppointment).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lifestyle' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Lifestyle Recommendations</h1>
      {selectedPatient && (
        <div className="flex items-center space-x-4">
          <img 
            src={selectedPatient.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"} 
            alt={selectedPatient.name} 
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="font-medium">{selectedPatient.name}</span>
        </div>
      )}
    </div>

    {!selectedPatient ? (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Please select a patient from the Patients tab to provide lifestyle recommendations.
            </p>
          </div>
        </div>
      </div>
    ) : (
      <LifestyleRecommendationEditor
        patient={selectedPatient} 
        doctor={user} 
      />
    )}
  </div>
)}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Patient Records</h1>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <FaSpinner className="animate-spin text-4xl text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.map(patient => (
                    <div 
                      key={patient.id} 
                      className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                        selectedPatient?.id === patient.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <img 
                            src={patient.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"} 
                            alt={patient.name} 
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="text-xl font-semibold">{patient.name}</h3>
                            <p className="text-gray-600">{patient.age || "22"} years, {patient.gender || "Male"}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Diabetes Status:</span>
                            <span className="font-medium">
                              {patient.diabetesStatus === 'Type 2' ? (
                                <span className="text-red-600">Type 2</span>
                              ) : patient.diabetesStatus === 'Type 1' ? (
                                <span className="text-orange-600">Type 1</span>
                              ) : (
                                <span className="text-yellow-600">Pre-diabetic</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Visit:</span>
                            <span>{new Date(patient.lastVisit || "12-04-2022").toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Next Appointment:</span>
                            <span className="font-medium text-blue-600">
                              {new Date(patient.nextAppointment || "12-04-2022").toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Patient Analysis</h1>
              
              {selectedPatient ? (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img 
                      src={selectedPatient.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"} 
                      alt={selectedPatient.name} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                      <p className="text-gray-600">
                        {selectedPatient.age || "22"} years, {selectedPatient.gender || "Male"} • {selectedPatient.diabetesStatus || "Pre-Diabetes"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Please select a patient from the Patients tab to begin analysis.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* OCT Image Analysis */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaImage className="mr-2 text-blue-500" />
                    OCT Image Analysis
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload OCT Retina Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {octImage ? (
                          <div className="text-sm text-gray-600">
                            <p>{octImage.name}</p>
                            <button 
                              onClick={() => setOctImage(null)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              Change file
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex text-sm text-gray-600 justify-center">
                              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                <span>Upload a file</span>
                                <input 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'oct')}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">About OCT Analysis</h4>
                    <p className="text-xs text-gray-600">
                      Optical Coherence Tomography (OCT) helps detect diabetic retinopathy and macular edema by 
                      providing cross-sectional images of the retina.
                    </p>
                  </div>
                </div>

                {/* Retina DR Analysis */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaImage className="mr-2 text-blue-500" />
                    Retina DR Analysis
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Retina Fundus Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {retinaImage ? (
                          <div className="text-sm text-gray-600">
                            <p>{retinaImage.name}</p>
                            <button 
                              onClick={() => setRetinaImage(null)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              Change file
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex text-sm text-gray-600 justify-center">
                              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                <span>Upload a file</span>
                                <input 
                                  type="file" 
                                  className="sr-only" 
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'retina')}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG up to 10MB
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">About DR Analysis</h4>
                    <p className="text-xs text-gray-600">
                      Diabetic Retinopathy (DR) analysis detects and classifies the severity of retinal damage 
                      caused by diabetes using deep learning models.
                    </p>
                  </div>
                </div>

                {/* Diabetes Risk Assessment */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <FaNotesMedical className="mr-2 text-blue-500" />
                    Diabetes Risk Assessment
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                      <input
                        type="number"
                        name="BMI"
                        value={diabetesData.BMI}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="HighBP"
                            checked={diabetesData.HighBP === 1}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">High BP</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="HighChol"
                            checked={diabetesData.HighChol === 1}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">High Cholesterol</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">General Health</label>
                      <select
                        name="GenHlth"
                        value={diabetesData.GenHlth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Excellent</option>
                        <option value="2">Very Good</option>
                        <option value="3">Good</option>
                        <option value="4">Fair</option>
                        <option value="5">Poor</option>
                      </select>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">About Risk Assessment</h4>
                      <p className="text-xs text-gray-600">
                        This assessment evaluates diabetes risk based on health factors using a hybrid 
                        machine learning model with 85% accuracy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={runAnalysis}
                  disabled={analysisLoading || (!octImage && !retinaImage)}
                  className={`px-6 py-3 rounded-md text-white font-medium ${
                    analysisLoading || (!octImage && !retinaImage) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } flex items-center`}
                >
                  {analysisLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Run Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Patient Reports</h1>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Findings
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                src={patients.find(p => p.id === report.patientId)?.image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541'} 
                                alt="" 
                                className="h-10 w-10 rounded-full"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{report.patient.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {report.findings}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            report.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3 flex items-center">
                            <FaEye className="mr-1" /> View
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 flex items-center">
                            <FaFileDownload className="mr-1" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results Modal */}
      {showAnalysisModal && analysisResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={selectedPatient.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"} 
                    alt={selectedPatient.name} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                    <p className="text-gray-600">
                      {selectedPatient.age || "22"} years, {selectedPatient.gender || "Male"} • {selectedPatient.diabetesStatus || "NA"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* OCT Results */}
                {analysisResults.oct_analysis && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">OCT Analysis Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.oct_analysis.predicted_condition}</p>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Confidence</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.oct_analysis.confidence}%</p>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                        <p className="text-sm mt-1">{analysisResults.oct_analysis.description}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Probability Distribution</h4>
                      <div className="flex space-x-2">
                        {Object.entries(analysisResults.oct_analysis.all_probabilities).map(([condition, prob]) => (
                          <div key={condition} className="flex-1">
                            <div className="text-xs text-center mb-1">{condition}</div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  condition === analysisResults.oct_analysis.predicted_condition 
                                    ? 'bg-blue-600' 
                                    : 'bg-gray-400'
                                }`} 
                                style={{ width: `${prob}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-center mt-1">{prob}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Retina DR Results */}
                {analysisResults.retina_analysis && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Diabetic Retinopathy Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Severity</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.retina_analysis.condition}</p>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Confidence</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.retina_analysis.confidence}%</p>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Model Agreement</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.retina_analysis.agreement}%</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Model Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {Object.entries(analysisResults.retina_analysis.model_results).map(([model, result]) => (
                          <div key={model} className="bg-white p-3 rounded-md shadow-sm">
                            <div className="text-sm font-medium capitalize">{model}</div>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm">{result.condition}</span>
                              <span className="text-sm font-medium">{result.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm">{analysisResults.retina_analysis.description}</p>
                    </div>
                  </div>
                )}

                {/* Diabetes Risk Results */}
                {analysisResults.diabetes_analysis && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Diabetes Risk Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Risk Level</h4>
                        <p className={`text-xl font-semibold mt-1 ${
                          analysisResults.diabetes_analysis.risk_level === 'Very High' ? 'text-red-600' :
                          analysisResults.diabetes_analysis.risk_level === 'High' ? 'text-orange-600' :
                          analysisResults.diabetes_analysis.risk_level === 'Moderate' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {analysisResults.diabetes_analysis.risk_level}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Probability</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.diabetes_analysis.risk_probability}%</p>
                      </div>
                      <div className="bg-white p-4 rounded-md shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Prediction</h4>
                        <p className="text-xl font-semibold mt-1">{analysisResults.diabetes_analysis.prediction_label}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Key Risk Factors</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResults.diabetes_risk_factors.map((factor, i) => (
                          <span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex space-x-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${analysisResults.diabetes_analysis.confidence.no_diabetes}%` }}
                          title={`No Diabetes: ${analysisResults.diabetes_analysis.confidence.no_diabetes}%`}
                        ></div>
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${analysisResults.diabetes_analysis.confidence.diabetes}%` }}
                          title={`Diabetes: ${analysisResults.diabetes_analysis.confidence.diabetes}%`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>No Diabetes ({analysisResults.diabetes_analysis.confidence.no_diabetes}%)</span>
                        <span>Diabetes ({analysisResults.diabetes_analysis.confidence.diabetes}%)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinical Summary */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Clinical Summary</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Priority Findings</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResults.unified_clinical_summary.priority_findings.map((finding, i) => (
                        <li key={i} className="text-sm">{finding}</li>
                      ))}
                    </ul>
                  </div>

                  {analysisResults.unified_clinical_summary.immediate_actions_required.length > 0 && (
                    <div className="mb-4 bg-red-50 p-3 rounded-md border border-red-100">
                      <h4 className="text-sm font-medium text-red-700 mb-2">Immediate Actions Required</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {analysisResults.unified_clinical_summary.immediate_actions_required.map((action, i) => (
                          <li key={i} className="text-sm text-red-700">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Follow-up Recommendations</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResults.unified_clinical_summary.follow_up_recommendations.map((rec, i) => (
                        <li key={i} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
  <button
    onClick={() => setShowAnalysisModal(false)}
    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
  >
    Close
  </button>
  <button
    onClick={createReportFromAnalysis}
    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
  >
    <FaFileMedical className="mr-2" />
    Generate Report
  </button>
  <button
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
  >
    <FaFileDownload className="mr-2" />
    Download Full Report
  </button>
</div>

              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create New Report</h2>
          <button 
            onClick={() => setShowReportModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
              value={selectedPatient?.name || ''}
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <input
              type="text"
              name="type"
              value={newReport.type}
              onChange={(e) => setNewReport({...newReport, type: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea
              name="findings"
              value={newReport.findings}
              onChange={(e) => setNewReport({...newReport, findings: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            onClick={() => setShowReportModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReport}
            disabled={reportLoading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              reportLoading ? 'opacity-75 cursor-not-allowed' : ''
            } flex items-center`}
          >
            {reportLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <FaFileMedical className="mr-2" />
                Create Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      
    </div>
    
  );
};

export default DoctorDashboard;