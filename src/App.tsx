import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NewLogin from "./pages/NewLogin";
import Landing from "./pages/Landing";
import Checkout from "./pages/Checkout";
import HotmartSuccess from "./pages/HotmartSuccess";
import ConfirmScale from "./pages/ConfirmScale";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { MainLayout } from "@/components/MainLayout";
import { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Ministries = lazy(() => import("./pages/Ministries"));
const Cells = lazy(() => import("./pages/Cells"));
const Events = lazy(() => import("./pages/Events"));
const Reports = lazy(() => import("./pages/Reports"));
const DailyCash = lazy(() => import("./pages/DailyCash"));
const Uploads = lazy(() => import("./pages/Uploads"));
const Registration = lazy(() => import("./pages/Registration"));
const Institutional = lazy(() => import("./pages/Institutional"));
const Secretariat = lazy(() => import("./pages/Secretariat"));
const Broadcasts = lazy(() => import("./pages/Broadcasts"));
const ReadingPlans = lazy(() => import("./pages/ReadingPlans"));
const PrayerRequests = lazy(() => import("./pages/PrayerRequests"));
const SocialLinks = lazy(() => import("./pages/SocialLinks"));
const PixDonations = lazy(() => import("./pages/PixDonations"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Discipleship = lazy(() => import("./pages/Discipleship"));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout key={window.location.pathname}>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </MainLayout>
  );
}

function RoleProtectedRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout key={window.location.pathname}>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </MainLayout>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/checkout" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Checkout />} />
      <Route path="/hotmart-success" element={<HotmartSuccess />} />
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
      <Route path="/secretaria" element={<RoleProtectedRoute roles={['admin', 'pastor', 'secretario', 'superadmin']}><Secretariat /></RoleProtectedRoute>} />
      <Route path="/boletins" element={<RoleProtectedRoute roles={['admin', 'pastor', 'secretario', 'superadmin']}><Broadcasts /></RoleProtectedRoute>} />
      <Route path="/planos-leitura" element={<ProtectedRoute><ReadingPlans /></ProtectedRoute>} />
      <Route path="/solicitacoes-oracao" element={<ProtectedRoute><PrayerRequests /></ProtectedRoute>} />
      <Route path="/redes-sociais" element={<ProtectedRoute><SocialLinks /></ProtectedRoute>} />
      <Route path="/pix-donacoes" element={<ProtectedRoute><PixDonations /></ProtectedRoute>} />
      <Route path="/institucional" element={<ProtectedRoute><Institutional /></ProtectedRoute>} />
      <Route path="/superadmin" element={<RoleProtectedRoute roles={['superadmin']}><SuperAdmin /></RoleProtectedRoute>} />
      <Route path="/confirmar/:id" element={<ConfirmScale />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <div
      translate="no"
      className="min-h-screen bg-background"
      style={{ minHeight: '100vh' }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <TooltipProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <AppRoutes />
              </AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
}

export default App;
