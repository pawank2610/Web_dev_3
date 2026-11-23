import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected RBAC Admin Route */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <footer
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span>ShortLink &bull; Web Dev III Capstone Project 10 (Bitly Clone)</span>
              <span>Express + Mongoose (MVC) &bull; JWT Auth &bull; React Router &bull; Aggregations</span>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
