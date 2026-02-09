import { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Theme State
    const [theme, setTheme] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
            }
        } catch (e) {
            console.error("Theme initialization error:", e);
        }
        return 'light';
    });

    // Apply theme class to document reactively
    useEffect(() => {
        try {
            const root = window.document.documentElement;

            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('theme', theme);
            }
        } catch (e) {
            console.error("Theme application error:", e);
        }
    }, [theme]);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <UIContext.Provider value={{
            isSidebarOpen,
            setIsSidebarOpen,
            toggleSidebar,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal,
            theme,
            toggleTheme
        }}>
            {children}
        </UIContext.Provider>
    );
}

export const useUI = () => useContext(UIContext);
