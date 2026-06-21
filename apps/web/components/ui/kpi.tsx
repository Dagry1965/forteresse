import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPIProps {
  label: string
  icon?: string
  value: React.ReactNode
  className?: string
}

export function KPI({ label, icon, value, className }: KPIProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon && (
          <div className="text-xl opacity-70">
            {icon}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-foreground">
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
