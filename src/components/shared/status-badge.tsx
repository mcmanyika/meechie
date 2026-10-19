import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/format";

const tone: Record<string, string> = {
  active: "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  completed: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  registration_open: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  published: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  planned: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  pending: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  trialing: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  waitlist: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  applicant: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  full: "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  cancelled: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  refunded: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  suspended: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  past_due: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  checked_in: "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  verified: "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  new: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`border-transparent ${tone[value] ?? ""}`}>
      {titleCase(value)}
    </Badge>
  );
}
