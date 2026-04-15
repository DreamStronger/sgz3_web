/**
 * 历史事件系统
 * 管理历史事件的触发和效果
 */

import type { Faction, General, City, Item } from '@/types';

/**
 * 事件类型
 */
export enum EventType {
  HISTORICAL = 'historical',   // 历史事件
  RANDOM = 'random',           // 随机事件
  DISASTER = 'disaster',       // 灾害事件
  BLESSING = 'blessing'        // 吉祥事件
}

/**
 * 事件触发条件
 */
export interface EventCondition {
  turn?: number;               // 特定回合
  turnMin?: number;            // 最小回合
  turnMax?: number;            // 最大回合
  faction?: string;            // 特定势力
  city?: string;               // 特定城市
  general?: string;            // 特定武将
  generalLocation?: string;    // 武将位置
  factionCities?: number;      // 势力城市数
  factionGenerals?: number;    // 势力武将数
  custom?: string;             // 自定义条件
}

/**
 * 事件效果
 */
export interface EventEffect {
  type: 'add_general' | 'add_item' | 'change_relation' | 'change_loyalty' | 
        'change_resource' | 'change_stat' | 'message';
  target?: string;
  params?: Record<string, unknown>;
}

/**
 * 历史事件
 */
export interface HistoricalEvent {
  id: string;
  name: string;
  type: EventType;
  description: string;
  conditions: EventCondition[];
  effects: EventEffect[];
  choices?: {
    id: string;
    text: string;
    effects: EventEffect[];
  }[];
  repeatable: boolean;
  priority: number;           // 优先级（越高越先检查）
}

/**
 * 事件触发结果
 */
export interface EventTriggerResult {
  event: HistoricalEvent;
  triggered: boolean;
  message: string;
  effects?: EventEffect[];
  choice?: string;
}

/**
 * 历史事件系统
 */
export class EventSystem {
  private static events: HistoricalEvent[] = [];
  private static triggeredEvents: Set<string> = new Set();

  /**
   * 初始化事件
   */
  static initializeEvents(): void {
    this.events = [
      // 三顾茅庐
      {
        id: 'three_visits',
        name: '三顾茅庐',
        type: EventType.HISTORICAL,
        description: '刘备三次拜访诸葛亮，终于请得卧龙出山。',
        conditions: [
          { faction: 'liu_bei' },
          { city: 'xin_ye' },
          { turnMin: 1 }
        ],
        effects: [
          { type: 'add_general', params: { generalId: 'zhuge_liang', loyalty: 100 } },
          { type: 'message', params: { text: '诸葛亮加入刘备阵营！' } }
        ],
        repeatable: false,
        priority: 100
      },

      // 赤壁之战
      {
        id: 'red_cliff',
        name: '赤壁之战',
        type: EventType.HISTORICAL,
        description: '孙刘联军在赤壁大败曹操，奠定三国鼎立之势。',
        conditions: [
          { custom: 'red_cliff_conditions' }
        ],
        effects: [
          { type: 'change_relation', params: { faction1: 'sun_quan', faction2: 'liu_bei', change: 30 } },
          { type: 'change_relation', params: { faction1: 'sun_quan', faction2: 'cao_cao', change: -50 } },
          { type: 'message', params: { text: '赤壁之战爆发！曹操大败！' } }
        ],
        repeatable: false,
        priority: 90
      },

      // 灾害事件
      {
        id: 'drought',
        name: '旱灾',
        type: EventType.DISASTER,
        description: '天降大旱，农田颗粒无收。',
        conditions: [
          { turnMin: 5 }
        ],
        effects: [
          { type: 'change_resource', params: { resource: 'food', change: -1000 } },
          { type: 'message', params: { text: '旱灾降临，粮草损失惨重！' } }
        ],
        repeatable: true,
        priority: 50
      },

      {
        id: 'plague',
        name: '瘟疫',
        type: EventType.DISASTER,
        description: '瘟疫蔓延，百姓疾苦。',
        conditions: [
          { turnMin: 10 }
        ],
        effects: [
          { type: 'change_resource', params: { resource: 'soldiers', change: -500 } },
          { type: 'change_stat', params: { stat: 'morale', change: -20 } },
          { type: 'message', params: { text: '瘟疫爆发，士兵和民心大幅下降！' } }
        ],
        repeatable: true,
        priority: 50
      },

      // 吉祥事件
      {
        id: 'harvest',
        name: '丰收',
        type: EventType.BLESSING,
        description: '风调雨顺，五谷丰登。',
        conditions: [],
        effects: [
          { type: 'change_resource', params: { resource: 'food', change: 2000 } },
          { type: 'message', params: { text: '今年丰收，粮草大幅增加！' } }
        ],
        repeatable: true,
        priority: 40
      },

      {
        id: 'talent_appear',
        name: '人才现世',
        type: EventType.BLESSING,
        description: '有贤才愿意投奔。',
        conditions: [
          { factionCities: 3 }
        ],
        effects: [
          { type: 'message', params: { text: '有人才愿意投奔！' } }
        ],
        repeatable: true,
        priority: 45
      }
    ];
  }

  /**
   * 检查事件触发
   */
  static checkEvents(
    turn: number,
    faction: Faction,
    cities: Record<string, City>,
    generals: Record<string, General>
  ): EventTriggerResult[] {
    const results: EventTriggerResult[] = [];

    // 按优先级排序
    const sortedEvents = [...this.events].sort((a, b) => b.priority - a.priority);

    for (const event of sortedEvents) {
      // 检查是否已触发且不可重复
      if (!event.repeatable && this.triggeredEvents.has(event.id)) {
        continue;
      }

      // 检查条件
      const triggered = this.checkConditions(event.conditions, turn, faction, cities, generals);

      if (triggered) {
        this.triggeredEvents.add(event.id);
        results.push({
          event,
          triggered: true,
          message: event.description,
          effects: event.effects
        });
      }
    }

    return results;
  }

  /**
   * 检查事件条件
   */
  private static checkConditions(
    conditions: EventCondition[],
    turn: number,
    faction: Faction,
    cities: Record<string, City>,
    generals: Record<string, General>
  ): boolean {
    for (const condition of conditions) {
      if (condition.turn !== undefined && turn !== condition.turn) {
        return false;
      }

      if (condition.turnMin !== undefined && turn < condition.turnMin) {
        return false;
      }

      if (condition.turnMax !== undefined && turn > condition.turnMax) {
        return false;
      }

      if (condition.faction !== undefined && faction.id !== condition.faction) {
        return false;
      }

      if (condition.factionCities !== undefined && faction.cities.length < condition.factionCities) {
        return false;
      }

      if (condition.factionGenerals !== undefined && faction.generals.length < condition.factionGenerals) {
        return false;
      }

      if (condition.custom !== undefined) {
        // 自定义条件检查
        const customResult = this.checkCustomCondition(condition.custom, faction, cities, generals);
        if (!customResult) {
          return false;
        }
      }
    }

    // 随机概率（灾害和吉祥事件有随机性）
    return true;
  }

  /**
   * 检查自定义条件
   */
  private static checkCustomCondition(
    condition: string,
    faction: Faction,
    _cities: Record<string, City>,
    _generals: Record<string, General>
  ): boolean {
    switch (condition) {
      case 'red_cliff_conditions':
        // 赤壁之战条件：孙权和刘备存在，曹操势力强大
        // 简化处理
        return faction.id === 'sun_quan' && Math.random() < 0.3;

      default:
        return true;
    }
  }

  /**
   * 执行事件效果
   */
  static executeEffects(
    effects: EventEffect[],
    _faction: Faction,
    _cities: Record<string, City>,
    generals: Record<string, General>,
    items: Record<string, Item>
  ): string[] {
    const messages: string[] = [];

    for (const effect of effects) {
      switch (effect.type) {
        case 'add_general':
          // 添加武将
          const generalId = effect.params?.generalId as string;
          if (generalId && generals[generalId]) {
            // 实际添加逻辑在gameStore中处理
            messages.push(`武将 ${generals[generalId].name} 加入阵营`);
          }
          break;

        case 'add_item':
          // 添加宝物
          const itemId = effect.params?.itemId as string;
          if (itemId && items[itemId]) {
            messages.push(`获得宝物 ${items[itemId].name}`);
          }
          break;

        case 'change_relation':
          // 改变关系
          messages.push('外交关系发生变化');
          break;

        case 'change_loyalty':
          // 改变忠诚度
          const targetGeneral = effect.target;
          const loyaltyChange = effect.params?.change as number;
          if (targetGeneral && generals[targetGeneral]) {
            messages.push(`${generals[targetGeneral].name} 忠诚度变化 ${loyaltyChange}`);
          }
          break;

        case 'change_resource':
          // 改变资源
          const resource = effect.params?.resource as string;
          const change = effect.params?.change as number;
          messages.push(`${resource} 变化 ${change}`);
          break;

        case 'change_stat':
          // 改变属性
          const stat = effect.params?.stat as string;
          const statChange = effect.params?.change as number;
          messages.push(`${stat} 变化 ${statChange}`);
          break;

        case 'message':
          // 显示消息
          messages.push(effect.params?.text as string);
          break;
      }
    }

    return messages;
  }

  /**
   * 获取所有事件
   */
  static getAllEvents(): HistoricalEvent[] {
    return this.events;
  }

  /**
   * 获取已触发事件
   */
  static getTriggeredEvents(): string[] {
    return Array.from(this.triggeredEvents);
  }

  /**
   * 重置事件系统
   */
  static reset(): void {
    this.triggeredEvents.clear();
  }

  /**
   * 添加自定义事件
   */
  static addEvent(event: HistoricalEvent): void {
    this.events.push(event);
  }

  /**
   * 移除事件
   */
  static removeEvent(eventId: string): void {
    this.events = this.events.filter(e => e.id !== eventId);
  }
}

// 初始化事件
EventSystem.initializeEvents();
