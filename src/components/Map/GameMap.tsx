import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapStore, useGameStore } from '@/store';
import type { City, Faction, Army } from '@/types';

interface GameMapProps {
  cities: City[];
}

// 缩放范围限制
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

export function GameMap({ cities }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewport, setViewport, setSelectedCity, selectedCity } = useMapStore();
  const { factions, season, weather, armies } = useGameStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const maxWidth = rect.width * 0.9;
      const maxHeight = rect.height * 0.9;
      
      // 保持 2:1 比例，取能完整显示的最大尺寸
      const aspectRatio = 2 / 1;
      let width = maxWidth;
      let height = width / aspectRatio;
      
      // 如果高度超出，则按高度计算
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderMap(ctx);
  }, [cities, viewport, selectedCity, hoveredCity, factions, canvasSize, season, weather, armies]);

  // 地图基础尺寸
  const MAP_WIDTH = 2400;
  const MAP_HEIGHT = 1600;
  // 固定缩放比例，让可视区域比地图小，需要拖拽查看
  const BASE_SCALE = 0.6; // 基础缩放比例，控制地图显示范围

  // 缩放处理
  const handleZoom = useCallback((delta: number) => {
    setViewport({
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.zoom + delta))
    });
  }, [viewport.zoom, setViewport]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    handleZoom(delta);
  }, [handleZoom]);

  const renderMap = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;
    ctx.clearRect(0, 0, width, height);
    
    // 使用固定缩放比例
    const scale = BASE_SCALE * viewport.zoom;
    
    ctx.save();
    // 先移动到canvas中心
    ctx.translate(width / 2, height / 2);
    // 应用缩放
    ctx.scale(scale, scale);
    // 应用拖拽偏移（在缩放后的坐标系中）
    ctx.translate(viewport.x, viewport.y);
    // 移动回地图中心
    ctx.translate(-MAP_WIDTH / 2, -MAP_HEIGHT / 2);
    
    // 绘制州属区域
    drawStateRegions(ctx);
    
    // 绘制城市间连线
    drawCityConnections(ctx);
    
    // 绘制城市（保留交互功能）
    cities.forEach(city => drawCity(ctx, city));
    
    // 绘制军队
    drawArmies(ctx);
    
    ctx.restore();
    
    // 绘制边框和标题
    drawBorder(ctx, width, height);
    drawTitle(ctx);
  };


  const drawStateRegions = (ctx: CanvasRenderingContext2D) => {
    // 州颜色映射
    const stateColors: Record<string, { fill: string; stroke: string }> = {
      '司隶': { fill: 'rgba(180, 100, 100, 0.2)', stroke: 'rgba(220, 120, 120, 0.5)' },
      '雍州': { fill: 'rgba(100, 150, 180, 0.2)', stroke: 'rgba(120, 180, 220, 0.5)' },
      '益州': { fill: 'rgba(100, 180, 100, 0.2)', stroke: 'rgba(120, 220, 120, 0.5)' },
      '荆州': { fill: 'rgba(180, 180, 100, 0.2)', stroke: 'rgba(220, 220, 120, 0.5)' },
      '扬州': { fill: 'rgba(100, 180, 180, 0.2)', stroke: 'rgba(120, 220, 220, 0.5)' },
      '豫州': { fill: 'rgba(180, 130, 100, 0.2)', stroke: 'rgba(220, 160, 120, 0.5)' },
      '冀州': { fill: 'rgba(150, 100, 180, 0.2)', stroke: 'rgba(180, 120, 220, 0.5)' },
      '并州': { fill: 'rgba(180, 150, 100, 0.2)', stroke: 'rgba(220, 180, 120, 0.5)' },
      '幽州': { fill: 'rgba(100, 130, 180, 0.2)', stroke: 'rgba(120, 160, 220, 0.5)' },
      '徐州': { fill: 'rgba(150, 180, 130, 0.2)', stroke: 'rgba(180, 220, 160, 0.5)' },
    };
    
    // 手动定义每个州的边界多边形（确保相邻州共享边界点）
    const statePolygons: Record<string, { x: number; y: number }[]> = {
      '雍州': [
        { x: 50, y: 50 }, { x: 400, y: 50 }, { x: 700, y: 200 },
        { x: 700, y: 500 }, { x: 500, y: 700 }, { x: 500, y: 900 },
        { x: 300, y: 900 }, { x: 50, y: 900 }, { x: 30, y: 660 }
      ],
      '并州': [
        { x: 400, y: 50 }, { x: 800, y: 20 }, { x: 1300, y: 50 },
        { x: 1300, y: 200 }, { x: 1100, y: 300 }, { x: 900, y: 400 },
        { x: 700, y: 500 }, { x: 700, y: 200 }
      ],
      '幽州': [
        { x: 1300, y: 50 }, { x: 1850, y: 20 }, { x: 2350, y: 50 },
        { x: 2350, y: 400 }, { x: 1700, y: 500 }, { x: 1700, y: 230 },
        { x: 1300, y: 200 }
      ],
      '冀州': [
        { x: 700, y: 500 }, { x: 900, y: 400 }, { x: 1100, y: 300 },
        { x: 1300, y: 200 }, { x: 1700, y: 230 }, { x: 1700, y: 500 },
        { x: 1700, y: 700 }, { x: 1300, y: 800 }, { x: 1300, y: 700 },
        
      ],
      '司隶': [
        { x: 500, y: 700 }, { x: 700, y: 500 }, { x: 1300, y: 700 },
        { x: 1300, y: 800 }, { x: 1100, y: 900 }, { x: 900, y: 1000 },
        { x: 700, y: 1000 }, { x: 500, y: 900 }
      ],
      '益州': [
        { x: 50, y: 900 }, { x: 300, y: 900 }, { x: 500, y: 900 },
        { x: 700, y: 1000 }, { x: 900, y: 1000 }, { x: 600, y: 1350 },
        { x: 600, y: 1500 }, { x: 300, y: 1550 }, { x: 50, y: 1550 },
        { x: 10, y: 1450 }
      ],
      '荆州': [
        { x: 900, y: 1000 }, { x: 600, y: 1350 }, { x: 600, y: 1500 },
        { x: 1100, y: 1400 }, { x: 1400, y: 1350 }, { x: 1400, y: 1100 }, 
        { x: 1100, y: 900 }
      ],
      '豫州': [
        { x: 1300, y: 800 }, { x: 1700, y: 700 }, { x: 1800, y: 900 }, 
        { x: 1800, y: 1200 }, { x: 1500, y: 1300 }, { x: 1400, y: 1100 }, 
        { x: 1100, y: 900 }
      ],
      '徐州': [
        { x: 1700, y: 500 }, { x: 2350, y: 400 }, { x: 2350, y: 700 },
        { x: 2350, y: 1000 }, { x: 2100, y: 1000 }, { x: 1800, y: 900 },
        { x: 1700, y: 700 }
      ],
      '扬州': [
        { x: 1400, y: 1100 }, { x: 1500, y: 1300 }, { x: 1800, y: 1200 },
        { x: 1800, y: 900 }, { x: 2100, y: 1000 }, { x: 2350, y: 1000 },
        { x: 2350, y: 1200 }, { x: 2350, y: 1550 }, { x: 1700, y: 1550 },
        { x: 1400, y: 1350 }
      ]
    };
    
    // 绘制每个州的区域
    Object.entries(statePolygons).forEach(([state, polygon]) => {
      const colors = stateColors[state] || { fill: 'rgba(60, 80, 120, 0.2)', stroke: 'rgba(100, 140, 200, 0.5)' };
      
      if (polygon.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = colors.fill;
        ctx.fill();
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制州名
        const centerX = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length;
        const centerY = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length;
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.font = 'bold 24px "SimSun", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state, centerX, centerY);
      }
    });
  };

  const drawCityConnections = (ctx: CanvasRenderingContext2D) => {
    const drawnPairs = new Set<string>();
    
    cities.forEach(city => {
      const cityX = city.position.x;
      const cityY = city.position.y;
      
      city.neighbors.forEach(neighborId => {
        const pairKey = [city.id, neighborId].sort().join('-');
        if (drawnPairs.has(pairKey)) return;
        drawnPairs.add(pairKey);
        
        const neighbor = cities.find(c => c.id === neighborId);
        if (!neighbor) return;
        
        const neighborX = neighbor.position.x;
        const neighborY = neighbor.position.y;
        
        // 连线阴影
        ctx.beginPath();
        ctx.moveTo(cityX, cityY);
        ctx.lineTo(neighborX, neighborY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 连线主体（虚线）
        ctx.beginPath();
        ctx.moveTo(cityX, cityY);
        ctx.lineTo(neighborX, neighborY);
        ctx.strokeStyle = 'rgba(200, 180, 140, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });
  };

  const drawCity = (ctx: CanvasRenderingContext2D, city: City) => {
    // 直接使用城市原始坐标
    const x = city.position.x;
    const y = city.position.y;
    
    const isSelected = selectedCity === city.id;
    const isHovered = hoveredCity === city.id;
    const faction = factions[city.faction] as Faction | undefined;
    const size = isSelected ? 20 : (isHovered ? 18 : 16);
    
    // 选中或悬停时的光晕效果
    if (isSelected || isHovered) {
      const gc = faction?.color || '#ffd700';
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size+25);
      gradient.addColorStop(0, gc+'50');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size+25, 0, Math.PI*2);
      ctx.fill();
    }
    
    // 外圈（势力色）
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fillStyle = faction?.color || '#c9a227';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 中圈（深色）
    ctx.beginPath();
    ctx.arc(x, y, size-4, 0, Math.PI*2);
    ctx.fillStyle = '#1a2332';
    ctx.fill();
    
    // 内圈（势力色）
    ctx.beginPath();
    ctx.arc(x, y, size-7, 0, Math.PI*2);
    ctx.fillStyle = faction?.color || '#ffd700';
    ctx.fill();
    
    // 中心点（白色）
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // 选中时的金色边框
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, size+5, 0, Math.PI*2);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // 城市名称
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = isSelected ? 'bold 24px "SimSun", serif' : '22px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(city.name, x, y+size+10);
    ctx.shadowBlur = 0;
    
    // 士兵数量
    if (city.resources.soldiers > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px "Microsoft YaHei"';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${Math.floor(city.resources.soldiers/1000)}k`, x, y-size-8);
      ctx.shadowBlur = 0;
    }
  };
  
  // 绘制军队
  const drawArmies = (ctx: CanvasRenderingContext2D) => {
    Object.values(armies).forEach(army => {
      const city = cities.find(c => c.id === army.location);
      if (!city) return;
      
      const faction = factions[army.faction] as Faction | undefined;
      const x = city.position.x;
      const y = city.position.y;
      
      // 计算军队偏移（避免重叠）
      const cityArmies = Object.values(armies).filter(a => a.location === army.location);
      const armyIndex = cityArmies.indexOf(army);
      const offsetAngle = (armyIndex / cityArmies.length) * Math.PI * 2;
      const offsetRadius = 35;
      
      const armyX = x + Math.cos(offsetAngle) * offsetRadius;
      const armyY = y + Math.sin(offsetAngle) * offsetRadius;
      
      // 如果正在移动，绘制移动路径
      if (army.status === 'moving' && army.movement) {
        const movement = army.movement;
        const targetCity = cities.find(c => c.id === movement.targetCity);
        if (targetCity) {
          // 绘制移动路径
          ctx.beginPath();
          ctx.moveTo(armyX, armyY);
          
          // 计算中间点
          const midX = (armyX + targetCity.position.x) / 2;
          const midY = (armyY + targetCity.position.y) / 2;
          ctx.quadraticCurveTo(midX, midY - 20, targetCity.position.x, targetCity.position.y);
          
          ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // 绘制移动进度
          const progressX = armyX + (targetCity.position.x - armyX) * (movement.progress / 100);
          const progressY = armyY + (targetCity.position.y - armyY) * (movement.progress / 100);
          
          ctx.beginPath();
          ctx.arc(progressX, progressY, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // 绘制军队标记
      ctx.beginPath();
      ctx.arc(armyX, armyY, 12, 0, Math.PI * 2);
      ctx.fillStyle = faction?.color || '#ff6b6b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制军队图标（剑）
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚔', armyX, armyY);
      
      // 显示军队兵力
      const totalSoldiers = army.units.reduce((sum, u) => sum + u.count, 0);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Microsoft YaHei"';
      ctx.fillText(`${Math.floor(totalSoldiers / 1000)}k`, armyX, armyY + 20);
      ctx.shadowBlur = 0;
    });
  };

  const drawBorder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 外层边框
    ctx.strokeStyle = 'rgba(200, 180, 140, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width-4, height-4);
    
    // 内层边框
    ctx.strokeStyle = 'rgba(200, 180, 140, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, width-16, height-16);
  };

  const drawTitle = (ctx: CanvasRenderingContext2D) => {
    // 标题背景
    ctx.fillStyle = 'rgba(13, 18, 25, 0.85)';
    ctx.fillRect(15, 15, 140, 70);
    ctx.strokeStyle = 'rgba(200, 180, 140, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, 140, 70);
    
    // 主标题
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 18px "SimSun", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('三国疆域图', 25, 22);
    
    // 季节
    const seasonNames: Record<string, string> = {
      spring: '春',
      summer: '夏',
      autumn: '秋',
      winter: '冬'
    };
    ctx.font = '12px "SimSun", serif';
    ctx.fillStyle = 'rgba(200, 180, 140, 0.8)';
    ctx.fillText(`建安元年 · ${seasonNames[season]}`, 25, 44);
    
    // 天气图标和文字
    const weatherIcons: Record<string, { icon: string; color: string }> = {
      sunny: { icon: '☀', color: '#ffd700' },
      cloudy: { icon: '☁', color: '#a0a0a0' },
      rain: { icon: '🌧', color: '#6090c0' },
      snow: { icon: '❄', color: '#e0e0ff' }
    };
    const weatherInfo = weatherIcons[weather] || weatherIcons.sunny;
    ctx.font = '14px "SimSun", serif';
    ctx.fillStyle = weatherInfo.color;
    ctx.fillText(`${weatherInfo.icon} ${weather === 'sunny' ? '晴' : weather === 'cloudy' ? '阴' : weather === 'rain' ? '雨' : '雪'}`, 25, 62);
    
    ctx.shadowBlur = 0;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // 使用固定缩放比例
    const scale = BASE_SCALE * viewport.zoom;
    
    // 将鼠标坐标转换为地图坐标
    const mouseX = (e.clientX - rect.left - canvasSize.width / 2) / scale - viewport.x + MAP_WIDTH / 2;
    const mouseY = (e.clientY - rect.top - canvasSize.height / 2) / scale - viewport.y + MAP_HEIGHT / 2;
    
    // 检测悬停的城市
    const hovered = cities.find(city => {
      const dx = city.position.x - mouseX;
      const dy = city.position.y - mouseY;
      return Math.sqrt(dx*dx + dy*dy) < 50; // 固定检测范围
    });
    setHoveredCity(hovered?.id || null);
    
    // 拖拽地图
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // 限制拖拽范围
    const maxOffsetX = MAP_WIDTH / 2;
    const maxOffsetY = MAP_HEIGHT / 2;
    
    const newX = viewport.x + dx / scale;
    const newY = viewport.y + dy / scale;
    
    setViewport({ 
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY))
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // 居中地图
  const handleCenter = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // 使用固定缩放比例
    const scale = BASE_SCALE * viewport.zoom;
    
    // 将鼠标坐标转换为地图坐标
    const clickX = (e.clientX - rect.left - canvasSize.width / 2) / scale - viewport.x + MAP_WIDTH / 2;
    const clickY = (e.clientY - rect.top - canvasSize.height / 2) / scale - viewport.y + MAP_HEIGHT / 2;
    
    // 检测点击的城市
    const clicked = cities.find(city => {
      const dx = city.position.x - clickX;
      const dy = city.position.y - clickY;
      return Math.sqrt(dx*dx + dy*dy) < 50;
    });
    setSelectedCity(clicked?.id || null);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border border-[#a09070]/30 rounded-lg"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
          background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0d1f3c 100%)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      {/* 缩放控制按钮 */}
      <div className="absolute top-20 right-4 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(ZOOM_STEP)}
          disabled={viewport.zoom >= MAX_ZOOM}
          className="w-10 h-10 flex items-center justify-center bg-[rgba(13,18,25,0.85)] border border-[rgba(200,180,140,0.5)] rounded-lg hover:bg-[rgba(30,40,60,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="放大"
        >
          <svg className="w-5 h-5 text-[rgba(200,180,140,0.9)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={() => handleZoom(-ZOOM_STEP)}
          disabled={viewport.zoom <= MIN_ZOOM}
          className="w-10 h-10 flex items-center justify-center bg-[rgba(13,18,25,0.85)] border border-[rgba(200,180,140,0.5)] rounded-lg hover:bg-[rgba(30,40,60,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="缩小"
        >
          <svg className="w-5 h-5 text-[rgba(200,180,140,0.9)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button
          onClick={handleCenter}
          className="w-10 h-10 flex items-center justify-center bg-[rgba(13,18,25,0.85)] border border-[rgba(200,180,140,0.5)] rounded-lg hover:bg-[rgba(30,40,60,0.9)] transition-colors"
          title="居中地图"
        >
          <svg className="w-5 h-5 text-[rgba(200,180,140,0.9)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      </div>
      {/* 缩放比例显示 */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-[rgba(13,18,25,0.85)] border border-[rgba(200,180,140,0.5)] rounded text-[rgba(200,180,140,0.9)] text-sm">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
}
