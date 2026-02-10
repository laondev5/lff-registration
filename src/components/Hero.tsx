"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Make sure to register plugins if needed, but for simple animations core is enough
// gsap.registerPlugin(useGSAP); // usage depends on version, let's stick to useEffect for safety if @gsap/react isn't installed

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(subtitleRef.current, {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      })
      .from(titleRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.5)",
      }, "-=0.5")
      .from(yearRef.current, {
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.8");

      // Micro-interaction on hover
      if (titleRef.current) {
         titleRef.current.addEventListener('mouseenter', () => {
           gsap.to(titleRef.current, { scale: 1.05, duration: 0.3 });
         });
         titleRef.current.addEventListener('mouseleave', () => {
           gsap.to(titleRef.current, { scale: 1, duration: 0.3 });
         });
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[60vh] flex flex-col items-center justify-center text-center p-8 overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
      {/* Background Elements could go here */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

      <div className="z-10 space-y-6 max-w-4xl">
        <p ref={subtitleRef} className="text-xl md:text-2xl text-gray-400 font-medium tracking-wide">
          Welcome to LFF GAC 2026
        </p>
        
        <h1 ref={titleRef} className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            EBENEZER
          </span>
        </h1>

        <div className="flex flex-col items-center space-y-2">
            <span ref={yearRef} className="text-primary text-xl font-bold uppercase tracking-[0.2em]">
                Celebrating 40 Years of Grace, Growth, and Glory
            </span>
        </div>
      </div>
    </div>
  );
}
