import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  FaArrowRight, 
  FaHeart, 
  FaMoon, 
  FaSmile, 
  FaFire, 
  FaBrain,
  FaLeaf,
  FaChartLine,
  FaShieldAlt,
  FaCheck,
  FaStar,
  FaBars,
  FaTimes,
  FaGlobe
} from "react-icons/fa";
import { MdSelfImprovement, MdHealthAndSafety } from "react-icons/md";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
  UserButton,
  useUser
} from "@clerk/clerk-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, changeLanguage } from "../i18n";

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef(null);
  const { user } = useUser();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger animations when in view
  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    { icon: <FaBrain className="text-2xl" />, title: t('features.aiSupport'), description: t('features.aiSupportDesc') },
    { icon: <FaMoon className="text-2xl" />, title: t('features.sleepAnalysis'), description: t('features.sleepAnalysisDesc') },
    { icon: <FaFire className="text-2xl" />, title: t('features.cravingManagement'), description: t('features.cravingManagementDesc') },
    { icon: <FaLeaf className="text-2xl" />, title: t('features.nutritionGuidance'), description: t('features.nutritionGuidanceDesc') },
    { icon: <FaChartLine className="text-2xl" />, title: t('features.progressTracking'), description: t('features.progressTrackingDesc') },
    { icon: <FaShieldAlt className="text-2xl" />, title: t('features.riskAssessment'), description: t('features.riskAssessmentDesc') }
  ];

  const steps = [
    { number: "01", title: t('howItWorks.step1Title'), description: t('howItWorks.step1Desc') },
    { number: "02", title: t('howItWorks.step2Title'), description: t('howItWorks.step2Desc') },
    { number: "03", title: t('howItWorks.step3Title'), description: t('howItWorks.step3Desc') },
    { number: "04", title: t('howItWorks.step4Title'), description: t('howItWorks.step4Desc') }
  ];

  const testimonials = [
    { name: "Alex J.", role: t('testimonials.alexRole'), content: t('testimonials.alex'), avatar: "A" },
    { name: "Maria K.", role: t('testimonials.mariaRole'), content: t('testimonials.maria'), avatar: "M" },
    { name: "James L.", role: t('testimonials.jamesRole'), content: t('testimonials.james'), avatar: "J" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg border-b border-zinc-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${scrolled ? 'bg-zinc-900' : 'bg-white'}`}>
                <FaBrain className={scrolled ? 'text-white' : 'text-zinc-900'} />
              </div>
              <span className={`font-semibold text-lg ${scrolled ? 'text-zinc-900' : 'text-white'}`}>Rehab</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className={`text-sm font-medium transition-colors ${scrolled ? 'text-zinc-600 hover:text-zinc-900' : 'text-white/80 hover:text-white'}`}>
                {t('nav.features')}
              </a>
              <a href="#how-it-works" className={`text-sm font-medium transition-colors ${scrolled ? 'text-zinc-600 hover:text-zinc-900' : 'text-white/80 hover:text-white'}`}>
                {t('nav.howItWorks')}
              </a>
              <a href="#testimonials" className={`text-sm font-medium transition-colors ${scrolled ? 'text-zinc-600 hover:text-zinc-900' : 'text-white/80 hover:text-white'}`}>
                {t('nav.testimonials')}
              </a>
            </div>

            {/* Auth Buttons + Language */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${scrolled ? 'text-zinc-600 hover:bg-zinc-100' : 'text-white/80 hover:bg-white/10'}`}
                >
                  <FaGlobe className="text-xs" />
                  {currentLang.nativeLabel}
                </button>
                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { changeLanguage(lang.code); setLangDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                          lang.code === i18n.language ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <span>{lang.nativeLabel}</span>
                        <span className="text-xs text-zinc-400">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${scrolled ? 'text-zinc-700 hover:bg-zinc-100' : 'text-white hover:bg-white/10'}`}>
                    {t('common.signIn')}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${scrolled ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-zinc-900 hover:bg-zinc-100'}`}>
                    {t('common.getStarted')}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${scrolled ? 'text-zinc-700 hover:bg-zinc-100' : 'text-white hover:bg-white/10'}`}>
                  {t('common.dashboard')}
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-zinc-900' : 'text-white'}`}
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm font-medium text-zinc-700 hover:text-zinc-900" onClick={() => setMobileMenuOpen(false)}>{t('nav.features')}</a>
              <a href="#how-it-works" className="block text-sm font-medium text-zinc-700 hover:text-zinc-900" onClick={() => setMobileMenuOpen(false)}>{t('nav.howItWorks')}</a>
              <a href="#testimonials" className="block text-sm font-medium text-zinc-700 hover:text-zinc-900" onClick={() => setMobileMenuOpen(false)}>{t('nav.testimonials')}</a>
              {/* Mobile Language Selector */}
              <div className="pt-3 border-t border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-2">{t('settings.language')}</p>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        lang.code === i18n.language ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {lang.nativeLabel}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-200 space-y-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg">{t('common.signIn')}</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg">{t('common.getStarted')}</button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard" className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-zinc-900 rounded-lg">
                    {t('common.goToDashboard')}
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-zinc-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-900"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-zinc-300 mb-8">
              <FaShieldAlt className="text-emerald-500" />
              {t('hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            {t('hero.titleLine1')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400">{t('hero.titleLine2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors">
                  {t('hero.startJourney')} <FaArrowRight />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors">
                  {t('common.signIn')}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors">
                {t('common.goToDashboard')} <FaArrowRight />
              </Link>
            </SignedIn>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16 pt-8 border-t border-zinc-800"
          >
            <div>
              <p className="text-2xl font-bold text-white">{t('hero.stat1Value')}</p>
              <p className="text-sm text-zinc-500">{t('hero.stat1Label')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{t('hero.stat2Value')}</p>
              <p className="text-sm text-zinc-500">{t('hero.stat2Label')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{t('hero.stat3Value')}</p>
              <p className="text-sm text-zinc-500">{t('hero.stat3Label')}</p>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-zinc-700 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-zinc-500 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{t('features.sectionLabel')}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2 mb-4">{t('features.heading')}</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{t('features.subheading')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial="hidden"
                animate={controls}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-700 group-hover:bg-zinc-900 group-hover:text-white transition-colors mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{t('howItWorks.sectionLabel')}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2 mb-4">{t('howItWorks.heading')}</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{t('howItWorks.subheading')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial="hidden"
                animate={controls}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-zinc-200 mb-4">{step.number}</div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-zinc-600 text-sm">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-zinc-300 -translate-x-1/2"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{t('testimonials.sectionLabel')}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2 mb-4">{t('testimonials.heading')}</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">{t('testimonials.subheading')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial="hidden"
                animate={controls}
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-white border border-zinc-200 rounded-xl"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-amber-400 text-sm" />
                  ))}
                </div>
                <p className="text-zinc-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center font-semibold text-zinc-700">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{testimonial.name}</p>
                    <p className="text-sm text-zinc-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              <SignedIn>{t('cta.headingSignedIn')}</SignedIn>
              <SignedOut>{t('cta.headingSignedOut')}</SignedOut>
            </h2>
            <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
              <SignedIn>{t('cta.subtitleSignedIn')}</SignedIn>
              <SignedOut>{t('cta.subtitleSignedOut')}</SignedOut>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors">
                    {t('cta.getStartedFree')} <FaArrowRight />
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors">
                  {t('common.goToDashboard')} <FaArrowRight />
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <FaBrain className="text-zinc-900" />
              </div>
              <span className="font-semibold text-white">Rehab</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#features" className="hover:text-white transition-colors">{t('nav.features')}</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">{t('nav.howItWorks')}</a>
              <a href="#testimonials" className="hover:text-white transition-colors">{t('nav.testimonials')}</a>
            </div>
            <p className="text-sm text-zinc-600">
              {t('common.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
