import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AnnotationGeometry } from "@/lib/types";

export interface DraftAnnotation {
  id: string;
  labelClassId: string;
  labelClassName: string;
  labelClassColor: string;
  type: "bbox" | "polygon";
  geometry: AnnotationGeometry;
  source: "human" | "prelabel" | "corrected";
}

export interface PrelabelOverlay {
  id: string;
  labelClassId: string;
  labelClassName: string;
  labelClassColor: string;
  type: "bbox" | "polygon";
  geometry: AnnotationGeometry;
  confidence: number;
  accepted?: boolean | null;
}

interface CanvasState {
  scale: number;
  position: { x: number; y: number };
  annotations: DraftAnnotation[];
  selectedId: string | null;
  prelabels: PrelabelOverlay[];
  isDirty: boolean;
  undoStack: DraftAnnotation[][];
  redoStack: DraftAnnotation[][];
}

const initialState: CanvasState = {
  scale: 1,
  position: { x: 0, y: 0 },
  annotations: [],
  selectedId: null,
  prelabels: [],
  isDirty: false,
  undoStack: [],
  redoStack: [],
};

const snapshot = (annotations: DraftAnnotation[]) =>
  annotations.map((a) => ({ ...a, geometry: { ...a.geometry, points: a.geometry.points?.map((p) => ({ ...p })) } }));

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    setScale(state, action: PayloadAction<number>) {
      state.scale = action.payload;
    },
    setPosition(state, action: PayloadAction<{ x: number; y: number }>) {
      state.position = action.payload;
    },
    loadAnnotations(state, action: PayloadAction<DraftAnnotation[]>) {
      state.annotations = action.payload;
      state.isDirty = false;
      state.undoStack = [];
      state.redoStack = [];
    },
    loadPrelabels(state, action: PayloadAction<PrelabelOverlay[]>) {
      state.prelabels = action.payload;
    },
    addAnnotation(state, action: PayloadAction<DraftAnnotation>) {
      state.undoStack.push(snapshot(state.annotations));
      state.redoStack = [];
      state.annotations.push(action.payload);
      state.selectedId = action.payload.id;
      state.isDirty = true;
    },
    updateAnnotation(state, action: PayloadAction<{ id: string; geometry: AnnotationGeometry }>) {
      state.undoStack.push(snapshot(state.annotations));
      state.redoStack = [];
      const ann = state.annotations.find((a) => a.id === action.payload.id);
      if (ann) {
        ann.geometry = action.payload.geometry;
        if (ann.source === "prelabel") ann.source = "corrected";
        state.isDirty = true;
      }
    },
    removeAnnotation(state, action: PayloadAction<string>) {
      state.undoStack.push(snapshot(state.annotations));
      state.redoStack = [];
      state.annotations = state.annotations.filter((a) => a.id !== action.payload);
      if (state.selectedId === action.payload) state.selectedId = null;
      state.isDirty = true;
    },
    selectAnnotation(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    applyAllPrelabels(state) {
      state.undoStack.push(snapshot(state.annotations));
      state.redoStack = [];
      for (const p of state.prelabels) {
        if (p.accepted === false) continue;
        state.annotations.push({
          id: `prelabel-${p.id}`,
          labelClassId: p.labelClassId,
          labelClassName: p.labelClassName,
          labelClassColor: p.labelClassColor,
          type: p.type,
          geometry: p.geometry,
          source: "prelabel",
        });
      }
      state.prelabels = [];
      state.isDirty = true;
    },
    removePrelabel(state, action: PayloadAction<string>) {
      state.prelabels = state.prelabels.filter((p) => p.id !== action.payload);
    },
    undo(state) {
      const prev = state.undoStack.pop();
      if (prev) {
        state.redoStack.push(snapshot(state.annotations));
        state.annotations = prev;
        state.isDirty = true;
      }
    },
    redo(state) {
      const next = state.redoStack.pop();
      if (next) {
        state.undoStack.push(snapshot(state.annotations));
        state.annotations = next;
        state.isDirty = true;
      }
    },
    markClean(state) {
      state.isDirty = false;
    },
    resetCanvas() {
      return initialState;
    },
  },
});

export const {
  setScale,
  setPosition,
  loadAnnotations,
  loadPrelabels,
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  selectAnnotation,
  applyAllPrelabels,
  removePrelabel,
  undo,
  redo,
  markClean,
  resetCanvas,
} = canvasSlice.actions;

export default canvasSlice.reducer;
