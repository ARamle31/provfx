import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import useStore from './store/useStore';

// Protected Route Wrapper
const Protected = ({ children }) => {
  const { isAuth, isLoading } = useStore();
  if (isLoading) return <div className="h-screen w-screen bg-bgBase flex items-center justify-center"><div className="w-10 h-10 border-4 border-glassBorder border-t-mainAccent rounded-full animate-spin"></div></div>;
  if (!isAuth) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const initAuth = useStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/editor" element={<Protected><Editor /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
