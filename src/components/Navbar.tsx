import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo1.png';

interface NavItem {
  to: string;
  label: string;
}

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    setMobileMenuOpen(false);
    navigate('/'); 
  };

  const navItems: NavItem[] = [
    { to: '/articlelist', label: 'Articles' },
    { to: '/newarticle', label: 'Add Article' },
    { to: '/users', label: 'Users' },
    { to: '/newuser', label: 'Add User' },
    { to: '/clientlist', label: 'Clients' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-emerald-900 to-green-950 text-white shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center gap-2 group bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-emerald-800/50 hover:bg-black/30 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img 
                src={logo} 
                alt="The Plug Logo" 
                className="h-8 w-auto transition-transform group-hover:scale-105" 
              />
              <span className="font-bold text-xl tracking-wide text-white">The Plug</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                      }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/*Logout button (desktop) */}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium bg-red-700 hover:bg-red-800 text-white transition"
              >
                Logout
              </button>

            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-900 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`} 
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-green-950 border-t border-emerald-900 shadow-xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium 
                  ${isActive 
                    ? 'bg-emerald-700 text-white' 
                    : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/*Logout button (mobile) */}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-700 hover:bg-red-800 text-white transition"
          >
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
