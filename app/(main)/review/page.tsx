"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { REVIEW_QUEUE } from "@/lib/graphql/operations";

export default function ReviewQueuePage() {
  const { data, loading } = useQuery(REVIEW_QUEUE, { pollInterval: 10000 });

  if (loading) return <div className="p-8 text-slate-400">Loading review queue...</div>;

  const tasks = data?.reviewQueue || [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Review Queue</h1>
      <p className="text-slate-400 text-sm mb-8">Review submitted labeling tasks</p>

      <div className="space-y-3">
        {tasks.map((task: {
          id: string;
          status: string;
          projectName: string;
          assigneeName?: string;
          submittedAt?: string;
          asset: { filename: string };
          annotations: { id: string; labelClassName: string; type: string }[];
        }) => (
          <Link
            key={task.id}
            href={`/review/${task.id}`}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-slate-700 hover:border-primary transition-colors"
          >
            <div>
              <p className="font-medium">{task.asset.filename}</p>
              <p className="text-sm text-slate-400">{task.projectName}</p>
              <p className="text-xs text-slate-500 mt-1">
                {task.annotations.length} annotations · by {task.assigneeName || "unknown"}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded capitalize bg-yellow-600 text-white">
              {task.status.replace("_", " ")}
            </span>
          </Link>
        ))}
        {tasks.length === 0 && (
          <p className="text-slate-500 text-center py-12">No tasks awaiting review.</p>
        )}
      </div>
    </div>
  );
}
