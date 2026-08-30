import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded border border-black bg-white px-3 py-2 text-xs text-black transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-700 disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-xs",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
