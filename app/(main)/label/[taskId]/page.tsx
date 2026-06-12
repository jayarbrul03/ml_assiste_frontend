"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LabelingCanvas } from "@/components/canvas/LabelingCanvas";
import {
  TASK_QUERY,
  PROJECT_QUERY,
  CLAIM_TASK,
  SUBMIT_TASK,
  SAVE_ANNOTATIONS,
  PRELABEL_PREDICTIONS,
  APPLY_PRELABELS,
  ACCEPT_PRELABEL,
  REJECT_PRELABEL,
  TASK_QA_CHECK,
} from "@/lib/graphql/operations";
import type { RootState } from "@/store";
import {
  loadAnnotations,
  loadPrelabels,
  applyAllPrelabels,
  removePrelabel,
  markClean,
  undo,
  redo,
  resetCanvas,
} from "@/store/canvasSlice";
import { setActiveTool, setActiveLabelClass } from "@/store/toolSlice";

export default function LabelTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const dispatch = useDispatch();
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const claimAttempted = useRef(false);

  const { data, loading, refetch } = useQuery(TASK_QUERY, { variables: { id: taskId } });
  const task = data?.task;

  const { data: projectData } = useQuery(PROJECT_QUERY, {
    variables: { id: task?.projectId },
    skip: !task?.projectId,
  });

  const { data: prelabelData } = useQuery(PRELABEL_PREDICTIONS, {
    variables: { assetId: task?.asset?.id },
    skip: !task?.asset?.id,
  });

  const [claimTask] = useMutation(CLAIM_TASK, { onCompleted: () => refetch() });
  const [submitTask] = useMutation(SUBMIT_TASK);
  const [saveAnnotations] = useMutation(SAVE_ANNOTATIONS);
  const [applyPrelabelsMut] = useMutation(APPLY_PRELABELS, { onCompleted: () => refetch() });
  const [acceptPrelabel] = useMutation(ACCEPT_PRELABEL, { onCompleted: () => refetch() });
  const [rejectPrelabel] = useMutation(REJECT_PRELABEL);
  const { data: qaData } = useQuery(TASK_QA_CHECK, { variables: { taskId }, skip: !taskId });

  const { annotations, isDirty, prelabels } = useSelector((s: RootState) => s.canvas);
  const { activeTool, activeLabelClassId } = useSelector((s: RootState) => s.tool);

  const labelClasses = projectData?.project?.labelClasses || [];

  useEffect(() => {
    return () => {
      dispatch(resetCanvas());
      claimAttempted.current = false;
    };
  }, [dispatch, taskId]);

  useEffect(() => {
    if (!task || claimAttempted.current) return;
    if (task.status === "pending" || task.status === "rejected") {
      claimAttempted.current = true;
      claimTask({ variables: { taskId } });
    }
  }, [task, taskId, claimTask]);

  useEffect(() => {
    if (task?.annotations) {
      dispatch(
        loadAnnotations(
          task.annotations.map((a: {
            id: string;
            labelClassId: string;
            labelClassName: string;
            labelClassColor: string;
            type: string;
            geometry: object;
            source: string;
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

  useEffect(() => {
    if (prelabelData?.prelabelPredictions) {
      dispatch(
        loadPrelabels(
          prelabelData.prelabelPredictions
            .filter((p: { accepted?: boolean | null }) => p.accepted !== false)
            .map((p: {
            id: string;
            labelClassId: string;
            labelClassName: string;
            labelClassColor: string;
            type: string;
            geometry: object;
            confidence: number;
            accepted?: boolean | null;
          }) => ({
            id: p.id,
            labelClassId: p.labelClassId,
            labelClassName: p.labelClassName,
            labelClassColor: p.labelClassColor,
            type: p.type as "bbox" | "polygon",
            geometry: p.geometry,
            confidence: p.confidence,
          }))
        )
      );
    }
  }, [prelabelData, dispatch]);

  useEffect(() => {
    if (labelClasses.length && !activeLabelClassId) {
      const lc = labelClasses[0];
      dispatch(setActiveLabelClass({ id: lc.id, name: lc.name, color: lc.color }));
    }
  }, [labelClasses, activeLabelClassId, dispatch]);

  const doSave = useCallback(async () => {
    if (!task) return;
    await saveAnnotations({
      variables: {
        taskId: task.id,
        annotations: annotations.map((a) => ({
          id: a.id.startsWith("prelabel-") ? null : a.id,
          labelClassId: a.labelClassId,
          type: a.type,
          geometry: a.geometry,
          source: a.source,
        })),
      },
    });
    dispatch(markClean());
    refetch();
  }, [task, annotations, saveAnnotations, dispatch, refetch]);

  useEffect(() => {
    if (isDirty) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(doSave, 30000);
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [isDirty, annotations, doSave]);

  const handleSubmit = async () => {
    await doSave();
    await submitTask({ variables: { taskId } });
    router.push("/label");
  };

  const handleApplyPrelabels = () => {
    dispatch(applyAllPrelabels());
  };

  const handleAcceptPrelabel = async (predictionId: string) => {
    await acceptPrelabel({ variables: { predictionId, taskId } });
    dispatch(removePrelabel(predictionId));
  };

  const handleRejectPrelabel = async (predictionId: string) => {
    await rejectPrelabel({ variables: { predictionId, taskId } });
    dispatch(removePrelabel(predictionId));
  };

  const qa = qaData?.taskQaCheck;

  if (loading || !task) return <div className="p-8 text-slate-400">Loading task...</div>;

  const imageUrl = task.asset.url.startsWith("http")
    ? task.asset.url
    : task.asset.url;

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="w-64 bg-card border-r border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
        {task.uncertaintyScore != null && task.uncertaintyScore >= 0.3 && (
          <div className="p-3 rounded-lg bg-amber-950 border border-amber-800 text-xs text-amber-200">
            Active learning: high uncertainty ({(task.uncertaintyScore * 100).toFixed(0)}%).
            Review and correct low-confidence pre-labels.
          </div>
        )}
        {task.autolabeled && (
          <div className="p-3 rounded-lg bg-violet-950 border border-violet-800 text-xs text-violet-200">
            Autolabeled — high-confidence predictions were applied automatically.
          </div>
        )}
        {qa && (
          <div className={`p-3 rounded-lg border text-xs ${qa.passed ? "bg-emerald-950 border-emerald-800 text-emerald-200" : "bg-red-950 border-red-800 text-red-200"}`}>
            Auto-QA: {qa.passed ? "Passed" : "Failed"} (score {(qa.overallScore * 100).toFixed(0)}%)
            {qa.issues?.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-[10px] opacity-80">
                {qa.issues.slice(0, 3).map((issue: string, i: number) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div>
          <h2 className="font-semibold text-sm mb-2">Tools</h2>
          <div className="grid grid-cols-3 gap-1">
            {(["select", "bbox", "polygon"] as const).map((tool) => (
              <button
                key={tool}
                onClick={() => dispatch(setActiveTool(tool))}
                className={`px-2 py-2 text-xs rounded capitalize ${activeTool === tool ? "bg-primary text-white" : "bg-slate-800 text-slate-400"}`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-sm mb-2">Classes</h2>
          {labelClasses.map((lc: { id: string; name: string; color: string }) => (
            <button
              key={lc.id}
              onClick={() => dispatch(setActiveLabelClass({ id: lc.id, name: lc.name, color: lc.color }))}
              className={`w-full text-left px-3 py-2 mb-1 rounded text-sm ${activeLabelClassId === lc.id ? "ring-2 ring-white" : ""}`}
              style={{ backgroundColor: lc.color + "33", color: lc.color }}
            >
              {lc.name}
            </button>
          ))}
        </div>

        <div>
          <h2 className="font-semibold text-sm mb-2">Annotations ({annotations.length})</h2>
          {annotations.map((a) => (
            <div key={a.id} className="text-xs py-1 text-slate-400">
              {a.labelClassName} · {a.type} · {a.source}
            </div>
          ))}
        </div>

        {prelabels.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-2">Pre-labels ({prelabels.length})</h2>
            <p className="text-[10px] text-slate-500 mb-2">Accept or reject each prediction individually</p>
            {prelabels.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <div className="text-xs">
                  <span style={{ color: p.labelClassColor }}>{p.labelClassName}</span>
                  <span className="text-slate-500 ml-1">{(p.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAcceptPrelabel(p.id)}
                    className="px-2 py-0.5 text-[10px] bg-emerald-800 text-emerald-100 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectPrelabel(p.id)}
                    className="px-2 py-0.5 text-[10px] bg-red-900 text-red-200 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleApplyPrelabels}
              className="mt-2 w-full px-3 py-2 bg-accent/20 text-accent rounded text-sm border border-accent"
            >
              Apply All Remaining
            </button>
          </div>
        )}

        <div className="mt-auto space-y-2">
          <div className="flex gap-1">
            <button onClick={() => dispatch(undo())} className="flex-1 py-1 text-xs bg-slate-800 rounded">Undo</button>
            <button onClick={() => dispatch(redo())} className="flex-1 py-1 text-xs bg-slate-800 rounded">Redo</button>
          </div>
          <button
            onClick={doSave}
            className="w-full py-2 bg-slate-700 text-white rounded text-sm"
          >
            Save {isDirty ? "*" : ""}
          </button>
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-primary text-white rounded text-sm font-medium"
          >
            Submit Task
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{task.asset.filename}</h1>
            <p className="text-sm text-slate-400">{task.projectName}</p>
          </div>
          <span className="text-xs px-2 py-1 bg-slate-700 rounded capitalize">{task.status.replace("_", " ")}</span>
        </div>
        <div className="h-[calc(100%-40px)]">
          <LabelingCanvas imageUrl={imageUrl} />
        </div>
      </div>
    </div>
  );
}
