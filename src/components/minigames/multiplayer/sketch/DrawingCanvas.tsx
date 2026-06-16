"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Eraser, Trash2, Undo2, Minus, Circle } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────
export interface Stroke {
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

interface DrawingCanvasProps {
    isDrawer: boolean;
    onStroke?: (stroke: Stroke) => void;
    onClear?: () => void;
    incomingStroke?: Stroke | null;
    incomingClear?: number; // increment to trigger clear
    drawerName?: string;
}

// ─── Constants ──────────────────────────────────────────────
const COLORS = [
    { value: "#2A2A2A", label: "Black" },
    { value: "#8D7B68", label: "Cocoa" },
    { value: "#D4A5A5", label: "Rose" },
    { value: "#6B8F71", label: "Sage" },
    { value: "#D4940A", label: "Amber" },
    { value: "#4A6FA5", label: "Blue" },
];

const BRUSH_SIZES = [
    { value: 3, icon: "S" },
    { value: 6, icon: "M" },
    { value: 12, icon: "L" },
];

// ─── Component ──────────────────────────────────────────────
export function DrawingCanvas({
    isDrawer,
    onStroke,
    onClear,
    incomingStroke,
    incomingClear,
    drawerName,
}: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
    const strokeHistoryRef = useRef<Stroke[]>([]);

    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].value);
    const [isEraser, setIsEraser] = useState(false);

    // ─── Canvas Setup ───────────────────────────────────────
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Save current content
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
            // Restore content
            ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        }
    }, []);

    useEffect(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [resizeCanvas]);

    // ─── Drawing helpers ────────────────────────────────────
    const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    }, []);

    const drawStrokeOnCanvas = useCallback((stroke: Stroke) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = stroke.width;
        ctx.strokeStyle = stroke.color;
        ctx.globalCompositeOperation = stroke.color === "#FFFFFF" ? "destination-out" : "source-over";

        if (stroke.points.length < 2) {
            // Single dot
            const p = stroke.points[0];
            if (p) {
                ctx.beginPath();
                ctx.arc(p.x * rect.width, p.y * rect.height, stroke.width / 2, 0, Math.PI * 2);
                ctx.fillStyle = stroke.color;
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        ctx.beginPath();
        const first = stroke.points[0];
        ctx.moveTo(first.x * rect.width, first.y * rect.height);

        for (let i = 1; i < stroke.points.length; i++) {
            const p = stroke.points[i];
            ctx.lineTo(p.x * rect.width, p.y * rect.height);
        }
        ctx.stroke();
        ctx.restore();
    }, []);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokeHistoryRef.current = [];
    }, []);

    const redrawAll = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokeHistoryRef.current.forEach((s) => drawStrokeOnCanvas(s));
    }, [drawStrokeOnCanvas]);

    // ─── Incoming strokes (viewer mode) ─────────────────────
    useEffect(() => {
        if (incomingStroke) {
            strokeHistoryRef.current.push(incomingStroke);
            drawStrokeOnCanvas(incomingStroke);
        }
    }, [incomingStroke, drawStrokeOnCanvas]);

    useEffect(() => {
        if (incomingClear !== undefined && incomingClear > 0) {
            clearCanvas();
        }
    }, [incomingClear, clearCanvas]);

    // ─── Pointer events (drawer mode) ───────────────────────
    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!isDrawer) return;
            e.preventDefault();
            const target = e.currentTarget as HTMLElement;
            target.setPointerCapture(e.pointerId);

            isDrawingRef.current = true;
            const point = getCanvasPoint(e.clientX, e.clientY);
            currentStrokeRef.current = [point];

            // Draw the starting dot
            const color = isEraser ? "#FFFFFF" : selectedColor;
            drawStrokeOnCanvas({ points: [point], color, width: brushSize });
        },
        [isDrawer, getCanvasPoint, isEraser, selectedColor, brushSize, drawStrokeOnCanvas]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDrawer || !isDrawingRef.current) return;
            e.preventDefault();

            const point = getCanvasPoint(e.clientX, e.clientY);
            currentStrokeRef.current.push(point);

            // Draw incrementally (last 2 points)
            const points = currentStrokeRef.current;
            if (points.length >= 2) {
                const color = isEraser ? "#FFFFFF" : selectedColor;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                const rect = canvas.getBoundingClientRect();

                ctx.save();
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth = brushSize;
                ctx.strokeStyle = color;
                ctx.globalCompositeOperation = color === "#FFFFFF" ? "destination-out" : "source-over";
                ctx.beginPath();
                const prev = points[points.length - 2];
                const curr = points[points.length - 1];
                ctx.moveTo(prev.x * rect.width, prev.y * rect.height);
                ctx.lineTo(curr.x * rect.width, curr.y * rect.height);
                ctx.stroke();
                ctx.restore();
            }
        },
        [isDrawer, getCanvasPoint, isEraser, selectedColor, brushSize]
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (!isDrawer || !isDrawingRef.current) return;
            isDrawingRef.current = false;

            try {
                const target = e.currentTarget as HTMLElement;
                target.releasePointerCapture(e.pointerId);
            } catch {}

            const color = isEraser ? "#FFFFFF" : selectedColor;
            const stroke: Stroke = {
                points: [...currentStrokeRef.current],
                color,
                width: brushSize,
            };

            strokeHistoryRef.current.push(stroke);
            currentStrokeRef.current = [];

            onStroke?.(stroke);
        },
        [isDrawer, isEraser, selectedColor, brushSize, onStroke]
    );

    const handleUndo = useCallback(() => {
        if (strokeHistoryRef.current.length === 0) return;
        strokeHistoryRef.current.pop();
        redrawAll();
    }, [redrawAll]);

    const handleClear = useCallback(() => {
        clearCanvas();
        onClear?.();
    }, [clearCanvas, onClear]);

    // ─── Render ─────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
            {/* Drawer label */}
            {!isDrawer && drawerName && (
                <div className="text-center py-1.5 px-3 rounded-full bg-amber-50 border border-amber-200/30 text-[10px] font-bold text-amber-800 self-center">
                    🎨 {drawerName} is drawing...
                </div>
            )}

            {/* Canvas */}
            <div
                ref={containerRef}
                className="flex-1 min-h-0 bg-white rounded-2xl border border-stone-200/60 shadow-inner overflow-hidden relative"
            >
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className={`w-full h-full ${isDrawer ? "cursor-crosshair" : "pointer-events-none"}`}
                    style={{ touchAction: "none" }}
                />
            </div>

            {/* Toolbar (drawer only) */}
            {isDrawer && (
                <div className="flex items-center gap-2 flex-wrap justify-center py-1.5 px-2 bg-white/60 rounded-2xl border border-stone-200/30">
                    {/* Colors */}
                    <div className="flex items-center gap-1">
                        {COLORS.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => {
                                    setSelectedColor(c.value);
                                    setIsEraser(false);
                                }}
                                title={c.label}
                                className={`w-6 h-6 rounded-full border-2 transition-all active:scale-90 ${
                                    !isEraser && selectedColor === c.value
                                        ? "border-warm-cocoa scale-110 shadow-md"
                                        : "border-stone-200/50 hover:scale-105"
                                }`}
                                style={{ backgroundColor: c.value }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-5 bg-stone-200/50" />

                    {/* Eraser */}
                    <button
                        onClick={() => setIsEraser(!isEraser)}
                        title="Eraser"
                        className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                            isEraser
                                ? "bg-amber-100 text-amber-800 border border-amber-300/50"
                                : "bg-white border border-stone-200/40 text-warm-grey/60 hover:text-warm-grey"
                        }`}
                    >
                        <Eraser className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-5 bg-stone-200/50" />

                    {/* Brush sizes */}
                    <div className="flex items-center gap-1">
                        {BRUSH_SIZES.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setBrushSize(s.value)}
                                title={`${s.icon} brush`}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all active:scale-90 ${
                                    brushSize === s.value
                                        ? "bg-warm-cocoa text-white shadow-sm"
                                        : "bg-white border border-stone-200/40 text-warm-grey/60 hover:bg-stone-50"
                                }`}
                            >
                                {s.icon}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-stone-200/50" />

                    {/* Undo & Clear */}
                    <button
                        onClick={handleUndo}
                        title="Undo"
                        className="p-1.5 rounded-lg bg-white border border-stone-200/40 text-warm-grey/60 hover:text-warm-grey transition-all active:scale-90"
                    >
                        <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleClear}
                        title="Clear canvas"
                        className="p-1.5 rounded-lg bg-white border border-stone-200/40 text-warm-grey/60 hover:text-rose-600 transition-all active:scale-90"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
