import { Routes, Route } from 'react-router-dom';
import WaveScroll3D from './components/ui/WaveScroll3D';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import InterviewSimulator from './pages/InterviewSimulator';
import Dashboard from './pages/Dashboard';
import RepoReview from './pages/RepoReview';
import StudioBuilder from './pages/StudioBuilder';
import JobMatch from './pages/JobMatch';
import CompareDashboard from './pages/CompareDashboard';
import Leaderboard from './pages/Leaderboard';
import Wrapped from './pages/Wrapped';
import MonitorDashboard from './pages/MonitorDashboard';
// Auth
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthCallback from './pages/auth/OAuthCallback';
import Profile from './pages/account/Profile';
import PaymentsAdmin from './pages/admin/PaymentsAdmin';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <WaveScroll3D />
      <Routes>
        {/* Marketing landing — standalone page with its own nav & footer */}
        <Route path="/" element={<Landing />} />

        {/* Auth pages — standalone */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Main App Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard/:username" element={<Dashboard />} />
          <Route path="/review/:username/:repo" element={<RepoReview />} />
          <Route path="/builder/:username" element={<StudioBuilder />} />
          <Route path="/match/:username" element={<JobMatch />} />
          <Route path="/compare" element={<CompareDashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/monitor"
            element={
              <ProtectedRoute>
                <MonitorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/interview/:username" element={<InterviewSimulator />} />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <PaymentsAdmin />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Full Screen Routes */}
        <Route path="/wrapped/:username" element={<Wrapped />} />
      </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
