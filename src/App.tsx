import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import NotFound from "./pages/NotFound";
import { MainLayout } from "@/components/MainLayout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Index />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <NewLogin />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/membros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/ministerios" element={<ProtectedRoute><Ministries /></ProtectedRoute>} />
      <Route path="/celulas" element={<ProtectedRoute><Cells /></ProtectedRoute>} />
      <Route path="/eventos" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/caixa-diario" element={<ProtectedRoute><DailyCash /></ProtectedRoute>} />
      <Route path="/cadastro" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/uploads" element={<ProtectedRoute><Uploads /></ProtectedRoute>} />
      <Route path="/institucional" element={<ProtectedRoute><Institutional /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
