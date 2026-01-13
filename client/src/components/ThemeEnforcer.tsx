import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ThemeEnforcer = () => {
    const location = useLocation();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (location.pathname.startsWith('/admin')) {
            setTheme('dark');
        }
    }, [location, setTheme]);

    return null;
};

export default ThemeEnforcer;
