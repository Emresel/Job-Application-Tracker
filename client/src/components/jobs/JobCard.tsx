import { motion } from "framer-motion";
import { JobApplication, JobStatus } from "@/lib/store";
import { useApplications } from "@/hooks/useApplications";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface JobCardProps {
  job: JobApplication;
}

const statusColors: Record<JobStatus, string> = {
  Applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Interviewing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Offer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Rejected: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

export function JobCard({ job }: JobCardProps) {
  const { updateJobStatus } = useApplications();

  return (
    <motion.div
      layoutId={job.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer hover:shadow-md transition-all border-border/60 group">
        <CardHeader className="p-4 pb-3 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                {job.logo ? (
                  <img src={job.logo} alt={job.company} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                  {job.position}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={cn("font-medium border shadow-none", statusColors[job.status])}>
              {job.status}
            </Badge>
            <Badge variant="secondary" className="font-normal text-xs bg-muted/50">
              {job.type}
            </Badge>
          </div>
          
          <div className="grid gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{job.location}</span>
            </div>
            {job.salaryRange && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{job.salaryRange}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-border/50">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Applied {format(new Date(job.appliedDate), "MMM d, yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
