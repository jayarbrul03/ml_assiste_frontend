"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { LabelingCanvas } from "@/components/canvas/LabelingCanvas";
import {
  TASK_QUERY,
  PRELABEL_PREDICTIONS,
  APPROVE_AUTOLABEL,
  REJECT_AUTOLABEL,
  TASK_QA_CHECK,
} from "@/lib/graphql/operations";
import { loadAnnotations, resetCanvas } from "@/store/canvasSlice";

export default function AutolabelReviewTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const dispatch = useDispatch();

  const { data, loading } = useQuery(TASK_QUERY, { variables: { id: taskId } });
  const task = data?.task;

  const { data: prelabelData } = useQuery(PRELABEL_PREDICTIONS, {
    variables: { assetId: task?.asset?.id },
    skip: !task?.asset?.id,
  });

  const { data: qaData } = useQuery(TASK_QA_CHECK, { variables: { taskId }, skip: !taskId });

  const [approveAutolabel] = useMutation(APPROVE_AUTOLABEL);
  const [rejectAutolabel] = useMutation(REJECT_AUTOLABEL);

  useEffect(() => () => { dispatch(resetCanvas()); }, [dispatch]);

  useEffect(() => {
    if (task?.annotations) {
      dispatch(
        loadAnnotations(
          task.annotations.map((a: {
            id: string; labelClassId: string; labelClassName: string;
            labelClassColor: string; type: string; geometry: object; source: string;
          }) => ({
            id: a.id,
            labelClassId: a.labelClassId,
            labelClassName: a.labelClassName,
            labelClassColor: a.labelClassColor,
            type: a.type as "bbox" | "polygon",
            geometry: a.geometry,
            source: a.source as "human" | "prelabel" | "corrected",
          }))
        )
      );
    }
  }, [task?.annotations, dispatch]);

  if (loading || !task) return <div className="p-8 text-slate-400">Loading...</div>;

  const preds = prelabelData?.prelabelPredictions || [];
  const qa = qaData?.taskQaCheck;

  const handleApprove = async () => {
    await approveAutolabel({ variables: { taskId } });
    router.push("/autolabel-review");
  };

  const handleReject = async () => {
    const comment = prompt("Rejection reason for autolabel:");
    if (!comment) return;
    await rejectAutolabel({ variables: { taskId, comment } });
    router.push("/autolabel-review");
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="w-72 bg-card border-r border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="p-3 rounded-lg bg-violet-950 border border-violet-800 text-xs text-violet-200">
          Autolabel Review — verify ML predictions before final approval.
        </div>

        {qa && (
          <div className={`p-3 rounded-lg border text-xs ${qa.passed ? "bg-emerald-950 border-emerald-800 text-emerald-200" : "bg-amber-950 border-amber-800 text-amber-200"}`}>
            <p className="font-medium mb-1">Auto-QA Score: {(qa.overallScore * 100).toFixed(0)}%</p>
            <p>IoU: {qa.iouScore != null ? (qa.iouScore * 100).toFixed(0) : "—"}%</p>
            <p>Consensus: {qa.consensusScore != null ? (qa.consensusScore * 100).toFixed(0) : "—"}%</p>
            <p>Gold Std: {qa.goldStandardScore != null ? (qa.goldStandardScore * 100).toFixed(0) : "—"}%</p>
            {qa.issues?.length > 0 && (
              <ul className="mt-2 list-disc pl-4 opacity-80">
                {qa.issues.map((issue: string, i: number) => <li key={i}>{issue}</li>)}
              </ul>
            )}
          </div>
        )}

        <div>
          <h2 className="font-semibold text-sm mb-2">Applied Annotations ({task.annotations.length})</h2>
          {task.annotations.map((a: { id: string; labelClassName: string; source: string; type: string }) => (
            <div key={a.id} className="text-xs py-1 text-slate-400">
              {a.labelClassName} · {a.type} · <span className={a.source === "prelabel" ? "text-violet-400" : "text-blue-400"}>{a.source}</span>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-semibold text-sm mb-2">Pre-label Predictions ({preds.length})</h2>
          {preds.map((p: { id: string; labelClassName: string; confidence: number; accepted?: boolean | null }) => (
            <div key={p.id} className="text-xs py-1 flex justify-between">
              <span className="text-slate-400">{p.labelClassName}</span>
              <span className={
                p.accepted === true ? "text-emerald-400" :
                p.accepted === false ? "text-red-400" : "text-slate-500"
              }>
                {(p.confidence * 100).toFixed(0)}% {p.accepted === true ? "✓" : p.accepted === false ? "✗" : "?"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <button onClick={handleApprove} className="w-full py-2 bg-emerald-700 text-white rounded text-sm font-medium">
            Approve Autolabel
          </button>
          <button onClick={handleReject} className="w-full py-2 bg-red-800 text-white rounded text-sm">
            Reject Autolabel
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-2">
          <h1 className="font-semibold">{task.asset.filename}</h1>
          <p className="text-sm text-slate-400">{task.projectName}</p>
        </div>
        <div className="h-[calc(100%-40px)]">
          <LabelingCanvas imageUrl={task.asset.url} readOnly />
        </div>
      </div>
    </div>
  );
}
