import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { LocalAuthProvider, useLocalAuth } from '@/lib/LocalAuthContext';
import LocalLogin from '@/pages/LocalLogin';
import Home from '@/pages/Home';
import NewService from '@/pages/NewService';
import ServiceDetails from '@/pages/ServiceDetails';
import History from '@/pages/History';
import Settings from '@/pages/Settings';
import Installations from '@/pages/Installations';
import Lancamentos from '@/pages/Lancamentos';

const AppRoutes = () => {
  const { currentUser, loading } = useLocalAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LocalLogin />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new-service" element={<NewService />} />
      <Route path="/service/:id" element={<ServiceDetails />} />
      <Route path="/history" element={<History />} />
      <Route path="/installations" element={<Installations />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/lancamentos" element={<Lancamentos />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LocalAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </LocalAuthProvider>
  )
}

export default App