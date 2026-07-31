import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FileText, FileSpreadsheet, Package, Users, User, LogOut, Menu, X, UserCog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/factures', label: t('nav.factures'), icon: FileText },
    { to: '/devis', label: t('nav.devis'), icon: FileSpreadsheet },
    { to: '/articles', label: t('nav.articles'), icon: Package },
    { to: '/clients', label: t('nav.clients'), icon: Users },
    ...(user?.role === 'organization' ? [{ to: '/users', label: 'Users', icon: UserCog }] : []),
  ];

  return (
    <div className="flex h-screen bg-noir-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-30 w-64 transform bg-noir-900 text-noir-300 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-lg font-semibold tracking-wide text-gold-300">{t('common.appName')}</span>
          <button className="-m-2 p-2 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-gold-600 text-white' : 'text-noir-300 hover:bg-noir-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-noir-800 p-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-gold-600 text-white' : 'text-noir-300 hover:bg-noir-800 hover:text-white'
              }`
            }
          >
            <User size={18} />
            {user?.name ?? t('nav.profile')}
          </NavLink>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-noir-300 transition-colors hover:bg-noir-800 hover:text-white"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-noir-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="-m-2 p-2" aria-label={t('common.actions')}>
            <Menu size={22} />
          </button>
          <span className="font-semibold text-noir-900">{t('common.appName')}</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}