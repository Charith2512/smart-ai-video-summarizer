import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, googleSignIn } = useAuth();

    // Reset state when modal opens/closes or mode changes
    useEffect(() => {
        if (!isOpen) {
            setError('');
            setLoading(false);
        }
    }, [isOpen, isLogin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setLoading(true);
            if (isLogin) {
                await login(email, password);
                if (onSuccess) onSuccess('Successfully signed in!');
            } else {
                await signup(email, password);
                if (onSuccess) onSuccess('Account created successfully!');
            }
            // Delay closing slightly to see the transition
            setTimeout(onClose, 500);
        } catch (err) {
            setError(err.message || 'Failed to authenticate');
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            if (onSuccess) onSuccess('Signed in with Google!');
            setTimeout(onClose, 500);
        } catch (err) {
            setError('Failed to sign in with Google');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-all"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5"
                    onClick={(e) => e.stopPropagation()}
                >
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="py-20 flex flex-col items-center justify-center text-center"
                            >
                                <div className="relative mb-8">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-24 h-24 rounded-3xl border-4 border-slate-900/10 dark:border-white/10"
                                    />
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 w-24 h-24 rounded-3xl border-t-4 border-slate-900 dark:border-white shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-900 dark:text-white">
                                        S
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight animate-pulse">
                                    Authenticating...
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                                    {isLogin ? 'Checking your credentials' : 'Setting up your profile'}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* Decorative Blobs */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
                                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/10 rounded-full blur-[40px] pointer-events-none" />

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors"
                                >
                                    <FaTimes />
                                </button>

                                <div className="relative z-10 text-center mb-8">
                                    <div className="w-12 h-12 bg-gradient-to-tr from-slate-800 to-slate-900 dark:from-slate-100 dark:to-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 text-2xl font-bold mx-auto mb-4 shadow-lg shadow-slate-900/20 dark:shadow-white/10">
                                        S
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                        {isLogin ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        {isLogin ? 'Sign in to continue to Smart AI' : 'Join Smart AI to unlock all features'}
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-center text-sm font-bold shadow-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-400 dark:focus:border-slate-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                            placeholder="name@example.com"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-400 dark:focus:border-slate-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                            placeholder="Password"
                                        />
                                    </div>

                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="overflow-hidden"
                                        >
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-400 dark:focus:border-slate-500 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                placeholder="Confirm Password"
                                            />
                                        </motion.div>
                                    )}

                                    <button
                                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold hover:bg-black dark:hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
                                    >
                                        {isLogin ? 'Sign In' : 'Sign Up'}
                                    </button>
                                </form>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-transparent text-slate-500 dark:text-slate-400 font-medium transition-colors">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGoogle}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md dark:shadow-white/5"
                                >
                                    <FcGoogle className="text-xl" /> Google
                                </button>

                                <div className="mt-8 text-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">
                                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                        <button
                                            onClick={() => setIsLogin(!isLogin)}
                                            className="text-slate-900 dark:text-white font-bold hover:underline transition-colors"
                                        >
                                            {isLogin ? 'Sign Up' : 'Sign In'}
                                        </button>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
