// src/components/Layout.jsx
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './common/BottomNav';
import { Toaster } from 'sonner';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const positionsRef = useRef({});
  const prevPathRef = useRef(pathname);

  const stored = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null;
  const shouldBeDark = stored === null ? true : stored !== 'false';

  // Apply immediately to avoid a flash of light mode
  if (typeof document !== 'undefined') {
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  useEffect(() => {
    if (shouldBeDark && stored === null) {
      localStorage.setItem('darkMode', 'true');
    }
  }, [shouldBeDark, stored]);

  // Preserve scroll position per route
  useEffect(() => {
    const prevPath = prevPathRef.current;
    positionsRef.current[prevPath] = typeof window !== 'undefined' ? window.scrollY : 0;
    const y = positionsRef.current[pathname] ?? 0;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: y, behavior: 'auto' });
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <style>{`
        :root {
          --primary: #d97706;
          --primary-dark: #b45309;
          --bg-dark: #0a1224;
          --card-dark: #0f1b33;
          --muted-dark: #1c2a45;
          --text-dark: #e7eefc;
        }
        body {
          background-color: #f5f5f4;
          color: #1f2937;
        }
        .dark { color-scheme: dark; }
        .dark body { background-color: var(--bg-dark); color: var(--text-dark); }
        .dark .bg-stone-50 { background-color: var(--bg-dark); }
        .dark .bg-white { background-color: var(--card-dark); }
        .dark .text-stone-900 { color: var(--text-dark); }
        .dark .text-stone-800 { color: var(--text-dark); }
        .dark .text-stone-700 { color: #cfd9f2; }
        .dark .text-stone-600 { color: #b4c2e4; }
        .dark .text-stone-500 { color: #8fa3d0; }
        .dark .border-stone-200 { border-color: #253455; }
        .dark .border-stone-100 { border-color: #1c2a45; }
        .dark .bg-stone-100 { background-color: var(--muted-dark); }
        .dark .bg-stone-800 { background-color: #0f1b33; }
        .dark .bg-stone-900 { background-color: var(--bg-dark); }

        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }

        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Main content */}
      <main className="pb-24">{children}</main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Toaster */}
      <Toaster 
        position="top-center" 
        toastOptions={{ style: { borderRadius: '12px', padding: '12px 16px' } }}
      />
    </div>
  );
}
