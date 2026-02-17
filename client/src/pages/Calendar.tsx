import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  return (
    <Layout>
      <div className="flex flex-col h-full gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View upcoming interviews and application deadlines.
          </p>
        </div>

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
      </div>
    </Layout>
  );
}
