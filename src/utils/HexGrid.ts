/**
 * 六边形网格工具类
 * 使用轴向坐标系统（Axial Coordinates）管理六边形网格
 */

export interface HexCoordinate {
  q: number; // 列坐标
  r: number; // 行坐标
}

export interface Point {
  x: number;
  y: number;
}

export interface HexCell {
  q: number;
  r: number;
  center: Point;
  vertices: Point[];
  state?: string; // 所属州
  terrain?: 'plain' | 'mountain' | 'water' | 'pass';
  faction?: string; // 所属势力
  cityId?: string; // 包含的城市ID
}

export class HexGrid {
  private hexSize: number; // 六边形外接圆半径
  private origin: Point; // 网格原点
  private cells: Map<string, HexCell> = new Map();
  private flatTop: boolean = true; // 是否为平顶六边形

  constructor(hexSize: number = 50, origin: Point = { x: 0, y: 0 }) {
    this.hexSize = hexSize;
    this.origin = origin;
  }

  /**
   * 获取六边形的唯一键
   */
  private getKey(q: number, r: number): string {
    return `${q},${r}`;
  }

  /**
   * 计算六边形中心点坐标
   */
  hexToPixel(q: number, r: number): Point {
    const size = this.hexSize;
    if (this.flatTop) {
      // 平顶六边形
      const x = size * (3 / 2 * q);
      const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
      return {
        x: this.origin.x + x,
        y: this.origin.y + y
      };
    } else {
      // 尖顶六边形
      const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
      const y = size * (3 / 2 * r);
      return {
        x: this.origin.x + x,
        y: this.origin.y + y
      };
    }
  }

  /**
   * 从像素坐标转换为六边形坐标
   */
  pixelToHex(x: number, y: number): HexCoordinate {
    const px = x - this.origin.x;
    const py = y - this.origin.y;
    const size = this.hexSize;

    let q: number, r: number;

    if (this.flatTop) {
      q = (2 / 3 * px) / size;
      r = (-1 / 3 * px + Math.sqrt(3) / 3 * py) / size;
    } else {
      q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / size;
      r = (2 / 3 * py) / size;
    }

    return this.hexRound(q, r);
  }

  /**
   * 六边形坐标取整（找到最近的六边形中心）
   */
  private hexRound(q: number, r: number): HexCoordinate {
    const s = -q - r;
    
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }

  /**
   * 计算六边形的顶点坐标
   */
  getHexVertices(centerX: number, centerY: number): Point[] {
    const vertices: Point[] = [];
    const size = this.hexSize;

    for (let i = 0; i < 6; i++) {
      const angleDeg = this.flatTop ? 60 * i : 60 * i + 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      
      vertices.push({
        x: centerX + size * Math.cos(angleRad),
        y: centerY + size * Math.sin(angleRad)
      });
    }

    return vertices;
  }

  /**
   * 添加六边形格子
   */
  addCell(q: number, r: number, data?: Partial<HexCell>): HexCell {
    const key = this.getKey(q, r);
    const center = this.hexToPixel(q, r);
    const vertices = this.getHexVertices(center.x, center.y);

    const cell: HexCell = {
      q,
      r,
      center,
      vertices,
      ...data
    };

    this.cells.set(key, cell);
    return cell;
  }

  /**
   * 获取六边形格子
   */
  getCell(q: number, r: number): HexCell | undefined {
    return this.cells.get(this.getKey(q, r));
  }

  /**
   * 获取所有格子
   */
  getAllCells(): HexCell[] {
    return Array.from(this.cells.values());
  }

  /**
   * 获取六边形的相邻格子
   */
  getNeighbors(q: number, r: number): HexCoordinate[] {
    if (this.flatTop) {
      return [
        { q: q + 1, r: r },
        { q: q + 1, r: r - 1 },
        { q: q, r: r - 1 },
        { q: q - 1, r: r },
        { q: q - 1, r: r + 1 },
        { q: q, r: r + 1 }
      ];
    } else {
      return [
        { q: q + 1, r: r },
        { q: q, r: r + 1 },
        { q: q - 1, r: r + 1 },
        { q: q - 1, r: r },
        { q: q, r: r - 1 },
        { q: q + 1, r: r - 1 }
      ];
    }
  }

  /**
   * 计算两个六边形之间的距离
   */
  distance(q1: number, r1: number, q2: number, r2: number): number {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  /**
   * 生成矩形区域的六边形网格
   */
  generateRectangularGrid(width: number, height: number, startQ: number = 0, startR: number = 0): HexCell[] {
    const cells: HexCell[] = [];

    for (let r = startR; r < startR + height; r++) {
      const rOffset = Math.floor(r / 2);
      for (let q = startQ - rOffset; q < startQ - rOffset + width; q++) {
        cells.push(this.addCell(q, r));
      }
    }

    return cells;
  }

  /**
   * 生成六边形区域的网格
   */
  generateHexagonalGrid(radius: number): HexCell[] {
    const cells: HexCell[] = [];

    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      for (let r = r1; r <= r2; r++) {
        cells.push(this.addCell(q, r));
      }
    }

    return cells;
  }

  /**
   * 判断点是否在六边形内
   */
  isPointInHex(px: number, py: number, hexCenter: Point): boolean {
    const dx = Math.abs(px - hexCenter.x);
    const dy = Math.abs(py - hexCenter.y);
    const size = this.hexSize;

    if (this.flatTop) {
      return dx <= size && dy <= size * Math.sqrt(3) / 2 && 
             size * Math.sqrt(3) / 2 - dy >= (dx - size / 2) * Math.sqrt(3);
    } else {
      return dx <= size * Math.sqrt(3) / 2 && dy <= size &&
             size * Math.sqrt(3) / 2 - dx >= (dy - size / 2) * Math.sqrt(3);
    }
  }

  /**
   * 根据像素坐标查找对应的六边形
   */
  findHexAtPoint(px: number, py: number): HexCell | undefined {
    const coord = this.pixelToHex(px, py);
    return this.getCell(coord.q, coord.r);
  }

  /**
   * 获取网格边界
   */
  getBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.cells.forEach(cell => {
      minX = Math.min(minX, cell.center.x - this.hexSize);
      maxX = Math.max(maxX, cell.center.x + this.hexSize);
      minY = Math.min(minY, cell.center.y - this.hexSize);
      maxY = Math.max(maxY, cell.center.y + this.hexSize);
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * 清空网格
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * 获取六边形大小
   */
  getHexSize(): number {
    return this.hexSize;
  }

  /**
   * 设置六边形大小
   */
  setHexSize(size: number): void {
    this.hexSize = size;
    // 重新计算所有格子的中心点和顶点
    this.cells.forEach((cell, key) => {
      const center = this.hexToPixel(cell.q, cell.r);
      cell.center = center;
      cell.vertices = this.getHexVertices(center.x, center.y);
    });
  }
}
