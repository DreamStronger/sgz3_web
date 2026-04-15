/**
 * 性能优化工具
 * 提供渲染优化、内存管理等功能
 */

// 性能监控数据
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
}

// 性能配置
export interface PerformanceConfig {
  targetFPS: number;
  enableOptimization: boolean;
  lowPerformanceMode: boolean;
  maxRenderTime: number;
}

class PerformanceOptimizerClass {
  private config: PerformanceConfig = {
    targetFPS: 60,
    enableOptimization: true,
    lowPerformanceMode: false,
    maxRenderTime: 16 // 16ms for 60fps
  };

  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderTime: 0,
    updateTime: 0
  };

  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsHistory: number[] = [];
  private readonly FPS_HISTORY_SIZE = 60;

  /**
   * 开始帧性能监控
   */
  beginFrame(): void {
    this.lastFrameTime = performance.now();
  }

  /**
   * 结束帧性能监控
   */
  endFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // 计算FPS
    this.metrics.frameTime = frameTime;
    this.metrics.fps = 1000 / frameTime;

    // 记录FPS历史
    this.fpsHistory.push(this.metrics.fps);
    if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
      this.fpsHistory.shift();
    }

    // 检测低性能模式
    if (this.config.enableOptimization) {
      const avgFPS = this.getAverageFPS();
      if (avgFPS < 30 && !this.config.lowPerformanceMode) {
        this.enableLowPerformanceMode();
      } else if (avgFPS > 45 && this.config.lowPerformanceMode) {
        this.disableLowPerformanceMode();
      }
    }

    this.frameCount++;
  }

  /**
   * 获取平均FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    // 更新内存使用（如果可用）
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    return { ...this.metrics };
  }

  /**
   * 启用低性能模式
   */
  private enableLowPerformanceMode(): void {
    this.config.lowPerformanceMode = true;
    console.log('Low performance mode enabled');
  }

  /**
   * 禁用低性能模式
   */
  private disableLowPerformanceMode(): void {
    this.config.lowPerformanceMode = false;
    console.log('Low performance mode disabled');
  }

  /**
   * 是否处于低性能模式
   */
  isLowPerformanceMode(): boolean {
    return this.config.lowPerformanceMode;
  }

  /**
   * 获取配置
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * 设置目标FPS
   */
  setTargetFPS(fps: number): void {
    this.config.targetFPS = Math.max(30, Math.min(120, fps));
    this.config.maxRenderTime = 1000 / this.config.targetFPS;
  }

  /**
   * 切换优化开关
   */
  toggleOptimization(): boolean {
    this.config.enableOptimization = !this.config.enableOptimization;
    return this.config.enableOptimization;
  }

  /**
   * 节流函数
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * 防抖函数
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * 批量处理函数
   * 将多个调用合并为一次批量处理
   */
  batchProcess<T>(
    processor: (items: T[]) => void,
    delay: number = 100
  ): (item: T) => void {
    let batch: T[] = [];
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (item: T) => {
      batch.push(item);
      
      if (!timeout) {
        timeout = setTimeout(() => {
          processor(batch);
          batch = [];
          timeout = null;
        }, delay);
      }
    };
  }

  /**
   * 虚拟列表优化
   * 只渲染可视区域内的元素
   */
  createVirtualList<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ): {
    visibleItems: T[];
    startIndex: number;
    endIndex: number;
    offsetY: number;
  } {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2,
      items.length
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    return {
      visibleItems,
      startIndex,
      endIndex,
      offsetY
    };
  }

  /**
   * 检测是否需要优化
   */
  needsOptimization(): boolean {
    return this.getAverageFPS() < this.config.targetFPS * 0.8;
  }

  /**
   * 清理内存
   */
  cleanupMemory(): void {
    // 清理FPS历史
    if (this.fpsHistory.length > this.FPS_HISTORY_SIZE) {
      this.fpsHistory = this.fpsHistory.slice(-this.FPS_HISTORY_SIZE);
    }

    // 建议浏览器清理内存（如果可用）
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * 性能报告
   */
  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const avgFPS = this.getAverageFPS();
    
    return `
性能报告:
- 当前FPS: ${metrics.fps.toFixed(2)}
- 平均FPS: ${avgFPS.toFixed(2)}
- 帧时间: ${metrics.frameTime.toFixed(2)}ms
- 内存使用: ${metrics.memoryUsage.toFixed(2)}MB
- 低性能模式: ${this.config.lowPerformanceMode ? '是' : '否'}
- 总帧数: ${this.frameCount}
    `.trim();
  }
}

export const PerformanceOptimizer = new PerformanceOptimizerClass();

/**
 * React性能优化Hook
 */
export function usePerformanceOptimization() {
  const metrics = PerformanceOptimizer.getMetrics();
  const isLowPerf = PerformanceOptimizer.isLowPerformanceMode();

  return {
    metrics,
    isLowPerf,
    needsOptimization: PerformanceOptimizer.needsOptimization(),
    report: PerformanceOptimizer.getPerformanceReport()
  };
}

/**
 * 节流渲染Hook
 */
export function useThrottledRender(interval: number = 100) {
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRenderCount(c => c + 1);
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [interval]);

  return renderCount;
}

// 注意：需要在React组件中导入useState和useEffect
import { useState, useEffect } from 'react';