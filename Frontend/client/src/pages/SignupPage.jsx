import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SignupPage() {
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password || !form.username) {
            toast.error("Please fill in all fields.");
            return;
        }
        try {
        const res = await fetch("http://localhost:5000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name: form.username, email: form.email, password: form.password })
        });

        const data = await res.json();
        if (!res.ok) {
            toast.error(data.message || "SignUp failed");
            return
        }

        toast.success("SignUp successful!");
        setTimeout(() => {
            navigate('/topic');
        }, 1000);
        } catch (err) {
        console.error("Signup failed", err);
        }
    };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-8 sm:p-10 space-y-6 transition-all"
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400">
          Create your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Your Name
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-800 dark:text-white"
              placeholder="Enter Your Name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-800 dark:text-white"
              placeholder="Enter Your Email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none dark:bg-gray-800 dark:text-white"
                placeholder="Enter your Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
          >
            Sign Up
          </button>
        </form>

        {/* Link to login */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            to="/login"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Already have an account?
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
