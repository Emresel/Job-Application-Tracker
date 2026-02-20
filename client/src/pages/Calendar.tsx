import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Briefcase } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { format, isToday, isPast, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Calendar() {
  const { jobs, isLoading } = useApplications();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col h-full gap-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  // Get upcoming deadlines and interviews
  const now = new Date();
  const upcomingDeadlines = jobs
    .filter((job) => job.deadline && !isPast(parseISO(job.deadline)))
    .sort((a, b) => (a.deadline && b.deadline ? parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime() : 0))
    .slice(0, 10);

  const upcomingInterviews = jobs
    .filter((job) => job.status === "Interviewing")
    .sort((a, b) => parseISO(a.appliedDate).getTime() - parseISO(b.appliedDate).getTime())
    .slice(0, 10);

  const hasEvents = upcomingDeadlines.length > 0 || upcomingInterviews.length > 0;

  return (
    <Layout>
      <div className="flex flex-col h-full gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View upcoming interviews and application deadlines.
          </p>
        </div>

        {!hasEvents ? (
          <Card className="flex-1 flex items-center justify-center border-dashed">
            <CardContent className="flex flex-col items-center text-center p-8">
              <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No upcoming events</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Your interview schedule and deadlines will appear here once you add them to your applications.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingDeadlines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingDeadlines.map((job) => {
                      const deadlineDate = job.deadline ? parseISO(job.deadline) : null;
                      const isTodayDeadline = deadlineDate && isToday(deadlineDate);
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{job.position}</p>
                              {isTodayDeadline && (
                                <Badge variant="destructive" className="text-xs">Today</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                            {deadlineDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(deadlineDate, "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {upcomingInterviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Interviewing Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingInterviews.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{job.position}</p>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied {format(parseISO(job.appliedDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Interviewing
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
