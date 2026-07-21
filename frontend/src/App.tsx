import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';

const MainApp: React.FC = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <SocketProvider>
      <ThemeProvider>
        <ChatProvider>
          <CallProvider>
            <AppLayout />
          </CallProvider>
        </ChatProvider>
      </ThemeProvider>
    </SocketProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
