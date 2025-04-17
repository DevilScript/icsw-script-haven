
import { Instagram } from "lucide-react";
import GlassCard from "./GlassCard";

const Contributors = () => {
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8">
        <span className="relative">
          Contributors
          <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
        </span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <GlassCard className="flex flex-col items-center text-center transform hover:translate-y-[-5px] transition-transform duration-300">
          <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-pink-pastel">
            <img 
              src="https://i.pravatar.cc/200" 
              alt="Mo Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold mb-1">Mo🍉</h3>
          <p className="text-gray-400 mb-4">Lead Developer</p>
          <a 
            href="https://www.instagram.com/mo.icsw/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-pink-DEFAULT hover:text-pink-hover flex items-center transition-colors duration-300"
          >
            <Instagram size={18} className="mr-1" />
            <span>mo.icsw</span>
          </a>
        </GlassCard>
      </div>
    </section>
  );
};

export default Contributors;
