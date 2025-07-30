// src/components/Footer.jsx
const Footer = () => {
    return (
      <footer className="w-full mt-auto px-4 py-1 bg-blue-50 dark:bg-gray-900 text-center text-blue-600 border-blue-100 dark:text-gray-400 text-xs shadow-inner">
        <p className="text-sm">
          © {new Date().getFullYear()} ChatApp. Built with ❤️ for learners.
        </p>
      </footer>
    );
  };
  
export default Footer;
  