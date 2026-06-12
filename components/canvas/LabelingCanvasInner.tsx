"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Line, Image as KonvaImage, Transformer, Circle, Group } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  addAnnotation,
  updateAnnotation,
  selectAnnotation,
  removeAnnotation,
  setScale,
  setPosition,
} from "@/store/canvasSlice";
import {
  addPolygonPoint,
  clearDrawing,
  setDraftBbox,
} from "@/store/toolSlice";
import type { DraftAnnotation } from "@/store/canvasSlice";

interface LabelingCanvasProps {
  imageUrl: string;
  readOnly?: boolean;
}

export function LabelingCanvasInner({ imageUrl, readOnly = false }: LabelingCanvasProps) {
  const dispatch = useDispatch();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [image] = useImage(imageUrl, "anonymous");

  const { scale, position, annotations, selectedId, prelabels } = useSelector(
    (s: RootState) => s.canvas
  );
  const { activeTool, activeLabelClassId, activeLabelClassName, activeLabelClassColor, polygonPoints, draftBbox } =
    useSelector((s: RootState) => s.tool);

  const [isPanning, setIsPanning] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selectedId ? stage.findOne(`#ann-${selectedId}`) : null;
    if (node && !readOnly && activeTool === "select") {
      tr.nodes([node]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer()?.batchDraw();
  }, [selectedId, annotations, readOnly, activeTool]);

  const toImageCoords = useCallback(
    (stageX: number, stageY: number) => ({
      x: (stageX - position.x) / scale,
      y: (stageY - position.y) / scale,
    }),
    [scale, position]
  );

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.2, Math.min(5, oldScale + direction * 0.1));
    dispatch(setScale(newScale));
    dispatch(
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      })
    );
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readOnly) return;
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      setIsPanning(true);
      return;
    }

    if (activeTool === "select" && e.target === stage) {
      dispatch(selectAnnotation(null));
      return;
    }

    if (!activeLabelClassId) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const coords = toImageCoords(pos.x, pos.y);

    if (activeTool === "bbox") {
      setDrawStart(coords);
      dispatch(setDraftBbox({ x: coords.x, y: coords.y, width: 0, height: 0 }));
    } else if (activeTool === "polygon") {
      dispatch(addPolygonPoint(coords));
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      dispatch(
        setPosition({
          x: position.x + e.evt.movementX,
          y: position.y + e.evt.movementY,
        })
      );
      return;
    }

    if (activeTool === "bbox" && drawStart) {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const coords = toImageCoords(pos.x, pos.y);
      dispatch(
        setDraftBbox({
          x: Math.min(drawStart.x, coords.x),
          y: Math.min(drawStart.y, coords.y),
          width: Math.abs(coords.x - drawStart.x),
          height: Math.abs(coords.y - drawStart.y),
        })
      );
    }
  };

  const handleStageMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (
      activeTool === "bbox" &&
      draftBbox &&
      draftBbox.width &&
      draftBbox.height &&
      draftBbox.width > 5 &&
      draftBbox.height > 5
    ) {
      dispatch(
        addAnnotation({
          id: crypto.randomUUID(),
          labelClassId: activeLabelClassId!,
          labelClassName: activeLabelClassName,
          labelClassColor: activeLabelClassColor,
          type: "bbox",
          geometry: { ...draftBbox },
          source: "human",
        })
      );
    }
    setDrawStart(null);
    dispatch(setDraftBbox(null));
  };

  const finishPolygon = useCallback(() => {
    if (polygonPoints.length >= 3 && activeLabelClassId) {
      dispatch(
        addAnnotation({
          id: crypto.randomUUID(),
          labelClassId: activeLabelClassId,
          labelClassName: activeLabelClassName,
          labelClassColor: activeLabelClassColor,
          type: "polygon",
          geometry: { points: [...polygonPoints] },
          source: "human",
        })
      );
    }
    dispatch(clearDrawing());
  }, [polygonPoints, activeLabelClassId, activeLabelClassName, activeLabelClassColor, dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && activeTool === "polygon") finishPolygon();
      if (e.key === "Escape") dispatch(clearDrawing());
      if (e.key === "Delete" && selectedId && !readOnly) {
        dispatch(removeAnnotation(selectedId));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTool, finishPolygon, selectedId, readOnly, dispatch]);

  const renderAnnotation = (ann: DraftAnnotation, dashed = false) => {
    const isSelected = ann.id === selectedId;
    const color = ann.labelClassColor;

    if (ann.type === "bbox" && ann.geometry.width !== undefined) {
      const g = ann.geometry;
      return (
        <Rect
          key={ann.id}
          id={`ann-${ann.id}`}
          x={g.x! * scale + position.x}
          y={g.y! * scale + position.y}
          width={g.width! * scale}
          height={g.height! * scale}
          stroke={color}
          strokeWidth={isSelected ? 3 : 2}
          dash={dashed ? [6, 4] : undefined}
          fill={color + "33"}
          draggable={!readOnly && activeTool === "select" && !dashed}
          onClick={() => !readOnly && !dashed && dispatch(selectAnnotation(ann.id))}
          onDragEnd={(e) => {
            const node = e.target;
            dispatch(
              updateAnnotation({
                id: ann.id,
                geometry: {
                  x: (node.x() - position.x) / scale,
                  y: (node.y() - position.y) / scale,
                  width: g.width,
                  height: g.height,
                },
              })
            );
          }}
          onTransformEnd={(e) => {
            const node = e.target;
            dispatch(
              updateAnnotation({
                id: ann.id,
                geometry: {
                  x: (node.x() - position.x) / scale,
                  y: (node.y() - position.y) / scale,
                  width: (node.width() * node.scaleX()) / scale,
                  height: (node.height() * node.scaleY()) / scale,
                },
              })
            );
            node.scaleX(1);
            node.scaleY(1);
          }}
        />
      );
    }

    if (ann.type === "polygon" && ann.geometry.points) {
      const flat = ann.geometry.points.flatMap((p) => [
        p.x * scale + position.x,
        p.y * scale + position.y,
      ]);
      return (
        <Line
          key={ann.id}
          id={`ann-${ann.id}`}
          points={flat}
          closed
          stroke={color}
          strokeWidth={isSelected ? 3 : 2}
          dash={dashed ? [6, 4] : undefined}
          fill={color + "33"}
          onClick={() => !readOnly && !dashed && dispatch(selectAnnotation(ann.id))}
        />
      );
    }
    return null;
  };

  const imgW = image?.width || 800;
  const imgH = image?.height || 600;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] bg-slate-900 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDblClick={() => activeTool === "polygon" && finishPolygon()}
        style={{ cursor: isPanning ? "grabbing" : activeTool === "select" ? "default" : "crosshair" }}
      >
        <Layer>
          <Group x={position.x} y={position.y} scaleX={scale} scaleY={scale}>
            {image && <KonvaImage image={image} width={imgW} height={imgH} />}
          </Group>
          {prelabels.map((p) =>
            renderAnnotation(
              {
                id: p.id,
                labelClassId: p.labelClassId,
                labelClassName: p.labelClassName,
                labelClassColor: p.labelClassColor,
                type: p.type,
                geometry: p.geometry,
                source: "prelabel",
              },
              true
            )
          )}
          {annotations.map((ann) => renderAnnotation(ann))}
          {draftBbox && draftBbox.width !== undefined && (
            <Rect
              x={draftBbox.x! * scale + position.x}
              y={draftBbox.y! * scale + position.y}
              width={draftBbox.width! * scale}
              height={draftBbox.height! * scale}
              stroke={activeLabelClassColor}
              strokeWidth={2}
              dash={[4, 4]}
            />
          )}
          {polygonPoints.map((p, i) => (
            <Circle
              key={i}
              x={p.x * scale + position.x}
              y={p.y * scale + position.y}
              radius={4}
              fill={activeLabelClassColor}
            />
          ))}
          {polygonPoints.length > 0 && (
            <Line
              points={polygonPoints.flatMap((p) => [p.x * scale + position.x, p.y * scale + position.y])}
              stroke={activeLabelClassColor}
              strokeWidth={2}
              dash={[4, 4]}
            />
          )}
          {!readOnly && <Transformer ref={transformerRef} />}
        </Layer>
      </Stage>
      {!readOnly && activeTool === "polygon" && polygonPoints.length > 0 && (
        <div className="absolute bottom-3 left-3 text-xs bg-black/70 px-3 py-1 rounded">
          Click to add points · Double-click or Enter to finish · Esc to cancel
        </div>
      )}
    </div>
  );
}
