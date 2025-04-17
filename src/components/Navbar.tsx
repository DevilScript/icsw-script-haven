
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CircleDot, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Script", path: "/script" },
    { name: "Store", path: "/store" },
    { name: "Support", path: "/support" },
    { name: "Topup", path: "/topup" },
    { name: "Profile", path: "/profile" },
  ];

  return (
    <header className="bg-black/30 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-10">
              <h1 className="text-2xl font-bold">
                <span className="text-white">ICS</span>
                <span className="text-pink-DEFAULT animate-glow">W</span>
              </h1>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></div>
            </div>
            
            <div className="hidden md:flex space-x-8 items-center">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `py-1 relative shine-effect ${
                      isActive
                        ? "text-pink-DEFAULT"
                        : "text-gray-300 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-DEFAULT animate-expand-width"></span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center rounded-full px-3 py-1 bg-black/40 border border-gray-700">
              <span className="text-sm mr-2">Status:</span>
              <span className="text-sm text-green-400">Online</span>
              <CircleDot size={14} className="text-green-400 ml-1 animate-pulse" />
            </div>
            
            <Button 
              asChild
              variant="outline" 
              size="sm"
              className="bg-pink-transparent border-pink-pastel hover:bg-pink-hover hover:text-white transition-all duration-300 hover-scale"
            >
              <a 
                href="https://discord.gg/3CFe4KBks2" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Join Discord
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-white"
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md ${
                      isActive
                        ? "bg-pink-transparent text-pink-DEFAULT"
                        : "text-gray-300 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              
              <div className="flex items-center px-4 py-2">
                <span className="text-sm mr-2">Status:</span>
                <span className="text-sm text-green-400">Online</span>
                <CircleDot size={14} className="text-green-400 ml-1 animate-pulse" />
              </div>
              
              <Button 
                asChild
                variant="outline" 
                size="sm"
                className="mx-4 bg-pink-transparent border-pink-pastel hover:bg-pink-hover hover:text-white transition-all duration-300"
              >
                <a 
                  href="https://discord.gg/3CFe4KBks2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Join Discord
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
