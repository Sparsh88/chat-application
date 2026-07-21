import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // In production: use VITE_BACKEND_URL env variable (Render backend URL)
    // In development: use localhost:5000
    const socketUri = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const newSocket = io(socketUri, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('user_login', {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        avatar: currentUser.avatar,
        publicKey: currentUser.publicKey
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentUser.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
