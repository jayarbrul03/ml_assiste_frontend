"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { LabelingCanvas } from "@/components/canvas/LabelingCanvas";
import {
  TASK_QUERY,
  CLAIM_REVIEW,
  APPROVE_TASK,
  REJECT_TASK,
} from "@/lib/graphql/operations";
import { loadAnnotations, resetCanvas } from "@/store/canvasSlice";

export default function ReviewTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const dispatch = useDispatch();

  const { data, loading, refetch } = useQuery(TASK_QUERY, { variables: { id: taskId } });
  const [claimReview] = useMutation(CLAIM_REVIEW, { onCompleted: () => refetch() });
  const [approveTask] = useMutation(APPROVE_TASK);
  const [rejectTask] = useMutation(REJECT_TASK);

  const task = data?.task;
  const claimAttempted = useRef(false);

  useEffect(() => {
    return () => {
      dispatch(resetCanvas());
      claimAttempted.current = false;
    };
  }, [dispatch, taskId]);

  useEffect(() => {
    if (!task || claimAttempted.current) return;
    if (task.status === "submitted") {
      claimAttempted.current = true;
      claimReview({ variables: { taskId } });
    }
  }, [task, taskId, claimReview]);

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

  const handleApprove = async () => {
    await approveTask({ variables: { taskId } });
    router.push("/review");
  };

  const handleReject = async () => {
    const comment = prompt("Rejection reason:");
    if (!comment) return;
    await rejectTask({ variables: { taskId, comment } });
    router.push("/review");
  };

  if (loading || !task) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="w-72 bg-card border-r border-slate-700 p-4 flex flex-col">
        <h2 className="font-semibold mb-4">Review Task</h2>
        <p className="text-sm text-slate-400 mb-1">{task.asset.filename}</p>
        <p className="text-sm text-slate-400 mb-4">{task.projectName}</p>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Annotations ({task.annotations.length})</h3>
          {task.annotations.map((a: { id: string; labelClassName: string; type: string; source: string }) => (
            <div key={a.id} className="text-xs py-1 text-slate-400">
              {a.labelClassName} · {a.type} · {a.source}
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={handleApprove}
            className="w-full py-2 bg-accent text-white rounded text-sm font-medium"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="w-full py-2 bg-red-600 text-white rounded text-sm font-medium"
          >
            Reject
          </button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <LabelingCanvas imageUrl={task.asset.url} readOnly />
      </div>
    </div>
  );
}
