import { useApplications } from "@/hooks/useApplications";
import { JobCard } from "./JobCard";
import { JobStatus } from "@/lib/store";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddJobDialog } from "./AddJobDialog";
import { useAuth } from "@/contexts/AuthContext";

interface JobBoardProps {
  global?: boolean;
}

const COLUMNS: JobStatus[] = ["Applied", "Interviewing", "Offer", "Rejected"];

export function JobBoard({ global = false }: JobBoardProps) {
  const { jobs, isLoading } = useApplications({ global });
  const { user } = useAuth();

  const canAddStatus = (status: JobStatus) => {
    if (!user) return false;
    if (status === "Offer" && user.role !== "Admin" && user.role !== "Management") return false;
    return true;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full place-items-center">
        <p className="text-muted-foreground col-span-full">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnJobs = jobs.filter((job) => job.status === status);

        return (
          <div key={status} className="flex flex-col h-full min-w-[280px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {status}
                </h3>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {columnJobs.length}
                </span>
              </div>
              {canAddStatus(status) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <AddJobDialog defaultStatus={status} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="flex-1 bg-muted/30 rounded-xl border border-dashed border-border/60 p-3">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {columnJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </AnimatePresence>
                {columnJobs.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-muted-foreground/40 text-sm italic">
                    No applications
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
