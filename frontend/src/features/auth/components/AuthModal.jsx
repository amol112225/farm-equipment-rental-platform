import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * AuthModal Component
 * Interactive modal dialog for Farmer Login and Registration with multilingual support.
 * Handles form validation, field-level backend errors, and mode switching.
 */
const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  if (!isOpen) return null;

  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Form State
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    village: '',
    district: '',
    state: '',
  });

  // UI Error and Status State
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    resetFeedback();
  }, [initialMode, isOpen]);

  const resetFeedback = () => {
    setFieldErrors({});
    setGeneralError('');
    setSuccessMessage('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetFeedback();
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    try {
      await login(loginEmail, loginPassword);
      setSuccessMessage(t('auth.loginSuccess'));
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 400);
    } catch (err) {
      setIsSubmitting(false);
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || t('auth.invalidCredentials'));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    try {
      await register(regData);
      setIsSubmitting(false);
      setSuccessMessage(t('auth.registerSuccess'));
      setMode('login');
      setLoginEmail(regData.email);
      setLoginPassword('');
    } catch (err) {
      setIsSubmitting(false);
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setGeneralError(err.message || t('auth.registrationFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-emerald-700 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white p-1 rounded-full hover:bg-emerald-600/50 transition-colors cursor-pointer"
            aria-label={t('auth.closeDialog')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {mode === 'login'
              ? t('auth.loginSubtitle')
              : t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${mode === 'login'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            {t('auth.tabLogin')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${mode === 'register'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            {t('auth.tabRegister')}
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Top Success Alert */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium flex items-center space-x-2">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Top Error Alert */}
          {generalError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('auth.authenticating')}</span>
                    </>
                  ) : (
                    <span>{t('auth.loginButton')}</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  {t('auth.dontHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                  >
                    {t('auth.registerHere')}
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={regData.fullName}
                  onChange={handleRegChange}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                />
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={regData.email}
                    onChange={handleRegChange}
                    placeholder="ramesh@farm.org"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('auth.phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={regData.phone}
                    onChange={handleRegChange}
                    placeholder={t('auth.phonePlaceholder')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t('auth.passwordMin')}
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={regData.password}
                  onChange={handleRegChange}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('auth.village')}
                  </label>
                  <input
                    type="text"
                    name="village"
                    required
                    value={regData.village}
                    onChange={handleRegChange}
                    placeholder={t('auth.villagePlaceholder')}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                  {fieldErrors.village && (
                    <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.village}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('auth.district')}
                  </label>
                  <input
                    type="text"
                    name="district"
                    required
                    value={regData.district}
                    onChange={handleRegChange}
                    placeholder={t('auth.districtPlaceholder')}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                  {fieldErrors.district && (
                    <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.district}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t('auth.state')}
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={regData.state}
                    onChange={handleRegChange}
                    placeholder={t('auth.statePlaceholder')}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
                  />
                  {fieldErrors.state && (
                    <p className="text-xs text-red-600 font-medium mt-1">{fieldErrors.state}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('auth.creatingAccount')}</span>
                    </>
                  ) : (
                    <span>{t('auth.registerButton')}</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                  {t('auth.alreadyRegistered')}{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                  >
                    {t('auth.loginHere')}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
