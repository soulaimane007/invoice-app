import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import DeveloperLayout from './components/layout/DeveloperLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ArticlesPage from './pages/ArticlesPage';
import DevisPage from './pages/DevisPage';
import DevisFormPage from './pages/DevisFormPage';
import DevisDetailPage from './pages/DevisDetailPage';
import FacturePage from './pages/FacturePage';
import FactureFormPage from './pages/FactureFormPage';
import FactureDetailPage from './pages/FactureDetailPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateEditorPage from './pages/TemplateEditorPage';
import OrganizationsPage from './pages/OrganizationsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import PlaceholderPage from './pages/PlaceholderPage';

function AuthenticatedApp() {
  const { user } = useAuth();

  if (user?.role === 'developer') {
    return (
      <Routes>
        <Route element={<DeveloperLayout />}>
          <Route path="/" element={<OrganizationsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="*" element={<OrganizationsPage />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/devis" element={<DevisPage />} />
        <Route path="/devis/new" element={<DevisFormPage />} />
        <Route path="/devis/:id" element={<DevisDetailPage />} />
        <Route path="/devis/:id/edit" element={<DevisFormPage />} />
        <Route path="/factures" element={<FacturePage />} />
        <Route path="/factures/new" element={<FactureFormPage />} />
        <Route path="/factures/:id" element={<FactureDetailPage />} />
        <Route path="/factures/:id/edit" element={<FactureFormPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {user?.role === 'organization' && <Route path="/users" element={<UsersPage />} />}
        {user?.role === 'organization' && <Route path="/templates" element={<TemplatesPage />} />}
        {user?.role === 'organization' && <Route path="/templates/new" element={<TemplateEditorPage />} />}
        {user?.role === 'organization' && <Route path="/templates/:id/edit" element={<TemplateEditorPage />} />}
        {user?.role === 'organization' && <Route path="/audit-logs" element={<AuditLogsPage />} />}
        <Route path="*" element={<PlaceholderPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/*" element={<AuthenticatedApp />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  );
}