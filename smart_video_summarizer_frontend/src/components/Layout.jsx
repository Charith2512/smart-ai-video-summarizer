import { useEffect } from 'react';
import { useUI } from '../context/UIContext';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
    const { isSidebarOpen, setIsSidebarOpen, isAuthModalOpen, closeAuthModal, openAuthModal } = useUI();
    const { currentUser } = useAuth();
    const location = useLocation();

    // Sidebars should handle their own visibility on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsSidebarOpen]);

    // Only show sidebar if user is logged in
    const showSidebar = currentUser;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {showSidebar && (
                <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />
            )}

            <div
                className="flex-1 flex flex-col transition-all duration-300"
            >
                <Navbar onOpenAuth={openAuthModal} />

                <main className="flex-1 w-full max-w-[1600px] mx-auto overflow-y-auto">
                    {children}
                </main>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
        </div>
    );
}
