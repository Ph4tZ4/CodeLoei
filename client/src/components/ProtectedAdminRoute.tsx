import { Navigate, useLocation, Outlet } from 'react-router-dom';

interface ProtectedAdminRouteProps {
    user: any;
    isLoading: boolean;
}

const ProtectedAdminRoute = ({ user, isLoading }: ProtectedAdminRouteProps) => {
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    }

    // Check if user is logged in AND is an admin
    if (!user || user.role !== 'admin') {
        // Redirect to admin login, preserving the intended destination
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedAdminRoute;
