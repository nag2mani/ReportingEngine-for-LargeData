// Layout Component - provides consistent page structure with header, navigation, user info, and responsive mobile menu
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-2xl font-bold text-primary-600"
              >
                Reporting Engine
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-600">
                <span className="font-medium">{user?.name || 'User'}</span>
                {user?.role && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">{user.role.replace('_', ' ')}</span>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 border-t border-gray-200">
              <div className="px-4 space-y-2">
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{user?.name || 'User'}</div>
                  {user?.role && (
                    <div className="text-gray-500">{user.role.replace('_', ' ')}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
