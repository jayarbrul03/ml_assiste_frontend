import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AnnotationGeometry } from "@/lib/types";

export type ToolType = "select" | "bbox" | "polygon";

interface ToolState {
  activeTool: ToolType;
  activeLabelClassId: string | null;
  activeLabelClassName: string;
  activeLabelClassColor: string;
  polygonPoints: { x: number; y: number }[];
  isDrawing: boolean;
  draftBbox: AnnotationGeometry | null;
}

const initialState: ToolState = {
  activeTool: "select",
  activeLabelClassId: null,
  activeLabelClassName: "",
  activeLabelClassColor: "#3b82f6",
  polygonPoints: [],
  isDrawing: false,
  draftBbox: null,
};

const toolSlice = createSlice({
  name: "tool",
  initialState,
  reducers: {
    setActiveTool(state, action: PayloadAction<ToolType>) {
      state.activeTool = action.payload;
      state.polygonPoints = [];
      state.draftBbox = null;
      state.isDrawing = false;
    },
    setActiveLabelClass(
      state,
      action: PayloadAction<{ id: string; name: string; color: string }>
    ) {
      state.activeLabelClassId = action.payload.id;
      state.activeLabelClassName = action.payload.name;
      state.activeLabelClassColor = action.payload.color;
    },
    addPolygonPoint(state, action: PayloadAction<{ x: number; y: number }>) {
      state.polygonPoints.push(action.payload);
      state.isDrawing = true;
    },
    setDraftBbox(state, action: PayloadAction<AnnotationGeometry | null>) {
      state.draftBbox = action.payload;
      state.isDrawing = action.payload !== null;
    },
    clearDrawing(state) {
      state.polygonPoints = [];
      state.draftBbox = null;
      state.isDrawing = false;
    },
  },
});

export const {
  setActiveTool,
  setActiveLabelClass,
  addPolygonPoint,
  setDraftBbox,
  clearDrawing,
} = toolSlice.actions;

export default toolSlice.reducer;
