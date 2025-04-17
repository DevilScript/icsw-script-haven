
import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-md py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">
              <span className="text-white">ICS</span>
              <span className="text-pink-DEFAULT animate-glow">W</span>
            </h2>
            <p className="text-gray-400 text-sm">Script Haven © {new Date().getFullYear()}</p>
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="https://discord.gg/3CFe4KBks2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Discord
            </a>
            <a 
              href="/support" 
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Support
            </a>
            <a 
              href="/script" 
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Scripts
            </a>
            <a 
              href="/store" 
              className="text-gray-400 hover:text-white transition-colors duration-300"
            >
              Store
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
