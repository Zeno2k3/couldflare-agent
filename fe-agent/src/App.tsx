import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { ChatWindow } from './components/chat/ChatWindow';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const ChatLayout: React.FC = () => {
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatCreated = (id: number) => {
    setCurrentChatId(id);
    setRefreshSidebar(prev => prev + 1); // Trigger sidebar refresh
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        key={refreshSidebar}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
      />
      <ChatWindow
        chatId={currentChatId}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
