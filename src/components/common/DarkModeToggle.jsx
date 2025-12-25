// File: src/components/common/DarkModeToggle.jsx

import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('darkMode') : null;
    if (stored === null) {
      if (typeof window !== 'undefined') localStorage.setItem('darkMode', 'true');
      return true; // default to dark
    }
    return stored !== 'false';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="rounded-full"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500" />
      ) : (
        <Moon className="h-5 w-5 text-stone-600" />
      )}
    </Button>
  );
}
