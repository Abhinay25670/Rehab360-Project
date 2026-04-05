import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { FaExclamationCircle, FaTimes, FaPhone, FaCheck } from 'react-icons/fa';
import { API_BASE_URL } from '../config/api';

const SOSButton = ({ metrics = {}, darkMode = false }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Theme classes based on dark mode
  const theme = darkMode ? {
    modalBg: 'bg-zinc-900',
    modalBorder: 'border-zinc-800',
    text: 'text-white',
    textSecondary: 'text-zinc-400',
    inputBg: 'bg-zinc-800 border-zinc-700 text-white',
    successBg: 'bg-emerald-900/50',
    successBorder: 'border-emerald-700'
  } : {
    modalBg: 'bg-white',
    modalBorder: 'border-zinc-200',
    text: 'text-zinc-900',
    textSecondary: 'text-zinc-600',
    inputBg: 'bg-white border-zinc-300 text-zinc-900',
    successBg: 'bg-emerald-50',
    successBorder: 'border-emerald-200'
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const formatCooldown = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setError('');
    setMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setMessage('');
  };

  const handleSendSOS = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/guardian/alert/sos`, {
        userId: user.id,
        message: message || t('sos.defaultMessage'),
        metrics: {
          riskScore: metrics.riskScore,
          stressLevel: metrics.stressLevel,
          cravingLevel: metrics.cravingLevel
        }
      });

      if (response.data.success) {
        if (response.data.sent) {
          setShowModal(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
        } else {
          // Cooldown active
          if (response.data.cooldownRemaining) {
            setCooldownRemaining(response.data.cooldownRemaining);
          }
          setError(response.data.message);
        }
      } else {
        setError(response.data.message || 'Failed to send SOS alert');
      }
    } catch (err) {
      console.error('Error sending SOS:', err);
      setError(err.response?.data?.message || 'Failed to send SOS alert. Please try again or call emergency services directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={handleOpenModal}
        disabled={cooldownRemaining > 0}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full font-semibold shadow-lg transition-all duration-200 ${
          cooldownRemaining > 0
            ? 'bg-zinc-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
        } text-white`}
        title={cooldownRemaining > 0 ? `Available in ${formatCooldown(cooldownRemaining)}` : t('sos.sendSOS')}
      >
        <FaExclamationCircle className="text-lg" />
        {cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : 'SOS'}
      </button>

      {/* SOS Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md ${theme.modalBg} ${theme.modalBorder} border rounded-2xl shadow-2xl overflow-hidden`}>
            {/* Header */}
            <div className="bg-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaExclamationCircle className="text-2xl text-white" />
                  <h2 className="text-xl font-bold text-white">{t('sos.emergencySOS')}</h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-white/80 hover:text-white transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`${theme.textSecondary} mb-4`}>
                {t('sos.sosDesc')}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Optional Message */}
              <div className="mb-6">
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  {t('sos.addMessage')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('sos.messagePlaceholder')}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${theme.inputBg}`}
                />
              </div>

              {/* Current Metrics Preview */}
              {(metrics.riskScore !== undefined || metrics.stressLevel !== undefined) && (
                <div className={`${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'} rounded-lg p-4 mb-6`}>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>
                    {t('sos.metricsShared')}
                  </p>
                  <div className="flex gap-4 text-sm">
                    {metrics.riskScore !== undefined && (
                      <div>
                        <span className={theme.textSecondary}>{t('sos.risk')}: </span>
                        <span className={`font-semibold ${metrics.riskScore >= 60 ? 'text-red-500' : theme.text}`}>
                          {metrics.riskScore}
                        </span>
                      </div>
                    )}
                    {metrics.stressLevel !== undefined && (
                      <div>
                        <span className={theme.textSecondary}>{t('sos.stress')}: </span>
                        <span className={`font-semibold ${theme.text}`}>{metrics.stressLevel}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Numbers */}
              <div className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-200'} border rounded-lg mb-6`}>
                <FaPhone className="text-amber-600" />
                <p className={`text-sm ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                  {t('sos.emergencyNotice')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    darkMode 
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSendSOS}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('sos.sending')}
                    </>
                  ) : (
                    <>
                      <FaExclamationCircle />
                      {t('sos.sendSOS')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-4 ${theme.successBg} ${theme.successBorder} border rounded-xl shadow-lg`}>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <FaCheck className="text-white" />
            </div>
            <div>
              <p className={`font-medium ${theme.text}`}>{t('sos.sosAlertSent')}</p>
              <p className={`text-sm ${theme.textSecondary}`}>{t('sos.guardianNotified')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SOSButton;
