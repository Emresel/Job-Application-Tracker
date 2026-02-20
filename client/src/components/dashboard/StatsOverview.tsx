import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Send, CheckCircle2, XCircle } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";

export interface StatsOverviewProps {
  global?: boolean;
}

export function StatsOverview({ global = false }: StatsOverviewProps) {
  const { jobs } = useApplications({ global });

  const stats = [
    {
      label: "Total Applications",
      value: jobs.filter((j) => j.status !== "Offer").length,
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Interviews",
      value: jobs.filter((j) => j.status === "Interviewing").length,
      icon: Send,
      color: "text-chart-3", // Orange
      bg: "bg-chart-3/10",
    },
    {
      label: "Offers",
      value: jobs.filter((j) => j.status === "Offer").length,
      icon: CheckCircle2,
      color: "text-chart-2", // Green
      bg: "bg-chart-2/10",
    },
    {
      label: "Rejected",
      value: jobs.filter((j) => j.status === "Rejected").length,
      icon: XCircle,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
