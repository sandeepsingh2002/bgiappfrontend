"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (next: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
};

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (value === undefined) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const tabsListVariants = cva(
  "inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof tabsListVariants>) {
  return <div data-slot="tabs-list" data-variant={variant} className={cn(tabsListVariants({ variant }), className)} {...props} />;
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used inside Tabs");
  }

  const isActive = context.value === value;

  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-active={isActive ? "true" : undefined}
      aria-selected={isActive}
      role="tab"
      onClick={() => context.setValue(value)}
      className={cn(
        "relative inline-flex h-8 items-center justify-center rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm dark:data-[active=true]:border-input dark:data-[active=true]:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used inside Tabs");
  }

  if (context.value !== value) return null;

  return <div data-slot="tabs-content" role="tabpanel" className={cn("flex-1 text-sm outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
