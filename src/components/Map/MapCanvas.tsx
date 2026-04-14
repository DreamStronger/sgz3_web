import { useEffect, useRef } from 'react';

interface MapCanvasProps {
  width?: number;
  height?: number;
}

export function MapCanvas({ width = 800, height = 600 }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 初始化画布
    initCanvas(ctx, width, height);
  }, [width, height]);

  const initCanvas = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 设置背景色
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // 绘制网格（临时占位）
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    
    const gridSize = 32;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 绘制标题
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('三国地图区域', w / 2, h / 2 - 20);
    
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText('地图渲染引擎开发中...', w / 2, h / 2 + 20);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border-2 border-gray-700 rounded-lg game-canvas"
    />
  );
}
