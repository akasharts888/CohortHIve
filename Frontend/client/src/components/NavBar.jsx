import { useState, useEffect } from 'react';
import { useQuizStatus } from '../context/QuizContext';
import { motion, AnimatePresence } from "framer-motion";
import { FiLogOut, FiMenu, FiX, FiBook, FiMessageSquare, FiAward, FiBarChart2 } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid';
import { Link, useLocation ,useNavigate} from 'react-router-dom';
import { IoIosContact } from "react-icons/io";
import { FaProjectDiagram } from "react-icons/fa";
import { FeaturesMegaMenu } from "./FeaturesDrawer"

const NavBar = ({ isAuthenticated, setIsAuthenticated }) => {
  const { quizTaken } = useQuizStatus();
  const isLocked = quizTaken === false;
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  // Track scroll position for header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClass = (path) =>
    `group relative flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
      location.pathname.includes(path)
        ? 'text-white bg-gradient-to-r from-blue-800 to-blue-600 shadow-md'
        : 'text-gray-700 hover:text-blue-800 dark:text-gray-300 dark:hover:text-blue-400'
    }`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('quizState');
    setIsAuthenticated(false);
    setMobileMenuOpen(false);
    navigate('/'); 
  };
  const handleMobileNavClick = (path, isLocked) => {
    if (!isLocked || path === '/quiz') {
      if (path === '/learn') {
        const sessionId = uuidv4();
        navigate(`/learn/${sessionId}`);
      } else {
        navigate(path);
      }
      setMobileMenuOpen(false);
    }
  };
  return (
    <>
      {/* Top scroll accent line */}
      {scrolled && (
          <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 z-50"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4 }}
          />
      )}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white shadow-md dark:bg-gray-900' : 'bg-white/95 backdrop-blur-sm dark:bg-gray-900/90'}`}
      >
          <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo with animation */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="group text-4xl font-extrabold relative flex items-center gap-1 transition hover:scale-105 hover:drop-shadow-md">
                {/* <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                  MentorIQ
                </span> */}
                <motion.span
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-[#2C5282] to-[#2B6CB0] bg-clip-text text-transparent"
                >
                  Cohort
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent"
                >
                  Hive
                </motion.span>
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-gradient-to-r from-[#2C5282] via-[#FBBF24] to-[#F59E0B] transition-all duration-500 group-hover:w-full" />
                {/* <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400" /> */}
              </Link>
            </motion.div>


            <div className="hidden lg:flex items-center gap-1">
                {isAuthenticated && (
                  <div className="relative flex items-center gap-6">
                    <motion.button 
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      // disabled={isLocked}
                      className={`${navLinkClass('/about')}}`}
                      onClick={() => !isLocked && handleMobileNavClick('/about')}
                    >
                      <IoIosContact />
                      <span>About</span>
                      <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full" />
                    </motion.button >
                    <motion.div className="relative"
                      onMouseEnter={() => setFeaturesOpen(true)}
                      onMouseLeave={() => setFeaturesOpen(false)}
                    >
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={navLinkClass('/about')}
                      >
                        <FiMenu />
                        <span>Features</span>
                        <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full" />
                      </motion.button>
                      <FeaturesMegaMenu
                        isOpen={featuresOpen}
                        handleNav={(path) => {
                          setFeaturesOpen(false);
                          handleMobileNavClick(path);
                        }}
                        onClose={() => setFeaturesOpen(false)}
                      />
                    </motion.div>
                  </div>
                )}
              
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="ml-2"
                >
                  {isAuthenticated ? (
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg hover:shadow-xl"
                      title="Log out"
                    >
                      <FiLogOut />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                      <button
                        onClick={() => navigate('/signup')}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl"
                      >
                        Get Started
                      </button>
                  )}
                </motion.div>
            </div>

            {/* Mobile Menu Button - visible on mobile */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden z-50"
            >
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 rounded-lg bg-gray-800 text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </motion.div>

            {/* Mobile Menu - appears when hamburger is clicked */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/50 lg:hidden z-40"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-gray-900 z-50 border-l border-gray-300 dark:border-gray-700"
                  >
                    <div className="flex flex-col h-full">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-600 p-2 rounded-lg">
                            <FiBook className="text-white" />
                          </div>
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Mentor</span>
                          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">IQ</span>
                        </div>
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        >
                          <FiX />
                        </button>
                      </div>
                      <div className="flex-1 p-4 space-y-2">
                        {isAuthenticated && (
                          <>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              className={`w-full text-left ${navLinkClass('/learn')} ${
                                isLocked ? 'opacity-60 cursor-not-allowed' : ''
                              } flex items-center gap-3`}
                              onClick={() => !isLocked && handleMobileNavClick('/learn')}
                            >
                              <FiBook />
                              <span>Learn</span>
                              {isLocked && <span className="ml-auto text-sm text-gray-400">(Complete Quiz)</span>}
                            </motion.button>
                              
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              className={`w-full text-left ${navLinkClass('/rooms')} ${
                                isLocked ? 'opacity-70 cursor-not-allowed' : ''
                              } flex items-center gap-3`}
                              onClick={() => !isLocked && handleMobileNavClick('/rooms')}
                            >
                              <FiMessageSquare />
                              <span>Discuss</span>
                              {isLocked && <span className="ml-auto text-sm text-gray-400">(Complete Quiz)</span>}
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              className={`w-full text-left ${navLinkClass('/quiz')} flex items-center gap-3`}
                              onClick={() => handleMobileNavClick('/quiz')}
                            >
                              <FiAward />
                              <span>Assessment</span>
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              disabled={isLocked}
                              className={`w-full text-left ${navLinkClass('/dashboard')} ${
                                isLocked ? 'opacity-70 cursor-not-allowed' : ''
                              } flex items-center gap-3`}
                              onClick={() => !isLocked && handleMobileNavClick('/dashboard')}
                            >
                              <FiBarChart2 />
                              <span>Progress</span>
                              {isLocked && <span className="ml-auto text-sm text-gray-400">(Complete Quiz)</span>}
                            </motion.button>
                          </>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        {isAuthenticated ? (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold"
                          >
                            <FiLogOut />
                            <span>Sign Out</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              navigate('/signup');
                              setMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold"
                          >
                            Get Started
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </nav>
        </motion.header>
      </>
  );
};

export default NavBar;
