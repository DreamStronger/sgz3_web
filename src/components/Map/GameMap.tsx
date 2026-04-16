import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapStore, useGameStore } from '@/store';
import { HexGrid, HexCell } from '@/utils/HexGrid';
import { ArmyInfoPanel } from '@/components/UI/ArmyInfoPanel';
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
  const [hoveredArmy, setHoveredArmy] = useState<string | null>(null);
  const [selectedArmy, setSelectedArmy] = useState<Army | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });
  const [gridInitialized, setGridInitialized] = useState(false);

  // 地图基础尺寸
  const MAP_WIDTH = 2400;
  const MAP_HEIGHT = 1600;
  const BASE_SCALE = 0.6;

  // 六边形网格配置
  const HEX_SIZE = 80; // 六边形大小
  const hexGridRef = useRef<HexGrid | null>(null);
  const renderCacheRef = useRef<{
    lastViewport: { x: number; y: number; zoom: number } | null;
    needsRedraw: boolean;
  }>({ lastViewport: null, needsRedraw: true });

  // 州颜色映射
  const stateColors: Record<string, { fill: string; stroke: string }> = {
    '司隶': { fill: 'rgba(180, 100, 100, 0.25)', stroke: 'rgba(220, 120, 120, 0.6)' },
    '雍州': { fill: 'rgba(100, 150, 180, 0.25)', stroke: 'rgba(120, 180, 220, 0.6)' },
    '益州': { fill: 'rgba(100, 180, 100, 0.25)', stroke: 'rgba(120, 220, 120, 0.6)' },
    '荆州': { fill: 'rgba(180, 180, 100, 0.25)', stroke: 'rgba(220, 220, 120, 0.6)' },
    '扬州': { fill: 'rgba(100, 180, 180, 0.25)', stroke: 'rgba(120, 220, 220, 0.6)' },
    '豫州': { fill: 'rgba(180, 130, 100, 0.25)', stroke: 'rgba(220, 160, 120, 0.6)' },
    '冀州': { fill: 'rgba(150, 100, 180, 0.25)', stroke: 'rgba(180, 120, 220, 0.6)' },
    '并州': { fill: 'rgba(180, 150, 100, 0.25)', stroke: 'rgba(220, 180, 120, 0.6)' },
    '幽州': { fill: 'rgba(100, 130, 180, 0.25)', stroke: 'rgba(120, 160, 220, 0.6)' },
    '徐州': { fill: 'rgba(150, 180, 130, 0.25)', stroke: 'rgba(180, 220, 160, 0.6)' },
  };

  // 初始化六边形网格
  useEffect(() => {
    const hexGrid = new HexGrid(HEX_SIZE, { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
    
    // 生成覆盖整个地图的六边形网格
    const cols = Math.ceil(MAP_WIDTH / (HEX_SIZE * 1.5)) + 2;
    const rows = Math.ceil(MAP_HEIGHT / (HEX_SIZE * Math.sqrt(3))) + 2;
    
    // 第一步：将城市位置对齐到六边形网格中心
    const cityHexMap = new Map<string, { q: number; r: number; state: string }>();
    
    cities.forEach(city => {
      // 找到城市最近的六边形坐标
      const hexCoord = hexGrid.pixelToHex(city.position.x, city.position.y);
      cityHexMap.set(city.id, {
        q: hexCoord.q,
        r: hexCoord.r,
        state: city.state
      });
    });
    
    // 第二步：生成网格，根据最近城市确定州归属
    for (let r = -rows; r <= rows; r++) {
      const rOffset = Math.floor(r / 2);
      for (let q = -cols - rOffset; q <= cols - rOffset; q++) {
        const center = hexGrid.hexToPixel(q, r);
        
        // 只添加在地图范围内的六边形
        if (center.x >= -HEX_SIZE && center.x <= MAP_WIDTH + HEX_SIZE &&
            center.y >= -HEX_SIZE && center.y <= MAP_HEIGHT + HEX_SIZE) {
          
          // 找到最近的城市，确定州归属
          let nearestState = 'unknown';
          let minDistance = Infinity;
          
          cityHexMap.forEach((cityHex) => {
            // 计算六边形网格距离
            const distance = hexGrid.distance(q, r, cityHex.q, cityHex.r);
            if (distance < minDistance) {
              minDistance = distance;
              nearestState = cityHex.state;
            }
          });
          
          // 确定地形类型
          const terrain = determineTerrain(center.x, center.y);
          
          hexGrid.addCell(q, r, { state: nearestState, terrain });
        }
      }
    }
    
    hexGridRef.current = hexGrid;
    
    // 标记网格已初始化，触发重新渲染
    setGridInitialized(true);
  }, [cities]);

  // 根据坐标确定地形
  const determineTerrain = (x: number, y: number): 'plain' | 'mountain' | 'water' | 'pass' => {
    // 水域区域
    if ((x > 2100 && y > 1100) || (x > 1650 && y > 1350) || (x > 650 && y > 1250)) {
      return 'water';
    }
    // 山地区域
    if ((x < 350 && y < 400) || (x < 200 && y > 1200) || (x > 1100 && x < 1300 && y < 200) || 
        (x > 250 && x < 350 && y > 900 && y < 1100)) {
      return 'mountain';
    }
    // 关隘区域
    if ((x > 900 && x < 1100 && y > 950 && y < 1050)) {
      return 'pass';
    }
    return 'plain';
  };

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const maxWidth = rect.width * 0.9;
      const maxHeight = rect.height * 0.9;
      
      const aspectRatio = 2 / 1;
      let width = maxWidth;
      let height = width / aspectRatio;
      
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
    
    // 检查是否需要重绘（视口变化时）
    const viewportChanged = !renderCacheRef.current.lastViewport ||
      renderCacheRef.current.lastViewport.x !== viewport.x ||
      renderCacheRef.current.lastViewport.y !== viewport.y ||
      renderCacheRef.current.lastViewport.zoom !== viewport.zoom;
    
    if (viewportChanged || renderCacheRef.current.needsRedraw || gridInitialized) {
      renderMap(ctx);
      renderCacheRef.current.lastViewport = { ...viewport };
      renderCacheRef.current.needsRedraw = false;
    }
  }, [cities, viewport, selectedCity, hoveredCity, hoveredArmy, factions, canvasSize, season, weather, armies, gridInitialized]);

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
    
    const scale = BASE_SCALE * viewport.zoom;
    
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(viewport.x, viewport.y);
    ctx.translate(-MAP_WIDTH / 2, -MAP_HEIGHT / 2);
    
    // 绘制六边形网格
    drawHexGrid(ctx);
    
    // 绘制城市间连线
    drawCityConnections(ctx);
    
    // 绘制城市
    cities.forEach(city => drawCity(ctx, city));
    
    // 绘制军队
    drawArmies(ctx);
    
    ctx.restore();
    
    // 绘制边框和标题
    drawBorder(ctx, width, height);
    drawTitle(ctx);
  };

  // 绘制六边形网格
  const drawHexGrid = (ctx: CanvasRenderingContext2D) => {
    if (!hexGridRef.current) return;
    
    const cells = hexGridRef.current.getAllCells();
    
    // 按州分组绘制，减少状态切换
    const stateGroups = new Map<string, HexCell[]>();
    cells.forEach(cell => {
      const state = cell.state || 'unknown';
      if (!stateGroups.has(state)) {
        stateGroups.set(state, []);
      }
      stateGroups.get(state)!.push(cell);
    });
    
    // 绘制每个州的六边形
    stateGroups.forEach((stateCells, state) => {
      const colors = stateColors[state] || { fill: 'rgba(60, 80, 120, 0.2)', stroke: 'rgba(100, 140, 200, 0.5)' };
      
      stateCells.forEach(cell => {
        drawHexCell(ctx, cell, colors);
      });
    });
    
    // 绘制州名标签
    drawStateLabels(ctx, stateGroups);
  };

  // 绘制单个六边形
  const drawHexCell = (ctx: CanvasRenderingContext2D, cell: HexCell, colors: { fill: string; stroke: string }) => {
    const { vertices, center } = cell;
    
    if (vertices.length < 6) return;
    
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    
    // 根据地形调整填充色（增强视觉效果）
    let fillColor = colors.fill;
    let strokeColor = colors.stroke;
    let strokeWidth = 1.5;
    
    if (cell.terrain === 'water') {
      // 水域：深蓝色，高饱和度
      fillColor = 'rgba(40, 100, 160, 0.5)';
      strokeColor = 'rgba(80, 140, 200, 0.8)';
      strokeWidth = 2;
    } else if (cell.terrain === 'mountain') {
      // 山地：深褐色，增加立体感
      fillColor = 'rgba(100, 70, 50, 0.55)';
      strokeColor = 'rgba(140, 100, 70, 0.85)';
      strokeWidth = 2;
    } else if (cell.terrain === 'pass') {
      // 关隘：金色/橙色，醒目突出
      fillColor = 'rgba(180, 120, 60, 0.6)';
      strokeColor = 'rgba(220, 160, 80, 0.9)';
      strokeWidth = 2.5;
    }
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // 绘制地形边框（增强）
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
    
    // 绘制地形装饰（增强视觉效果）
    if (cell.terrain === 'mountain') {
      drawMountainDecoration(ctx, center.x, center.y);
    } else if (cell.terrain === 'water') {
      drawWaterDecoration(ctx, center.x, center.y);
    } else if (cell.terrain === 'pass') {
      drawPassDecoration(ctx, center.x, center.y);
    }
  };

  // 绘制山地装饰（增强）
  const drawMountainDecoration = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 主山峰（大）
    ctx.fillStyle = 'rgba(80, 60, 40, 0.7)';
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 15);
    ctx.lineTo(x - 5, y - 20);
    ctx.lineTo(x + 10, y + 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 90, 60, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 小山峰（左）
    ctx.fillStyle = 'rgba(90, 70, 50, 0.6)';
    ctx.beginPath();
    ctx.moveTo(x - 25, y + 15);
    ctx.lineTo(x - 15, y - 10);
    ctx.lineTo(x - 5, y + 15);
    ctx.closePath();
    ctx.fill();
    
    // 小山峰（右）
    ctx.fillStyle = 'rgba(95, 75, 55, 0.6)';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 15);
    ctx.lineTo(x + 15, y - 8);
    ctx.lineTo(x + 25, y + 15);
    ctx.closePath();
    ctx.fill();
    
    // 山顶雪帽（装饰）
    ctx.fillStyle = 'rgba(220, 220, 230, 0.5)';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 15);
    ctx.lineTo(x - 5, y - 20);
    ctx.lineTo(x + 3, y - 18);
    ctx.lineTo(x + 8, y - 15);
    ctx.closePath();
    ctx.fill();
  };

  // 绘制水域装饰（增强）
  const drawWaterDecoration = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 波纹效果（多层）
    ctx.strokeStyle = 'rgba(100, 180, 240, 0.6)';
    ctx.lineWidth = 2;
    
    // 外圈波纹
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI, true);
    ctx.stroke();
    
    // 内圈波纹
    ctx.strokeStyle = 'rgba(120, 200, 260, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI, true);
    ctx.stroke();
    
    // 波纹细节
    ctx.strokeStyle = 'rgba(140, 220, 280, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - 5, y - 3, 5, 0, Math.PI * 0.8, true);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x + 5, y + 3, 5, Math.PI * 0.2, Math.PI, true);
    ctx.stroke();
  };

  // 绘制关隘装饰（新增）
  const drawPassDecoration = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // 关隘城墙
    ctx.fillStyle = 'rgba(160, 100, 50, 0.8)';
    ctx.fillRect(x - 15, y - 5, 30, 15);
    
    // 墙砖纹理
    ctx.strokeStyle = 'rgba(200, 140, 80, 0.7)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 15, y - 5 + i * 5);
      ctx.lineTo(x + 15, y - 5 + i * 5);
      ctx.stroke();
    }
    
    // 城门
    ctx.fillStyle = 'rgba(40, 30, 20, 0.9)';
    ctx.fillRect(x - 5, y + 2, 10, 8);
    
    // 城门边框
    ctx.strokeStyle = 'rgba(220, 180, 100, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 5, y + 2, 10, 8);
    
    // 旗帜
    ctx.fillStyle = 'rgba(220, 160, 80, 0.9)';
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y - 18);
    ctx.lineTo(x + 8, y - 12);
    ctx.lineTo(x, y - 8);
    ctx.closePath();
    ctx.fill();
    
    // 旗杆
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y - 18);
    ctx.stroke();
  };

  // 绘制州名标签
  const drawStateLabels = (ctx: CanvasRenderingContext2D, stateGroups: Map<string, HexCell[]>) => {
    ctx.save();
    
    stateGroups.forEach((cells, state) => {
      if (state === 'unknown' || cells.length === 0) return;
      
      // 计算州的中心位置
      const centerX = cells.reduce((sum, cell) => sum + cell.center.x, 0) / cells.length;
      const centerY = cells.reduce((sum, cell) => sum + cell.center.y, 0) / cells.length;
      
      // 绘制州名背景
      ctx.fillStyle = 'rgba(13, 18, 25, 0.6)';
      const textWidth = ctx.measureText(state).width + 20;
      ctx.fillRect(centerX - textWidth / 2, centerY - 15, textWidth, 30);
      
      // 绘制州名
      ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
      ctx.font = 'bold 20px "SimSun", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state, centerX, centerY);
    });
    
    ctx.restore();
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
    // 将城市位置对齐到六边形网格中心
    let x = city.position.x;
    let y = city.position.y;
    
    if (hexGridRef.current) {
      const hexCoord = hexGridRef.current.pixelToHex(x, y);
      const hexCenter = hexGridRef.current.hexToPixel(hexCoord.q, hexCoord.r);
      x = hexCenter.x;
      y = hexCenter.y;
    }
    
    const isSelected = selectedCity === city.id;
    const isHovered = hoveredCity === city.id;
    const faction = factions[city.faction] as Faction | undefined;
    const size = isSelected ? 22 : (isHovered ? 20 : 18);
    
    // 选中或悬停时的光晕效果
    if (isSelected || isHovered) {
      const gc = faction?.color || '#ffd700';
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size+20);
      gradient.addColorStop(0, gc+'40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size+20, 0, Math.PI*2);
      ctx.fill();
    }
    
    // 绘制城墙（五边形城堡样式）
    ctx.save();
    ctx.translate(x, y);
    
    // 城墙主体
    ctx.beginPath();
    ctx.moveTo(0, -size); // 顶部
    ctx.lineTo(size, -size * 0.4); // 右上
    ctx.lineTo(size * 0.8, size); // 右下
    ctx.lineTo(-size * 0.8, size); // 左下
    ctx.lineTo(-size, -size * 0.4); // 左上
    ctx.closePath();
    
    // 填充势力色
    ctx.fillStyle = faction?.color || '#c9a227';
    ctx.fill();
    
    // 城墙边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 城墙纹理（砖块效果）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    // 横线
    for (let i = -size + size * 0.3; i < size; i += size * 0.35) {
      ctx.beginPath();
      ctx.moveTo(-size + size * 0.2, i);
      ctx.lineTo(size - size * 0.2, i);
      ctx.stroke();
    }
    
    // 城门（底部中央）
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(-size * 0.25, size * 0.5, size * 0.5, size * 0.5);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size * 0.25, size * 0.5, size * 0.5, size * 0.5);
    
    // 塔楼（左右两侧）
    const towerSize = size * 0.3;
    // 左塔
    ctx.fillStyle = faction?.color || '#c9a227';
    ctx.fillRect(-size - towerSize * 0.5, -size * 0.4, towerSize, size * 0.8);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeRect(-size - towerSize * 0.5, -size * 0.4, towerSize, size * 0.8);
    
    // 右塔
    ctx.fillRect(size - towerSize * 0.5, -size * 0.4, towerSize, size * 0.8);
    ctx.strokeRect(size - towerSize * 0.5, -size * 0.4, towerSize, size * 0.8);
    
    // 旗帜（顶部）
    ctx.fillStyle = faction?.color || '#ffd700';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, -size - size * 0.8);
    ctx.lineTo(size * 0.4, -size - size * 0.5);
    ctx.lineTo(0, -size - size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    ctx.restore();
    
    // 选中时的金色边框
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, size + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // 城市名称
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = isSelected ? 'bold 18px "SimSun", serif' : '16px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(city.name, x, y + size + 12);
    ctx.shadowBlur = 0;
    
    // 士兵数量
    if (city.resources.soldiers > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 12px "Microsoft YaHei"';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${Math.floor(city.resources.soldiers/1000)}k`, x, y - size - 8);
      ctx.shadowBlur = 0;
    }
  };
  
  // 绘制军队
  const drawArmies = (ctx: CanvasRenderingContext2D) => {
    Object.values(armies).forEach(army => {
      const city = cities.find(c => c.id === army.location);
      if (!city) return;
      
      const faction = factions[army.faction] as Faction | undefined;
      const isHovered = hoveredArmy === army.id;
      
      // 使用对齐后的城市位置
      let x = city.position.x;
      let y = city.position.y;
      
      if (hexGridRef.current) {
        const hexCoord = hexGridRef.current.pixelToHex(x, y);
        const hexCenter = hexGridRef.current.hexToPixel(hexCoord.q, hexCoord.r);
        x = hexCenter.x;
        y = hexCenter.y;
      }
      
      // 计算军队偏移（避免重叠）
      const cityArmies = Object.values(armies).filter(a => a.location === army.location);
      const armyIndex = cityArmies.indexOf(army);
      const offsetAngle = (armyIndex / cityArmies.length) * Math.PI * 2;
      const offsetRadius = isHovered ? 40 : 35; // 悬停时稍微远离
      
      const armyX = x + Math.cos(offsetAngle) * offsetRadius;
      const armyY = y + Math.sin(offsetAngle) * offsetRadius;
      
      // 如果正在移动，绘制移动路径
      if (army.status === 'moving' && army.movement) {
        const movement = army.movement;
        const targetCity = cities.find(c => c.id === movement.targetCity);
        if (targetCity) {
          let targetX = targetCity.position.x;
          let targetY = targetCity.position.y;
          
          if (hexGridRef.current) {
            const targetHexCoord = hexGridRef.current.pixelToHex(targetX, targetY);
            const targetHexCenter = hexGridRef.current.hexToPixel(targetHexCoord.q, targetHexCoord.r);
            targetX = targetHexCenter.x;
            targetY = targetHexCenter.y;
          }
          
          // 绘制移动路径
          ctx.beginPath();
          ctx.moveTo(armyX, armyY);
          
          const midX = (armyX + targetX) / 2;
          const midY = (armyY + targetY) / 2;
          ctx.quadraticCurveTo(midX, midY - 20, targetX, targetY);
          
          ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // 绘制移动进度
          const progressX = armyX + (targetX - armyX) * (movement.progress / 100);
          const progressY = armyY + (targetY - armyY) * (movement.progress / 100);
          
          ctx.beginPath();
          ctx.arc(progressX, progressY, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      // 悬停时的光晕效果
      if (isHovered) {
        const gc = faction?.color || '#ff6b6b';
        const gradient = ctx.createRadialGradient(armyX, armyY, 0, armyX, armyY, 40);
        gradient.addColorStop(0, gc + '80');
        gradient.addColorStop(0.5, gc + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(armyX, armyY, 40, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 绘制军队标记（精美旗帜样式）
      const size = isHovered ? 24 : 20;
      
      ctx.save();
      ctx.translate(armyX, armyY);
      
      // 底部光晕（增强显著性）
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
      glowGradient.addColorStop(0, (faction?.color || '#ff6b6b') + '40');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 旗杆阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // 旗杆
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size * 0.6);
      ctx.stroke();
      
      // 旗杆顶部装饰（矛头）
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.moveTo(0, -size - 8);
      ctx.lineTo(-3, -size);
      ctx.lineTo(3, -size);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 重置阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // 主旗帜（大三角旗）
      ctx.fillStyle = faction?.color || '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(0, -size + 2);
      ctx.lineTo(size * 1.2, -size * 0.5);
      ctx.lineTo(size * 1.0, 0);
      ctx.lineTo(0, size * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // 旗帜边框（金色）
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = isHovered ? 2.5 : 2;
      ctx.stroke();
      
      // 旗帜上的装饰纹理
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(size * 0.3, -size * 0.6);
      ctx.lineTo(size * 0.8, -size * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * 0.4, -size * 0.3);
      ctx.lineTo(size * 0.9, 0);
      ctx.stroke();
      
      // 旗帜中央的军徽
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${isHovered ? 14 : 12}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚔', size * 0.5, -size * 0.25);
      
      ctx.restore();
      
      // 显示军队兵力（更大更醒目）
      const totalSoldiers = army.units.reduce((sum, u) => sum + u.count, 0);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = isHovered ? '#ffffff' : '#FFD700';
      ctx.font = `bold ${isHovered ? 14 : 12}px "Microsoft YaHei"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.floor(totalSoldiers / 1000)}k`, armyX, armyY + size + 12);
      ctx.shadowBlur = 0;
      
      // 悬停时显示军队名称（更醒目）
      if (isHovered) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "SimSun", serif';
        ctx.fillText(`${faction?.name || '未知'}军团`, armyX, armyY - size - 20);
        ctx.shadowBlur = 0;
      }
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

  // 获取城市的对齐位置（六边形网格中心）
  const getCityAlignedPosition = (city: City): { x: number; y: number } => {
    if (!hexGridRef.current) {
      return { x: city.position.x, y: city.position.y };
    }
    const hexCoord = hexGridRef.current.pixelToHex(city.position.x, city.position.y);
    return hexGridRef.current.hexToPixel(hexCoord.q, hexCoord.r);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const scale = BASE_SCALE * viewport.zoom;
    
    // 将鼠标坐标转换为地图坐标
    const mouseX = (e.clientX - rect.left - canvasSize.width / 2) / scale - viewport.x + MAP_WIDTH / 2;
    const mouseY = (e.clientY - rect.top - canvasSize.height / 2) / scale - viewport.y + MAP_HEIGHT / 2;
    
    // 检测悬停的军队（优先级高于城市）
    let hoveredArmyId: string | null = null;
    Object.values(armies).forEach(army => {
      const city = cities.find(c => c.id === army.location);
      if (!city) return;
      
      const alignedPos = getCityAlignedPosition(city);
      const cityArmies = Object.values(armies).filter(a => a.location === army.location);
      const armyIndex = cityArmies.indexOf(army);
      const offsetAngle = (armyIndex / cityArmies.length) * Math.PI * 2;
      const offsetRadius = 35;
      
      const armyX = alignedPos.x + Math.cos(offsetAngle) * offsetRadius;
      const armyY = alignedPos.y + Math.sin(offsetAngle) * offsetRadius;
      
      const dx = armyX - mouseX;
      const dy = armyY - mouseY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        hoveredArmyId = army.id;
      }
    });
    
    setHoveredArmy(hoveredArmyId);
    
    // 如果没有悬停军队，检测悬停的城市
    if (!hoveredArmyId) {
      const hovered = cities.find(city => {
        const alignedPos = getCityAlignedPosition(city);
        const dx = alignedPos.x - mouseX;
        const dy = alignedPos.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < 50;
      });
      setHoveredCity(hovered?.id || null);
    } else {
      setHoveredCity(null);
    }
    
    // 拖拽地图
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
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
    
    const scale = BASE_SCALE * viewport.zoom;
    
    // 将鼠标坐标转换为地图坐标
    const clickX = (e.clientX - rect.left - canvasSize.width / 2) / scale - viewport.x + MAP_WIDTH / 2;
    const clickY = (e.clientY - rect.top - canvasSize.height / 2) / scale - viewport.y + MAP_HEIGHT / 2;
    
    // 检测点击的军队（优先级高于城市）
    let clickedArmy: Army | null = null;
    Object.values(armies).forEach(army => {
      const city = cities.find(c => c.id === army.location);
      if (!city) return;
      
      const alignedPos = getCityAlignedPosition(city);
      const cityArmies = Object.values(armies).filter(a => a.location === army.location);
      const armyIndex = cityArmies.indexOf(army);
      const offsetAngle = (armyIndex / cityArmies.length) * Math.PI * 2;
      const offsetRadius = 35;
      
      const armyX = alignedPos.x + Math.cos(offsetAngle) * offsetRadius;
      const armyY = alignedPos.y + Math.sin(offsetAngle) * offsetRadius;
      
      const dx = armyX - clickX;
      const dy = armyY - clickY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        clickedArmy = army;
      }
    });
    
    if (clickedArmy) {
      // 显示军队信息面板
      setSelectedArmy(clickedArmy);
      setSelectedCity(null);
    } else {
      // 检测点击的城市（使用对齐后的位置）
      const clicked = cities.find(city => {
        const alignedPos = getCityAlignedPosition(city);
        const dx = alignedPos.x - clickX;
        const dy = alignedPos.y - clickY;
        return Math.sqrt(dx * dx + dy * dy) < 50;
      });
      setSelectedCity(clicked?.id || null);
      setSelectedArmy(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-[#a09070]/30 rounded-lg"
          style={{ 
            cursor: hoveredArmy ? 'pointer' : (isDragging ? 'grabbing' : 'grab'),
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
        
      {/* 军队信息面板 */}
      {selectedArmy && (
        <ArmyInfoPanel 
          army={selectedArmy}
          onClose={() => setSelectedArmy(null)}
        />
      )}
        
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
    </div>
  );
}
