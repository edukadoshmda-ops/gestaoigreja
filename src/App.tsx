import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NewLogin from "./pages/NewLogin";
import CadastroIgrejaTrial from "./pages/CadastroIgrejaTrial";
import Landing from "./pages/Landing";
import HotmartSuccess from "./pages/HotmartSuccess";
import ConfirmScale from "./pages/ConfirmScale";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Assets from "./pages/Assets";
import { InstallPWA } from "@/components/InstallPWA";
import { MainLayout } from "@/components/MainLayout";
import { SubscriptionBlock } from "@/components/SubscriptionBlock";
import { TrialGate } from "@/components/TrialGate";
import { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Cells = lazy(() => import("./pages/Cells"));
const Events = lazy(() => import("./pages/Events"));
const Reports = lazy(() => import("./pages/Reports"));
const Ministries = lazy(() => import("./pages/Ministries"));
const DailyCash = lazy(() => import("./pages/DailyCash"));
const Uploads = lazy(() => import("./pages/Uploads"));
const Registration = lazy(() => import("./pages/Registration"));
const Institutional = lazy(() => import("./pages/Institutional"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pastors = lazy(() => import("./pages/Pastors"));
const Secretariat = lazy(() => import("./pages/Secretariat"));
const Broadcasts = lazy(() => import("./pages/Broadcasts"));
const ReadingPlans = lazy(() => import("./pages/ReadingPlans"));
const PrayerRequests = lazy(() => import("./pages/PrayerRequests"));
const SocialLinks = lazy(() => import("./pages/SocialLinks"));
const PixDonations = lazy(() => import("./pages/PixDonations"));
const AtivarPagamentos = lazy(() => import("./pages/AtivarPagamentos"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const ComoAcessar = lazy(() => import("./pages/ComoAcessar"));
const Schools = lazy(() => import("./pages/Schools"));
const Discipleship = lazy(() => import("./pages/Discipleship"));
const Blog = lazy(() => import("./pages/Blog"));
const Artigo = lazy(() => import("./pages/Artigo"));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

import { hasProfileCompleted } from '@/lib/profileCompletion';

/** Membro/congregado deve ir para cadastro na primeira vez. Trial: primeira tela = Institucional */
function getPostLoginPath(user: { role?: string; registrationCompleted?: boolean; id?: string } | null): string {
  if (!user) return '/dashboard';
  try {
    if (sessionStorage.getItem('redirect_to_institucional') === '1') {
      sessionStorage.removeItem('redirect_to_institucional');
      return '/institucional';
    }
    if (sessionStorage.getItem('redirect_to_ativar_pagamentos') === '1') {
      sessionStorage.removeItem('redirect_to_ativar_pagamentos');
      return '/ativar-pagamentos';
    }
  } catch {}
  const isMemberOrCongregado = user.role === 'membro' || user.role === 'congregado';
  const hasCompleted = user.registrationCompleted === true || (user.id ? hasProfileCompleted(user.id) : false);
  if (isMemberOrCongregado && !hasCompleted) return '/cadastro';
  return '/dashboard';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Membro ou congregado: redirecionar para cadastro na primeira vez (somente uma vez)
  const hasCompleted = user?.registrationCompleted === true || (user?.id ? hasProfileCompleted(user.id) : false);
  const needsProfile = user && (user.role === 'membro' || user.role === 'congregado') && !hasCompleted;
  if (needsProfile && location.pathname !== '/cadastro') {
    return <Navigate to="/cadastro" replace />;
  }

  // Tesoureiro: acesso somente a Dashboard, Caixa Diário e Como Acessar (via Dashboard)
  const tesoureiroOnlyPaths = ['/dashboard', '/caixa-diario', '/como-acessar', '/discipulado'];
  if (user?.role === 'tesoureiro' && !tesoureiroOnlyPaths.includes(location.pathname)) {
    return <Navigate to="/caixa-diario" replace />;
  }

  // Líder de célula: acesso somente a Dashboard, Células e páginas acessíveis via Dashboard
  const liderCelulaOnlyPaths = ['/dashboard', '/celulas', '/escolas', '/discipulado', '/institucional', '/pastores', '/privacidade', '/como-acessar'];
  if (user?.role === 'lider_celula' && !liderCelulaOnlyPaths.includes(location.pathname)) {
    return <Navigate to="/celulas" replace />;
  }

  return (
    <TrialGate>
      <SubscriptionBlock>
        <MainLayout key={window.location.pathname}>
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </MainLayout>
      </SubscriptionBlock>
    </TrialGate>
  );
}

function RoleProtectedRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { isAuthenticated, user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <TrialGate>
      <SubscriptionBlock>
        <MainLayout key={window.location.pathname}>
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </MainLayout>
      </SubscriptionBlock>
    </TrialGate>
  );
}

function AppRoutes() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const postLoginPath = getPostLoginPath(user);

  if (authLoading && (window.location.pathname === '/' || window.location.pathname === '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <InstallPWA />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <Landing />} />
        <Route path="/checkout" element={<Navigate to="/" replace />} />
        <Route path="/hotmart-success" element={<HotmartSuccess />} />
        <Route path="/cadastro-igreja-trial" element={<CadastroIgrejaTrial />} />
        <Route path="/blog" element={<Suspense fallback={<PageFallback />}><Blog /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<PageFallback />}><Artigo /></Suspense>} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/membros" element={<RoleProtectedRoute roles={['pastor', 'secretario', 'superadmin']}><Members /></RoleProtectedRoute>} />
        <Route path="/celulas" element={<ProtectedRoute><Cells /></ProtectedRoute>} />
        <Route path="/ministerios" element={<ProtectedRoute><Ministries /></ProtectedRoute>} />
        <Route path="/eventos" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/patrimonio" element={<RoleProtectedRoute roles={['admin', 'pastor', 'superadmin', 'diretor_patrimonio']}><Assets /></RoleProtectedRoute>} />
        <Route path="/caixa-diario" element={<RoleProtectedRoute roles={['pastor', 'tesoureiro', 'superadmin']}><DailyCash /></RoleProtectedRoute>} />
        <Route path="/cadastro" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/uploads" element={<ProtectedRoute><Uploads /></ProtectedRoute>} />
        <Route path="/secretaria" element={<RoleProtectedRoute roles={['pastor', 'secretario', 'superadmin']}><Secretariat /></RoleProtectedRoute>} />
        <Route path="/boletins" element={<ProtectedRoute><Broadcasts /></ProtectedRoute>} />
        <Route path="/planos-leitura" element={<ProtectedRoute><ReadingPlans /></ProtectedRoute>} />
        <Route path="/solicitacoes-oracao" element={<ProtectedRoute><PrayerRequests /></ProtectedRoute>} />
        <Route path="/redes-sociais" element={<ProtectedRoute><SocialLinks /></ProtectedRoute>} />
        <Route path="/pix-donacoes" element={<ProtectedRoute><PixDonations /></ProtectedRoute>} />
        <Route path="/ativar-pagamentos" element={<ProtectedRoute><AtivarPagamentos /></ProtectedRoute>} />
        <Route path="/dashboard/pagamentos" element={<ProtectedRoute><AtivarPagamentos /></ProtectedRoute>} />
        <Route path="/institucional" element={<ProtectedRoute><Institutional /></ProtectedRoute>} />
        <Route path="/privacidade" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="/como-acessar" element={<ProtectedRoute><ComoAcessar /></ProtectedRoute>} />
        <Route path="/pastores" element={<ProtectedRoute><Pastors /></ProtectedRoute>} />
        <Route path="/escolas" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
        <Route path="/discipulado" element={<ProtectedRoute><Discipleship /></ProtectedRoute>} />
        <Route path="/superadmin" element={<RoleProtectedRoute roles={['superadmin']}><SuperAdmin /></RoleProtectedRoute>} />
        <Route path="/confirmar/:id" element={<ConfirmScale />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
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
