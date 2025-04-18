
import { Instagram } from "lucide-react";
import GlassCard from "./GlassCard";

const Contributors = () => {
  return (
    <section className="py-12 flex justify-center">
      <GlassCard className="feature-card max-w-md w-full text-center hover-scale">
        <h2 className="text-2xl font-bold mb-8 relative inline-block">
          <span className="text-white">Contributors</span>
          <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
        </h2>
        
        <div className="flex flex-col items-center">
          <div className="profile-container relative w-32 h-32 mb-4 overflow-visible transform hover:scale-105 transition-all duration-300">
            <img 
              src="https://i.ibb.co/wFD7JTdb/D3-D095-EF-D0-D5-47-A1-B382-BBA57-A1-DE014.jpg" 
              alt="Mo Profile" 
              className="w-32 h-32 rounded-full object-cover z-10 relative"
            />
            <div className="profile-glow-effect"></div>
          </div>
          
          <h3 className="text-2xl font-semibold mb-2">Mo🍉</h3>
          <p className="text-gray-400 mb-4">Lead Developer</p>
          
          <a 
            href="https://www.instagram.com/mo.icsw/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-full bg-black/30 border border-pink-pastel transition-all duration-300 hover:bg-pink-transparent hover:-translate-y-1"
          >
            <Instagram size={18} className="mr-2 text-pink-DEFAULT" />
            <span>mo.icsw</span>
          </a>
        </div>
      </GlassCard>
    </section>
  );
};

export default Contributors;
