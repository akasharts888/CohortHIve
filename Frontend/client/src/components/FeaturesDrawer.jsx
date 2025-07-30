// components/FeaturesDrawer.tsx
import { useEffect} from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiMessageSquare, FiAward, FiBarChart2 } from 'react-icons/fi';
import { FaProjectDiagram } from 'react-icons/fa';
import { FaNoteSticky } from "react-icons/fa6";


const features = [
  {
    title: 'Learn',
    description: 'Interactive lessons with guidance.',
    icon: <FiBook className="text-3xl text-sky-400" />,
    path: '/learn',
  },
  {
    title: 'Discuss',
    description: 'Collaborate with others in real-time.',
    icon: <FiMessageSquare className="text-3xl text-green-400" />,
    path: '/rooms',
  },
  // {
  //   title: 'Project',
  //   description: 'Hands-on challenges and builds.',
  //   icon: <FaProjectDiagram className="text-3xl text-purple-400" />,
  //   path: '/projectPage',
  // },
  {
    title: 'Assessment',
    description: 'Evaluate your understanding.',
    icon: <FiAward className="text-3xl text-yellow-400" />,
    path: '/quiz',
  },
  {
    title: 'Progress',
    description: 'Visualize your growth over time.',
    icon: <FiBarChart2 className="text-3xl text-pink-400" />,
    path: '/dashboard',
  },
  {
    title: 'Notes',
    description: 'Capture and organize your thoughts.',
    icon: <FaNoteSticky className="text-3xl text-purple-400" />,
    path: '/notes',
  },
  
];

export const FeaturesMegaMenu = ({ isOpen, handleNav })=> {
  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed top-[64px] left-0 w-screen z-[100] bg-black/70 backdrop-blur-3xl border-t border-white/10 py-14 px-20 overflow-hidden"
          >
          <motion.div
            className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
          >
            {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  onClick={() => handleNav(feature.path)}
                  whileHover={{
                    scale: 1.06,
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.25)',
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="group cursor-pointer p-5 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-md backdrop-blur-lg hover:shadow-[0_0_20px_#00f2ff] transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="transition-transform duration-300 group-hover:rotate-6">
                      {feature.icon}
                    </span>
                    <h4 className="text-lg font-semibold text-white">{feature.title}</h4>
                  </div>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};