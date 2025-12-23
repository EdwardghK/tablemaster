// src/components/ui/label.js
import React from "react";
import { cn } from "@/utils";

export const Label = ({ className, children, ...props }) => {
  return (
    <label
      className={cn("text-sm font-medium text-stone-700", className)}
      {...props}
    >
      {children}
    </label>
  );
};
