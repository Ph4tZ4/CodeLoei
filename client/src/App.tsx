import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './lib/api';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';
import type { Project } from './types';

// Layouts & Pages
import MainLayout from './layouts/MainLayout';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AllProjects from './pages/AllProjects';
import RepoDetail from './pages/RepoDetail';
import SetupProject from './pages/SetupProject';
import MyProjects from './pages/MyProjects';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import { Help, Feedback } from './pages/Support';
import About from './pages/About';
import History from './pages/History';
import ContactAdmin from './pages/ContactAdmin';
import NewsDetail from './pages/NewsDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageProjects from './pages/admin/ManageProjects';
import ManageUsers from './pages/admin/ManageUsers';
import ManageNews from './pages/admin/ManageNews';
import AdminRepoDetail from './pages/admin/AdminRepoDetail';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminInbox from './pages/admin/AdminInbox';
import AdminProjectOverview from './pages/admin/AdminProjectOverview';

// Components
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import NewProjectModal from './components/NewProjectModal';
import ThemeEnforcer from './components/ThemeEnforcer';

// Styles
import './index.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token based on current route to prevent race conditions
    if (window.location.pathname.startsWith('/admin')) {
      return localStorage.getItem('adminToken');
    }
    return localStorage.getItem('token');
  });

  // Track location to switch between Admin/User tokens
  const location = window.location.pathname;

  // Effect: Intelligence Token Switching
  useEffect(() => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');

    if (isAdminRoute) {
      // If we are on an admin route, we MUST use the admin token
      if (token !== adminToken) {
        console.log("App: Switching to Admin Context");
        setToken(adminToken);
      }
    } else {
      // If we are on a normal route, we MUST use the user token
      if (token !== userToken) {
        console.log("App: Switching to User Context");
        setToken(userToken);
      }
    }
  }, [location, token]); // Re-run when location changes (in SPA) or token changes

  // Authentication Check
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        // If no token, we are effectively guest.
        // But if we are switching contexts, we might need to clear user state
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        // Decide which endpoint to hit based on token type logic (or just hit /auth/me and let backend decide)
        // Note: Our backend /auth/me should ideally handle both, or we need separate endpoints.
        // Assuming /auth/me works for both if the token is valid.
        // BUT, for clarity, if it's an admin token, we might want to ensure we get admin data.
        const userData = await api.get('/auth/me', token);
        console.log("App: Loaded User:", userData);
        setUser(userData);
      } catch (err) {
        console.error("Auth Error", err);
        // If the current token is invalid, remove IT ONLY
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        if (isAdminRoute) {
          localStorage.removeItem('adminToken');
        } else {
          localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [token]);

  // Data Fetching
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get('/projects');
        setProjects(data);
      } catch (err) {
        console.error("Fetch Projects Error", err);
      }
    };
    fetchProjects();
  }, [user]); // Re-fetch on user change or init

  const handleLogin = (newToken: string, newUser: any) => {
    console.log("App: Handle Login:", newUser);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    if (isAdminRoute) {
      localStorage.removeItem('adminToken');
    } else {
      localStorage.removeItem('token');
    }
    sessionStorage.removeItem('intro_seen'); // Clear intro flag so it plays again on next visit
    setToken(null);
    setUser(null);

    // If it's a user logout, force a hard redirect to root to prevent 
    // the "Protected Route -> * -> /?login=true" fallback behavior.
    if (!isAdminRoute) {
      window.location.href = '/';
    }
  };



  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const refreshUser = async () => {
    if (!token) return;
    try {
      const userData = await api.get('/auth/me', token);
      setUser(userData);
    } catch (err) {
      console.error("Refresh User Error", err);
    }
  };

  const refreshProjects = async () => {
    try {
      const data = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error("Refresh Projects Error", err);
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AlertProvider>
          <BrowserRouter>
            <ThemeEnforcer />
            <Routes>
              {/* Admin Routes - Accessible independently */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route element={<ProtectedAdminRoute user={user} isLoading={loading} />}>
                <Route element={<MainLayout user={user} onLogout={handleLogout} onOpenUpload={() => setUploadOpen(true)} context={{ refreshUser, refreshProjects, user }} />}>


                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/projects/overview" element={<AdminProjectOverview />} />
                  <Route path="/admin/projects" element={<ManageProjects />} />
                  <Route path="/admin/projects/:id" element={<AdminRepoDetail />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                  <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                  <Route path="/admin/news" element={<ManageNews />} />
                  <Route path="/admin/inbox" element={<AdminInbox />} />
                </Route>
              </Route>

              {/* User & Guest Routes */}
              <Route element={<MainLayout user={user} onLogout={handleLogout} onOpenUpload={() => setUploadOpen(true)} context={{ refreshUser, refreshProjects, user }} />}>

                {/* Public / Guest Accessible */}
                <Route path="home" element={<Home projects={projects} />} />

                {/* Protected Routes (User Only) */}
                {user ? (
                  <>
                    <Route index element={<Home projects={projects} />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="projects" element={<AllProjects projects={projects} />} />
                    <Route path="my-projects" element={<MyProjects />} />
                    <Route path="projects/:id" element={<RepoDetail />} />
                    <Route path="projects/:id/setup" element={<SetupProject />} />
                    <Route path="profile" element={<Profile user={user} />} />
                    <Route path="user/:id" element={<UserProfile />} />
                    <Route path="news/:id" element={<NewsDetail />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="help" element={<Help />} />
                    <Route path="feedback" element={<Feedback />} />
                    <Route path="history" element={<History />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<ContactAdmin />} />
                  </>
                ) : (
                  <>
                    {/* Redirect any restricted guest access attempts to Landing with Login Param */}
                    <Route path="*" element={<Navigate to="/?login=true" replace />} />
                  </>
                )}
              </Route>

              {/* Fallback for root path when no user */}
              {!user && <Route path="/" element={<Landing onLogin={() => window.location.reload()} handleLogin={handleLogin} />} />}
            </Routes>
            <NewProjectModal
              isOpen={isUploadOpen}
              onClose={() => setUploadOpen(false)}
              user={user}
            />
          </BrowserRouter>
        </AlertProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;