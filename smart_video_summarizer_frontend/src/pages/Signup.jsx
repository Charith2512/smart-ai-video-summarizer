import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, googleSignIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/');
        } catch {
            setError('Failed to create an account');
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center text-slate-800 dark:text-white relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Background Blobs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-60 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-500/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-200/40 dark:bg-pink-500/40 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-800 p-8 rounded-3xl shadow-xl ring-1 ring-slate-900/5 dark:ring-white/5 my-8 transition-colors"
            >
                <div className="text-center mb-8">
                    <span className="w-12 h-12 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                        S
                    </span>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">
                        Create Account
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors">Join Smart AI today</p>
                </div>

                {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-center text-sm font-medium animate-shake">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-medium transition-colors">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-900 dark:focus:border-white focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-slate-900 dark:caret-white"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-medium transition-colors">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-900 dark:focus:border-white focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-slate-900 dark:caret-white"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1.5 text-sm font-medium transition-colors">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-slate-900 dark:focus:border-white focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-slate-900 dark:caret-white"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-secondary py-3.5 rounded-xl font-bold text-white hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] mt-2"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="my-6 flex items-center justify-center gap-4">
                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full transition-colors"></div>
                    <span className="text-slate-400 dark:text-slate-500 text-sm font-medium transition-colors">OR</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full transition-colors"></div>
                </div>

                <button
                    onClick={async () => {
                        try {
                            setError('');
                            setLoading(true);
                            await googleSignIn();
                            navigate('/');
                        } catch {
                            setError('Failed to sign in with Google');
                        }
                        setLoading(false);
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-50 shadow-sm"
                >
                    <FaGoogle className="text-slate-500 dark:text-slate-400" /> Continue with Google
                </button>

                <div className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm transition-colors">
                    Already have an account? <Link to="/login" className="text-primary dark:text-indigo-400 font-bold hover:underline">Log In</Link>
                </div>
            </motion.div>
        </div>
    );
}
