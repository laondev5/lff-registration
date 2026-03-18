"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "2348112539058"; // International format (234 = Nigeria)
const MESSAGE = encodeURIComponent(
  "Hello! I need help with my GAC26 registration. My Registration ID is: "
);

export function WhatsAppButton() {
  const pathname = usePathname();

  // Hide on admin / subadmin pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/subadmin")) {
    return null;
  }

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-4 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 group"
      style={{ boxShadow: "0 4px 24px rgba(37,211,102,0.5)" }}
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-6 h-6 flex-shrink-0"
        fill="currentColor"
      >
        <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.363.627 4.677 1.817 6.703L2.667 29.333l6.803-1.787A13.28 13.28 0 0 0 16.003 29.333c7.363 0 13.33-5.97 13.33-13.333S23.366 2.667 16.003 2.667zm0 24A11.61 11.61 0 0 1 10.1 25.1l-.42-.25-4.037 1.057 1.077-3.93-.273-.44A11.597 11.597 0 0 1 4.333 16c0-6.43 5.237-11.667 11.67-11.667S27.667 9.57 27.667 16 22.433 27.667 16.003 27.667zm6.39-8.71c-.35-.177-2.073-1.023-2.393-1.14-.32-.117-.553-.177-.787.177s-.903 1.14-1.107 1.373-.407.267-.757.09c-.35-.177-1.477-.547-2.813-1.74-1.04-.927-1.743-2.073-1.947-2.423-.203-.35-.022-.54.153-.713.157-.157.35-.41.527-.613.177-.203.233-.35.35-.583.117-.233.06-.437-.03-.613-.09-.177-.787-1.9-1.077-2.6-.283-.683-.573-.59-.787-.6-.203-.01-.437-.013-.67-.013s-.61.09-.93.437c-.32.35-1.22 1.193-1.22 2.907s1.25 3.373 1.423 3.607c.177.233 2.46 3.757 5.963 5.27.833.36 1.483.573 1.99.733.837.267 1.597.23 2.2.14.67-.1 2.073-.847 2.367-1.663.293-.817.293-1.517.203-1.663-.087-.147-.32-.233-.67-.41z" />
      </svg>
      <span className="text-sm whitespace-nowrap">
        WhatsApp Support
      </span>
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-30 pointer-events-none" />
    </a>
  );
}
