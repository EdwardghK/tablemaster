import "@ncdai/react-wheel-picker/style.css";

import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";

import { cn } from "@/utils";

function WheelPickerWrapper({
  className,
  ...props
}) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white px-1 shadow-xs",
        "dark:border-zinc-700/80 dark:bg-zinc-900",
        className
      )}
      {...props} />
  );
}

function WheelPicker(
  {
    classNames,
    ...props
  }
) {
  return (
    <WheelPickerPrimitive.WheelPicker
      orientation="horizontal"
      classNames={{
        optionItem: cn(
          "ios-wheel-option",
          "text-zinc-400 dark:text-zinc-500"
        ),
        highlightWrapper: cn(
          "ios-wheel-highlight",
          "bg-zinc-100 dark:bg-zinc-800"
        ),
        ...classNames,
      }}
      {...props} />
  );
}

export { WheelPicker, WheelPickerWrapper };
