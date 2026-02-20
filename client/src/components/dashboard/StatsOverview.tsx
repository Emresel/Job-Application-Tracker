import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Send, CheckCircle2, XCircle } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";

export function StatsOverview() {
  const { jobs } = useApplications();

  const stats = [
    {
      label: "Total Applications",
      value: jobs.filter((j) => j.status !== "Offer").length,
      icon: Briefcase,
      trend: "+2 this week",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Interviews",
      value: jobs.filter((j) => j.status === "Interviewing").length,
      icon: Send,
      trend: "",
      color: "text-chart-3", // Orange
      bg: "bg-chart-3/10",
    },
    {
      label: "Offers",
      value: jobs.filter((j) => j.status === "Offer").length,
      icon: CheckCircle2,
      trend: "",
      color: "text-chart-2", // Green
      bg: "bg-chart-2/10",
    },
    {
      label: "Rejected",
      value: jobs.filter((j) => j.status === "Rejected").length,
      icon: XCircle,
      trend: "12% rate",
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
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
