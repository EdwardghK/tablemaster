import React from 'react';
import { cn } from '@/utils';

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-stone-200 dark:bg-stone-800',
        className
      )}
    />
  );
}

export default Skeleton;
