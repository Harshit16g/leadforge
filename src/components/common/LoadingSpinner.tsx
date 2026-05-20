import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <span className="icon-[solar--refresh-circle-bold-duotone] animate-spin size-full" />
    </div>
  );
}
