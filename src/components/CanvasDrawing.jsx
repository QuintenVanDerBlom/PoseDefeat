import { useEffect, useRef } from "react";
import { PoseLandmarker, HandLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

function CanvasDrawing({ poseData }) {
    const canvasRef = useRef(null)
    const drawingUtilsRef = useRef(null)

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d')
        drawingUtilsRef.current = new DrawingUtils(ctx)
    }, [])

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d')
        if(drawingUtilsRef.current) {
            ctx.clearRect(0, 0, 480, 270)
            for (const hand of poseData) {
                drawingUtilsRef.current.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, {color: "#00FF00",lineWidth: 5});
                drawingUtilsRef.current.drawLandmarks(hand, { radius: 4, color: "#FF0000", lineWidth: 2 });
            }
        }
    }, [poseData]);

    return (
        <canvas ref={canvasRef} width="480" height="270"></canvas>
    )
}

export default CanvasDrawing