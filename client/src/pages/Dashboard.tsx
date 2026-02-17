import { Layout } from "@/components/layout/Layout";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { JobBoard } from "@/components/jobs/JobBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";

export default function Dashboard() {
  return (
    <Layout>
      <div className="flex flex-col gap-8 h-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! You have <span className="text-foreground font-medium">3 interviews</span> coming up this week.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                <Plus className="h-4 w-4" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <AddJobDialog />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <StatsOverview />

        {/* Recent Activity / Board Preview */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight">Active Applications</h2>
          </div>
          <JobBoard />
        </div>
      </div>
    </Layout>
  );
}
