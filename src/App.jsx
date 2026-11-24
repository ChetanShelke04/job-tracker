import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ContactsProvider } from './context/ContactsContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import FollowUps from './pages/FollowUps';
import Applications from './pages/Applications';
import ImportExport from './pages/ImportExport';
import Trash from './pages/Trash';

export default function App() {
  return (
    <AuthProvider>
      <ContactsProvider>
        <Routes>
          {/* Public login page */}
          <Route path="/login" element={<Login />} />

          {/* Protected CRM routes wrapped in modern AppLayout */}
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
            path="/contacts"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Contacts />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/follow-ups"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FollowUps />
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
            path="/import-export"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ImportExport />
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

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ContactsProvider>
    </AuthProvider>
  );
}
