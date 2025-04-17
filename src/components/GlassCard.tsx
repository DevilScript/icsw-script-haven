
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

const GlassCard = ({ children, className = "" }: GlassCardProps) => {
  return (
    <div className={`glass p-6 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
