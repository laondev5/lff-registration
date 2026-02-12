"use client";

import { useEffect, useState } from "react";

export function SuccessAnimation({ name, uniqueId }: { name: string; uniqueId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center text-center space-y-6 transition-all duration-700 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
      {/* Animated Checkmark Circle */}
      <div className="relative w-32 h-32">
        {/* Outer ring pulse */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
        
        {/* Inner ring */}
        <div className="absolute inset-2 rounded-full bg-green-500/10 animate-pulse" />
        
        {/* Main circle */}
        <svg className="relative w-32 h-32" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="4"
          />
          {/* Animated circle stroke */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#22c55e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="339.292"
            strokeDashoffset={show ? "0" : "339.292"}
            className="transition-all duration-1000 ease-out"
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
          {/* Checkmark path */}
          <path
            d="M35 62 L52 79 L85 43"
            fill="none"
            stroke="#22c55e"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="80"
            strokeDashoffset={show ? "0" : "80"}
            className="transition-all duration-700 ease-out"
            style={{ transitionDelay: '600ms' }}
          />
        </svg>
      </div>

      {/* Confetti dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][i % 6],
              top: `${20 + Math.random() * 60}%`,
              left: `${10 + Math.random() * 80}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${1.5 + Math.random()}s`,
              opacity: show ? 1 : 0,
              transition: `opacity 0.5s ease ${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Text Content */}
      <div className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Registration{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
            Successful!
          </span>
        </h2>
        <p className="text-gray-400 text-lg">
          Welcome, <span className="text-white font-semibold">{name}</span>!
        </p>
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
          <span className="text-gray-400 text-sm">Your Registration ID:</span>
          <span className="text-primary font-mono font-bold">{uniqueId}</span>
        </div>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Please save your Registration ID for reference. You will need it for check-in at the event.
        </p>
      </div>
    </div>
  );
}
