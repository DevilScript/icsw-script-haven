
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { HelpCircle, Menu, X, CircleDot } from "lucide-react";
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
  const [lastScrollY, setLastScrollY] = useState(0);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [discordTag, setDiscordTag] = useState("");
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
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

  return (
    <header 
      className={`fixed w-full bg-black/30 backdrop-blur-md z-50 transition-transform duration-300 ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          {/* Brand and Navigation */}
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
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHelpDialogOpen(true)}
              className="text-gray-300 hover:text-white"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            
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

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card">
          <DialogHeader>
            <DialogTitle>Need Help?</DialogTitle>
            <DialogDescription>
              Send us a message and we'll get back to you via Discord.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!user && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discordTag" className="text-right">
                  Discord Tag
                </Label>
                <Input
                  id="discordTag"
                  placeholder="username#1234"
                  className="col-span-3"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="How can we help?"
                className="col-span-3"
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleHelpSubmit}
              className="bg-pink-transparent border border-pink-pastel hover:bg-pink-hover"
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
