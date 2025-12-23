import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/utils';

const TabsContext = createContext();

export function Tabs({ defaultValue, children, className }) {
  const [activeValue, setActiveValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
  return (
    <div className={cn('flex border-b border-stone-200 rounded-xl bg-stone-50 p-1 gap-1', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }) {
  const { activeValue, setActiveValue } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => setActiveValue(value)}
      className={cn(
        'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-amber-700 text-white shadow'
          : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const { activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;
  return <div className={cn('pt-4', className)}>{children}</div>;
}
