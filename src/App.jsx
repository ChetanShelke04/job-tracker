import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ContactsProvider } from './context/ContactsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Public Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Protected CRM & Application Pages
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import FollowUps from './pages/FollowUps';
import Applications from './pages/Applications';
import ImportExport from './pages/ImportExport';
import Trash from './pages/Trash';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <ContactsProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected General Routes (Accessible to both User & HR) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Applications />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Trash />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected HR-Specific Calling Routes */}
          <Route
            path="/contacts"
            element={
              <ProtectedRoute requiredRole="hr">
                <AppLayout>
                  <Contacts />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/follow-ups"
            element={
              <ProtectedRoute requiredRole="hr">
                <AppLayout>
                  <FollowUps />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-export"
            element={
              <ProtectedRoute requiredRole="hr">
                <AppLayout>
                  <ImportExport />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ContactsProvider>
    </AuthProvider>
  );
}
