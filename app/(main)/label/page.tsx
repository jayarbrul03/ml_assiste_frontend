"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { MY_TASK_QUEUE } from "@/lib/graphql/operations";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-600",
  in_progress: "bg-blue-600",
  submitted: "bg-yellow-600",
  rejected: "bg-red-600",
};

function uncertaintyLabel(score: number | null | undefined): string {
  if (score == null) return "Unscored";
  if (score >= 0.5) return "High uncertainty";
  if (score >= 0.3) return "Medium uncertainty";
  return "Low uncertainty";
}

function uncertaintyColor(score: number | null | undefined): string {
  if (score == null) return "bg-slate-700 text-slate-300";
  if (score >= 0.5) return "bg-red-900 text-red-200";
  if (score >= 0.3) return "bg-amber-900 text-amber-200";
  return "bg-emerald-900 text-emerald-200";
}

export default function LabelQueuePage() {
  const { data, loading } = useQuery(MY_TASK_QUEUE, { pollInterval: 10000 });

  if (loading) return <div className="p-8 text-slate-400">Loading queue...</div>;

  const tasks = data?.myTaskQueue || [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Label Queue</h1>
      <p className="text-slate-400 text-sm mb-2">
        Active learning: tasks are sorted by uncertainty (hardest first).
      </p>
      <p className="text-slate-500 text-xs mb-8">
        High-uncertainty tasks need human attention; low-uncertainty tasks may already have partial autolabels applied.
      </p>

      <div className="space-y-3">
        {tasks.map((task: {
          id: string;
          status: string;
          projectName: string;
          assigneeName?: string;
          rejectionReason?: string;
          uncertaintyScore?: number | null;
          autolabeled?: boolean;
          asset: { filename: string; url: string };
        }) => (
          <Link
            key={task.id}
            href={`/label/${task.id}`}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-slate-700 hover:border-primary transition-colors"
          >
            <div>
              <p className="font-medium">{task.asset.filename}</p>
              <p className="text-sm text-slate-400">{task.projectName}</p>
              {task.rejectionReason && (
                <p className="text-sm text-red-400 mt-1">Rejected: {task.rejectionReason}</p>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded ${uncertaintyColor(task.uncertaintyScore)}`}>
                  {uncertaintyLabel(task.uncertaintyScore)}
                  {task.uncertaintyScore != null && ` (${(task.uncertaintyScore * 100).toFixed(0)}%)`}
                </span>
                {task.autolabeled && (
                  <span className="text-xs px-2 py-0.5 rounded bg-violet-900 text-violet-200">
                    Autolabeled
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {task.assigneeName && (
                <span className="text-xs text-slate-500">{task.assigneeName}</span>
              )}
              <span className={`text-xs px-2 py-1 rounded capitalize text-white ${STATUS_COLORS[task.status] || "bg-slate-600"}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
          </Link>
        ))}
        {tasks.length === 0 && (
          <p className="text-slate-500 text-center py-12">No tasks available.</p>
        )}
      </div>
    </div>
  );
}
