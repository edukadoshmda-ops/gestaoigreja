import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatProvider } from "@/hooks/useChat";
import NewLogin from "./pages/NewLogin";
import CadastroIgrejaTrial from "./pages/CadastroIgrejaTrial";
import Landing from "./pages/Landing";
import Checkout from "./pages/Checkout";
import HotmartSuccess from "./pages/HotmartSuccess";
import ConfirmScale from "./pages/ConfirmScale";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Assets from "./pages/Assets";
import { MainLayout } from "@/components/MainLayout";
import { InstallPrompt } from "@/components/InstallPrompt";
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
const LeadershipAccess = lazy(() => import("./pages/LeadershipAccess"));
const ChurchNetwork = lazy(() => import("./pages/ChurchNetwork"));
const ReadingPlans = lazy(() => import("./pages/ReadingPlans"));
const PrayerRequests = lazy(() => import("./pages/PrayerRequests"));
const SocialLinks = lazy(() => import("./pages/SocialLinks"));
const PixDonations = lazy(() => import("./pages/PixDonations"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const ComoAcessar = lazy(() => import("./pages/ComoAcessar"));
const Schools = lazy(() => import("./pages/Schools"));
const Discipleship = lazy(() => import("./pages/Discipleship"));
const Blog = lazy(() => import("./pages/Blog"));
const Artigo = lazy(() => import("./pages/Artigo"));
const Consolidacao = lazy(() => import("./pages/Consolidacao"));
const Chat = lazy(() => import("./pages/Chat"));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
      gcTime: 1000 * 60 * 30, // 30 minutos em memória
      refetchOnWindowFocus: false, // Não refazer fetch ao trocar de aba
      refetchOnMount: false, // Reutiliza cache se ainda válido
      refetchOnReconnect: false, // Evita rajada ao reconectar
      retry: 1, // Limita tentativas em caso de erro
    },
  },
});

import { hasProfileCompleted } from '@/lib/profileCompletion';

/** Membro/congregado deve ir para cadastro na primeira vez. Trial: primeira tela = Institucional */
function getPostLoginPath(user: { role?: string; registrationCompleted?: boolean; id?: string } | null): string {
  if (!user) return '/dashboard';
  try {
    if (sessionStorage.getItem('redirect_to_institucional') === '1') {
      sessionStorage.removeItem('redirect_to_institucional');
      return '/institucional';
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

import { useTenant, TenantProvider } from "@/hooks/useTenant";

function AppRoutes() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const { loading: tenantLoading, isMainDomain } = useTenant();
  const postLoginPath = getPostLoginPath(user);

  const isGlobalLoading = authLoading || tenantLoading;

  if (isGlobalLoading && (window.location.pathname === '/' || window.location.pathname === '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <InstallPrompt />
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to={postLoginPath} replace />
            ) : isMainDomain ? (
              <Landing />
            ) : (
              <NewLogin />
            )
          } 
        />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/hotmart-success" element={<HotmartSuccess />} />
        <Route path="/cadastro-igreja-trial" element={<CadastroIgrejaTrial />} />
        <Route path="/blog" element={<Suspense fallback={<PageFallback />}><Blog /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<PageFallback />}><Artigo /></Suspense>} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/login/:slug" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/igreja/:slug" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/entrar" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/entrar/:slug" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/app" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/app/:slug" element={isAuthenticated ? <Navigate to={postLoginPath} replace /> : <NewLogin />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/membros" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'lider_celula', 'lider_ministerio', 'superadmin']}><Members /></RoleProtectedRoute>} />
        <Route path="/consolidacao" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'lider_celula', 'lider_ministerio', 'superadmin']}><Consolidacao /></RoleProtectedRoute>} />
        <Route path="/celulas" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Cells /></RoleProtectedRoute>} />
        <Route path="/ministerios" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Ministries /></RoleProtectedRoute>} />
        <Route path="/eventos" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin']}><Events /></RoleProtectedRoute>} />
        <Route path="/patrimonio" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'superadmin', 'diretor_patrimonio', 'tesoureiro']}><Assets /></RoleProtectedRoute>} />
        <Route path="/caixa-diario" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'tesoureiro', 'superadmin']}><DailyCash /></RoleProtectedRoute>} />
        <Route path="/financeiro" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'tesoureiro', 'superadmin']}><DailyCash /></RoleProtectedRoute>} />
        <Route path="/gestao-financeira" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'tesoureiro', 'superadmin']}><DailyCash /></RoleProtectedRoute>} />
        <Route path="/cadastro" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
        <Route path="/relatorios" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'lider_ministerio', 'superadmin']}><Reports /></RoleProtectedRoute>} />
        <Route path="/uploads" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin']}><Uploads /></RoleProtectedRoute>} />
        <Route path="/secretaria" element={<RoleProtectedRoute roles={['pastor', 'pastor_admin', 'secretario', 'superadmin']}><Secretariat /></RoleProtectedRoute>} />
        <Route path="/boletins" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin']}><Broadcasts /></RoleProtectedRoute>} />
        <Route path="/planos-leitura" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin']}><ReadingPlans /></RoleProtectedRoute>} />
        <Route path="/solicitacoes-oracao" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><PrayerRequests /></RoleProtectedRoute>} />
        <Route path="/redes-sociais" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin']}><SocialLinks /></RoleProtectedRoute>} />
        <Route path="/pix-donacoes" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><PixDonations /></RoleProtectedRoute>} />
        <Route path="/institucional" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Institutional /></RoleProtectedRoute>} />
        <Route path="/privacidade" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Privacy /></RoleProtectedRoute>} />
        <Route path="/como-acessar" element={<ProtectedRoute><ComoAcessar /></ProtectedRoute>} />
        <Route path="/pastores" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin']}><Pastors /></RoleProtectedRoute>} />
        <Route path="/escolas" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Schools /></RoleProtectedRoute>} />
        <Route path="/discipulado" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Discipleship /></RoleProtectedRoute>} />
        <Route path="/superadmin" element={<RoleProtectedRoute roles={['superadmin']}><SuperAdmin /></RoleProtectedRoute>} />
        <Route path="/rede" element={<RoleProtectedRoute roles={['pastor_admin', 'superadmin']}><ChurchNetwork /></RoleProtectedRoute>} />
        <Route path="/acessos" element={<RoleProtectedRoute roles={['admin', 'pastor', 'superadmin', 'pastor_admin']}><LeadershipAccess /></RoleProtectedRoute>} />
        <Route path="/chat" element={<RoleProtectedRoute roles={['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio']}><Chat /></RoleProtectedRoute>} />
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
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <TenantProvider>
            <ThemeProvider>
              <TooltipProvider>
                <AuthProvider>
                  <ChatProvider>
                    <Toaster />
                    <Sonner />
                    <AppRoutes />
                  </ChatProvider>
                </AuthProvider>
              </TooltipProvider>
            </ThemeProvider>
          </TenantProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </div>
  );
}

export default App;
