import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

export default function LoginPage({ setIsAuthenticated }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
        toast.error("Please fill in all fields.");
        return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }
      toast.success("Login successful!");
      setIsAuthenticated(true);
      setTimeout(() => {
        navigate('/options');
      }, 1000);
    } catch (err) {
        toast.error("Something went wrong. Try again.",err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 px-4">
      <ToastContainer position="top-right" />
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-10 space-y-6 max-w-md w-full transition-all"
      >
        <h2 className="text-3xl font-bold text-blue-600 dark:text-white text-center">Log In</h2>

      {/* Email Input */}
      <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter Your Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Password Input with Eye Toggle */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter Your Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-gray-600 dark:text-gray-300"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Forgot Password */}
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-blue-500 hover:underline dark:text-blue-400">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
        >
          Log In
        </button>

        {/* Switch to Signup */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link to="/signup" className="text-blue-600 hover:underline dark:text-blue-400">
            Don’t have an account?
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
