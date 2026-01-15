import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './lib/api';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';
import type { Project } from './types';
import MainLayout from './layouts/MainLayout';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import NewProjectModal from './components/NewProjectModal';
import ThemeEnforcer from './components/ThemeEnforcer';
import './index.css';

// Lazy Load Pages
const Landing = lazy(() => import('./pages/Landing'));
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AllProjects = lazy(() => import('./pages/AllProjects'));
const RepoDetail = lazy(() => import('./pages/RepoDetail'));
const SetupProject = lazy(() => import('./pages/SetupProject'));
const MyProjects = lazy(() => import('./pages/MyProjects'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const Help = lazy(() => import('./pages/Support').then(module => ({ default: module.Help })));
const Feedback = lazy(() => import('./pages/Support').then(module => ({ default: module.Feedback })));
const About = lazy(() => import('./pages/About'));
const History = lazy(() => import('./pages/History'));
const ContactAdmin = lazy(() => import('./pages/ContactAdmin'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageProjects = lazy(() => import('./pages/admin/ManageProjects'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageNews = lazy(() => import('./pages/admin/ManageNews'));
const AdminRepoDetail = lazy(() => import('./pages/admin/AdminRepoDetail'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminInbox = lazy(() => import('./pages/admin/AdminInbox'));
const AdminProjectOverview = lazy(() => import('./pages/admin/AdminProjectOverview'));

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    if (window.location.pathname.startsWith('/admin')) {
      return localStorage.getItem('adminToken');
    }
    return localStorage.getItem('token');
  });

  const location = window.location.pathname;

  useEffect(() => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');

    if (isAdminRoute) {
      if (token !== adminToken) {
        setToken(adminToken);
      }
    } else {
      if (token !== userToken) {
        setToken(userToken);
      }
    }
  }, [location, token]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userData = await api.get('/auth/me', token);
        setUser(userData);
      } catch (err) {
        console.error("Auth Error", err);
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
  }, [user]);

  const handleLogin = (newToken: string, newUser: any) => {
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
    sessionStorage.removeItem('intro_seen');
    setToken(null);
    setUser(null);

    if (!isAdminRoute) {
      window.location.href = '/';
    }
  };

  // Improved Fallback Loader
  const PageLoader = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <div className="text-sm text-zinc-500">Loading modules...</div>
      </div>
    </div>
  );

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
            <Suspense fallback={<PageLoader />}>
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
                  <Route path="home" element={<Home projects={projects} />} />
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
                    <Route path="*" element={<Navigate to="/?login=true" replace />} />
                  )}
                </Route>

                {!user && <Route path="/" element={<Landing onLogin={() => window.location.reload()} handleLogin={handleLogin} />} />}
              </Routes>
            </Suspense>
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