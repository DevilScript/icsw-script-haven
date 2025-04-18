
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { HelpCircle, Menu, X, LogIn, History, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/auth";
import { sendDiscordWebhook } from "@/lib/webhook";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [discordTag, setDiscordTag] = useState("");
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY < 50);
      setShowNavbar(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleHelpSubmit = async () => {
    if (!helpMessage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message",
      });
      return;
    }

    try {
      await sendDiscordWebhook("Help Request", {
        "Discord Tag": user ? user.username : discordTag,
        "Message": helpMessage
      });

      toast({
        title: "Success",
        description: "Your message has been sent",
      });

      setHelpDialogOpen(false);
      setHelpMessage("");
      setDiscordTag("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    }
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Script", path: "/script" },
    { name: "Store", path: "/store" },
    { name: "Topup", path: "/topup" },
  ];

  const navbarClasses = `fixed w-full z-50 transition-all duration-300 ${
    isAtTop ? "py-4 bg-transparent" : "py-2 bg-black/40 backdrop-blur-md shadow-lg"
  } ${
    showNavbar ? "translate-y-0" : "-translate-y-full"
  }`;

  return (
    <header className={navbarClasses}>
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center">
          {/* Brand and Navigation */}
          <div className="flex items-center">
            <div className="mr-10">
              <h1 className="text-2xl font-bold">
                <span className="text-white">ICS</span>
                <span className="text-[rgb(255,179,209)] pink-glow animate-glow">W</span>
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
                        ? "text-[rgb(255,179,209)]"
                        : "text-gray-300 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              
              {user && (
                <>
                  <NavLink
                    to="/history"
                    className={({ isActive }) =>
                      `py-1 relative shine-effect ${
                        isActive
                          ? "text-[rgb(255,179,209)]"
                          : "text-gray-300 hover:text-white"
                      }`
                    }
                  >
                    <div className="flex items-center gap-1">
                      <History size={14} />
                      <span>History</span>
                    </div>
                  </NavLink>
                  
                  <NavLink
                    to="/reset-hwid"
                    className={({ isActive }) =>
                      `py-1 relative shine-effect ${
                        isActive
                          ? "text-[rgb(255,179,209)]"
                          : "text-gray-300 hover:text-white"
                      }`
                    }
                  >
                    <div className="flex items-center gap-1">
                      <Key size={14} />
                      <span>Reset-HWID</span>
                    </div>
                  </NavLink>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHelpDialogOpen(true)}
              className="text-gray-300 hover:text-white hover:bg-pink-transparent/10"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            <Button 
              asChild
              className="button-3d shine-effect bg-[#222222] hover:bg-[#2a2a2a]"
              size="sm"
            >
              <NavLink to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </NavLink>
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
              
              {user && (
                <>
                  <NavLink
                    to="/history"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md flex items-center ${
                        isActive
                          ? "bg-pink-transparent text-pink-DEFAULT"
                          : "text-gray-300 hover:text-white"
                      }`
                    }
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </NavLink>
                  
                  <NavLink
                    to="/reset-hwid"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md flex items-center ${
                        isActive
                          ? "bg-pink-transparent text-pink-DEFAULT"
                          : "text-gray-300 hover:text-white"
                      }`
                    }
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset-HWID
                  </NavLink>
                </>
              )}
              
              <Button
                variant="ghost"
                onClick={() => setHelpDialogOpen(true)}
                className="text-gray-300 hover:text-white justify-start px-4"
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                Get Help
              </Button>
              
              <Button 
                asChild
                className="mx-4 button-3d shine-effect bg-[#222222] hover:bg-[#2a2a2a]"
                size="sm"
              >
                <NavLink to="/auth" onClick={() => setIsOpen(false)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </NavLink>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="sm:max-w-[425px] help-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-pink-DEFAULT flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              Need Assistance?
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              We're here to help! Send us your question and we'll respond via Discord.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {!user && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discordTag" className="text-right text-pink-pastel">
                  Discord Tag
                </Label>
                <Input
                  id="discordTag"
                  placeholder="username#1234"
                  className="col-span-3 key-input"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right text-pink-pastel mt-2">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="How can we help you today?"
                className="col-span-3 key-input min-h-[120px]"
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleHelpSubmit}
              className="button-3d shine-effect w-full sm:w-auto"
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;
