import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NewLogin from "./pages/NewLogin";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Ministries from "./pages/Ministries";
import Cells from "./pages/Cells";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import DailyCash from "./pages/DailyCash";
import Uploads from "./pages/Uploads";
import Registration from "./pages/Registration";
import Institutional from "./pages/Institutional";
import Secretariat from "./pages/Secretariat";
import SuperAdmin from "./pages/SuperAdmin";
import Discipleship from "./pages/Discipleship";
import ConfirmScale from "./pages/ConfirmScale";
import NotFound from "./pages/NotFound";
import { MainLayout } from "@/components/MainLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  console.log('App: ProtectedRoute check', { isAuthenticated, userRole: user?.role });

  if (!isAuthenticated) {
    console.log('App: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <MainLayout key={window.location.pathname}>{children}</MainLayout>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  console.log('App: AppRoutes state', { isAuthenticated, userRole: user?.role, path: window.location.pathname });

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <NewLogin />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <NewLogin />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/membros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/ministerios" element={<ProtectedRoute><Ministries /></ProtectedRoute>} />
      <Route path="/celulas" element={<ProtectedRoute><Cells /></ProtectedRoute>} />
      <Route path="/discipulado" element={<ProtectedRoute><Discipleship /></ProtectedRoute>} />
      <Route path="/eventos" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/caixa-diario" element={<ProtectedRoute><DailyCash /></ProtectedRoute>} />
      <Route path="/cadastro" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/uploads" element={<ProtectedRoute><Uploads /></ProtectedRoute>} />
      <Route path="/secretaria" element={<ProtectedRoute><Secretariat /></ProtectedRoute>} />
      <Route path="/institucional" element={<ProtectedRoute><Institutional /></ProtectedRoute>} />
      <Route path="/superadmin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
      <Route path="/confirmar/:id" element={<ConfirmScale />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <div translate="no" className="min-h-screen bg-background">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </div>
);

export default App;
