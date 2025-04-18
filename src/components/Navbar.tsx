import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/store', label: 'Store' },
    { to: '/script', label: 'Script' },
    { to: '/support', label: 'Support' },
    ...(user
      ? [
          { to: '/profile', label: 'Profile' },
          { to: '/history', label: 'History' },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 left-0 right-0 bg-black/70 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-white">
              ICS<span className="text-pink-DEFAULT">W</span>
            </Link>
          </div>

          {isMobile ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gray-900 text-white border-gray-800">
                <div className="flex flex-col space-y-4 mt-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`text-lg ${
                        location.pathname === item.to
                          ? 'text-pink-DEFAULT'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {user ? (
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="text-white border-gray-600 hover:bg-gray-800"
                    >
                      Logout
                    </Button>
                  ) : (
                    <Link
                      to="/auth"
                      className="text-lg text-gray-300 hover:text-white"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium ${
                    location.pathname === item.to
                      ? 'text-pink-DEFAULT'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  Logout
                </Button>
              ) : (
                <Link to="/auth">
                  <Button
                    variant="outline"
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;