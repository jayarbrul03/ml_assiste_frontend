"use client";

import dynamic from "next/dynamic";

export const LabelingCanvas = dynamic(
  () => import("./LabelingCanvasInner").then((m) => m.LabelingCanvasInner),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-slate-400">Loading canvas...</div> }
);
