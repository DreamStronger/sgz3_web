/**
 * 事件日志系统
 * 记录游戏中的各种事件和操作
 */

export type EventType = 'info' | 'warning' | 'success' | 'error' | 'battle' | 'diplomacy' | 'economy';

export interface GameEvent {
  id: string;
  type: EventType;
  timestamp: number;
  turn: number;
  message: string;
  details?: string;
}

class EventLogSystemClass {
  private events: GameEvent[] = [];
  private maxEvents: number = 100;
  private listeners: Set<(events: GameEvent[]) => void> = new Set();

  // 添加事件
  addEvent(
    type: EventType,
    message: string,
    details?: string,
    turn?: number
  ): void {
    const event: GameEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      turn: turn || 0,
      message,
      details,
    };

    this.events.unshift(event);

    // 保持事件数量限制
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    this.notifyListeners();
  }

  // 获取所有事件
  getEvents(): GameEvent[] {
    return [...this.events];
  }

  // 获取最近N条事件
  getRecentEvents(count: number = 20): GameEvent[] {
    return this.events.slice(0, count);
  }

  // 清空事件
  clearEvents(): void {
    this.events = [];
    this.notifyListeners();
  }

  // 添加监听器
  addListener(listener: (events: GameEvent[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.events]));
  }

  // 便捷方法
  info(message: string, details?: string, turn?: number): void {
    this.addEvent('info', message, details, turn);
  }

  success(message: string, details?: string, turn?: number): void {
    this.addEvent('success', message, details, turn);
  }

  warning(message: string, details?: string, turn?: number): void {
    this.addEvent('warning', message, details, turn);
  }

  error(message: string, details?: string, turn?: number): void {
    this.addEvent('error', message, details, turn);
  }

  battle(message: string, details?: string, turn?: number): void {
    this.addEvent('battle', message, details, turn);
  }

  diplomacy(message: string, details?: string, turn?: number): void {
    this.addEvent('diplomacy', message, details, turn);
  }

  economy(message: string, details?: string, turn?: number): void {
    this.addEvent('economy', message, details, turn);
  }

  // 获取事件类型图标
  getEventIcon(type: EventType): string {
    const icons: Record<EventType, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
      battle: '⚔️',
      diplomacy: '🤝',
      economy: '💰',
    };
    return icons[type] || 'ℹ️';
  }

  // 获取事件类型颜色
  getEventColor(type: EventType): string {
    const colors: Record<EventType, string> = {
      info: 'text-blue-300',
      warning: 'text-yellow-300',
      success: 'text-green-300',
      error: 'text-red-300',
      battle: 'text-orange-300',
      diplomacy: 'text-purple-300',
      economy: 'text-amber-300',
    };
    return colors[type] || 'text-gray-300';
  }
}

export const EventLogSystem = new EventLogSystemClass();
