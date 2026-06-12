"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { AUTOLABEL_REVIEW_QUEUE } from "@/lib/graphql/operations";

export default function AutolabelReviewPage() {
  const { data, loading } = useQuery(AUTOLABEL_REVIEW_QUEUE, { pollInterval: 10000 });

  if (loading) return <div className="p-8 text-slate-400">Loading autolabel review queue...</div>;

  const tasks = data?.autolabelReviewQueue || [];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Autolabel Review</h1>
      <p className="text-slate-400 text-sm mb-8">
        Dedicated queue for reviewing ML-autolabeled tasks. Compare pre-label predictions against applied annotations.
      </p>

      <div className="space-y-3">
        {tasks.map((task: {
          id: string;
          status: string;
          projectName: string;
          uncertaintyScore?: number | null;
          autolabelReviewStatus?: string | null;
          assigneeName?: string;
          asset: { filename: string };
          annotations: { source: string; labelClassName: string }[];
        }) => (
          <Link
            key={task.id}
            href={`/autolabel-review/${task.id}`}
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-violet-800/50 hover:border-violet-500 transition-colors"
          >
            <div>
              <p className="font-medium">{task.asset.filename}</p>
              <p className="text-sm text-slate-400">{task.projectName}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-violet-900 text-violet-200">Autolabeled</span>
                {task.uncertaintyScore != null && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    Uncertainty {(task.uncertaintyScore * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {task.annotations.length} annotation(s) ·{" "}
                  {task.annotations.filter((a) => a.source === "prelabel").length} from pre-label
                </span>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-slate-700 rounded capitalize">{task.status.replace("_", " ")}</span>
          </Link>
        ))}
        {tasks.length === 0 && (
          <p className="text-slate-500 text-center py-12">No autolabeled tasks pending review.</p>
        )}
      </div>
    </div>
  );
}
