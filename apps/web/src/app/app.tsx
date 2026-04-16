import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import BoardsPage from '../pages/BoardsPage';
import BoardPage from '../pages/BoardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/boards"
        element={
          <ProtectedRoute>
            <BoardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/boards" replace />} />
    </Routes>
  );
}

export default App;
