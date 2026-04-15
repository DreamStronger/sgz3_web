/**
 * 间谍系统
 * 管理间谍活动和情报收集
 */

import type { City, General } from '@/types';

/**
 * 间谍状态
 */
export enum SpyStatus {
  ACTIVE = 'active',       // 活动中
  CAPTURED = 'captured',   // 被捕
  EXTRACTED = 'extracted'  // 已撤离
}

/**
 * 间谍任务类型
 */
export enum SpyMission {
  INTEL = 'intel',         // 收集情报
  SABOTAGE = 'sabotage',   // 破坏活动
  ASSASSINATE = 'assassinate', // 暗杀
  INCITE = 'incite'        // 煽动
}

/**
 * 间谍数据
 */
export interface Spy {
  id: string;
  faction: string;         // 派遣势力
  general: string;         // 执行武将
  targetCity: string;      // 目标城市
  status: SpyStatus;
  mission: SpyMission;
  turnsActive: number;     // 活动回合数
  discovered: boolean;      // 是否被发现
}

/**
 * 情报报告
 */
export interface IntelligenceReport {
  cityId: string;
  cityName: string;
  faction: string;
  resources: {
    money: number;
    food: number;
    soldiers: number;
  };
  defense: number;
  morale: number;
  generals: string[];
  accuracy: number;        // 准确度（0-100）
}

/**
 * 间谍行动结果
 */
export interface SpyActionResult {
  success: boolean;
  message: string;
  intelligence?: IntelligenceReport;
  effects?: {
    defenseChange?: number;
    moraleChange?: number;
    moneyStolen?: number;
    generalKilled?: string;
  };
  spyCaptured?: boolean;
}

/**
 * 间谍系统
 */
export class SpySystem {
  /**
   * 派遣间谍
   */
  static dispatchSpy(
    spyGeneral: General,
    targetCity: City,
    _mission: SpyMission
  ): SpyActionResult {
    // 检查武将状态
    if (spyGeneral.status !== 'active') {
      return {
        success: false,
        message: '武将状态异常，无法执行任务'
      };
    }

    // 检查智力
    if (spyGeneral.attributes.intelligence < 50) {
      return {
        success: false,
        message: '武将智力不足，不适合执行间谍任务'
      };
    }

    // 检查是否是敌方城市
    if (targetCity.faction === spyGeneral.faction) {
      return {
        success: false,
        message: '不能向己方城市派遣间谍'
      };
    }

    return {
      success: true,
      message: `${spyGeneral.name} 已潜入 ${targetCity.name}`
    };
  }

  /**
   * 收集情报
   */
  static gatherIntelligence(
    spyGeneral: General,
    targetCity: City
  ): SpyActionResult {
    // 计算成功率
    let successRate = 50;
    successRate += spyGeneral.attributes.intelligence * 0.4;
    
    // 城市防御影响
    successRate -= targetCity.stats.defense * 0.2;
    
    // 活动回合数影响（越久越危险）
    // successRate -= turnsActive * 5;

    const success = Math.random() * 100 < successRate;

    if (success) {
      // 计算情报准确度
      const accuracy = Math.min(100, 50 + spyGeneral.attributes.intelligence * 0.5);
      
      // 根据准确度生成情报
      const report: IntelligenceReport = {
        cityId: targetCity.id,
        cityName: targetCity.name,
        faction: targetCity.faction,
        resources: {
          money: Math.floor(targetCity.resources.money * (accuracy / 100 + Math.random() * 0.2)),
          food: Math.floor(targetCity.resources.food * (accuracy / 100 + Math.random() * 0.2)),
          soldiers: Math.floor(targetCity.resources.soldiers * (accuracy / 100 + Math.random() * 0.2))
        },
        defense: Math.floor(targetCity.stats.defense * (accuracy / 100 + Math.random() * 0.2)),
        morale: Math.floor(targetCity.stats.morale * (accuracy / 100 + Math.random() * 0.2)),
        generals: accuracy >= 80 ? targetCity.generals : targetCity.generals.slice(0, Math.floor(targetCity.generals.length * accuracy / 100)),
        accuracy
      };

      return {
        success: true,
        message: `成功获取 ${targetCity.name} 的情报`,
        intelligence: report
      };
    } else {
      // 检查是否被发现
      const captureRate = 30 - spyGeneral.attributes.intelligence * 0.2;
      const captured = Math.random() * 100 < captureRate;

      if (captured) {
        return {
          success: false,
          message: `${spyGeneral.name} 在 ${targetCity.name} 被捕！`,
          spyCaptured: true
        };
      } else {
        return {
          success: false,
          message: '情报收集失败，但未被发现'
        };
      }
    }
  }

  /**
   * 破坏活动
   */
  static sabotage(
    spyGeneral: General,
    targetCity: City,
    targetType: 'defense' | 'morale' | 'facility'
  ): SpyActionResult {
    // 计算成功率
    let successRate = 40;
    successRate += spyGeneral.attributes.intelligence * 0.3;
    successRate -= targetCity.stats.defense * 0.15;

    const success = Math.random() * 100 < successRate;

    if (success) {
      let effect = 0;
      let message = '';

      switch (targetType) {
        case 'defense':
          effect = Math.floor(5 + Math.random() * 10);
          message = `成功破坏 ${targetCity.name} 的城防，降低 ${effect} 点`;
          break;
        case 'morale':
          effect = Math.floor(10 + Math.random() * 15);
          message = `成功煽动 ${targetCity.name} 的民心，降低 ${effect} 点`;
          break;
        case 'facility':
          effect = 1;
          message = `成功破坏 ${targetCity.name} 的一处设施`;
          break;
      }

      const effects: Record<string, number> = {};
      if (targetType === 'defense') effects.defenseChange = -effect;
      if (targetType === 'morale') effects.moraleChange = -effect;

      return {
        success: true,
        message,
        effects
      };
    } else {
      const captureRate = 40 - spyGeneral.attributes.intelligence * 0.2;
      const captured = Math.random() * 100 < captureRate;

      if (captured) {
        return {
          success: false,
          message: `${spyGeneral.name} 在进行破坏活动时被捕！`,
          spyCaptured: true
        };
      } else {
        return {
          success: false,
          message: '破坏活动失败，但成功逃脱'
        };
      }
    }
  }

  /**
   * 煽动叛乱
   */
  static inciteRebellion(
    spyGeneral: General,
    _targetCity: City,
    targetGenerals: General[]
  ): SpyActionResult {
    // 找忠诚度低的武将
    const lowLoyaltyGenerals = targetGenerals.filter(g => g.loyalty < 60);

    if (lowLoyaltyGenerals.length === 0) {
      return {
        success: false,
        message: '没有可煽动的武将'
      };
    }

    // 计算成功率
    let successRate = 30;
    successRate += spyGeneral.attributes.intelligence * 0.2;
    successRate += spyGeneral.attributes.charm * 0.2;

    const success = Math.random() * 100 < successRate;

    if (success) {
      const target = lowLoyaltyGenerals[Math.floor(Math.random() * lowLoyaltyGenerals.length)];
      const loyaltyDrop = Math.floor(15 + Math.random() * 20);

      return {
        success: true,
        message: `成功煽动 ${target.name}，忠诚度下降 ${loyaltyDrop}`,
        effects: {
          moraleChange: -10
        }
      };
    } else {
      const captureRate = 50 - spyGeneral.attributes.intelligence * 0.2;
      const captured = Math.random() * 100 < captureRate;

      if (captured) {
        return {
          success: false,
          message: `${spyGeneral.name} 在煽动叛乱时被捕！`,
          spyCaptured: true
        };
      } else {
        return {
          success: false,
          message: '煽动失败，但未被发现'
        };
      }
    }
  }

  /**
   * 反间谍
   */
  static counterIntelligence(
    city: City,
    generals: General[]
  ): { spiesFound: number; message: string } {
    // 找智力高的武将执行反间谍
    const intelGenerals = generals
      .filter(g => city.generals.includes(g.id))
      .sort((a, b) => b.attributes.intelligence - a.attributes.intelligence);

    if (intelGenerals.length === 0) {
      return {
        spiesFound: 0,
        message: '没有合适的武将执行反间谍'
      };
    }

    const bestGeneral = intelGenerals[0];
    
    // 计算发现率
    let discoveryRate = 30;
    discoveryRate += bestGeneral.attributes.intelligence * 0.3;
    discoveryRate += city.stats.defense * 0.1;

    // 简化处理：随机发现间谍
    const spiesFound = Math.random() * 100 < discoveryRate ? 1 : 0;

    return {
      spiesFound,
      message: spiesFound > 0 
        ? `${bestGeneral.name} 发现并抓获了间谍`
        : `${bestGeneral.name} 未发现间谍活动`
    };
  }

  /**
   * 计算派遣成本
   */
  static calculateDispatchCost(_general: General, mission: SpyMission): number {
    const baseCost = 200;
    const missionCost: Record<SpyMission, number> = {
      [SpyMission.INTEL]: 0,
      [SpyMission.SABOTAGE]: 300,
      [SpyMission.ASSASSINATE]: 500,
      [SpyMission.INCITE]: 400
    };

    return baseCost + missionCost[mission];
  }

  /**
   * 计算被发现概率
   */
  static calculateDiscoveryRate(
    spyGeneral: General,
    targetCity: City,
    turnsActive: number
  ): number {
    let rate = 10; // 基础发现率
    
    // 智力降低发现率
    rate -= spyGeneral.attributes.intelligence * 0.1;
    
    // 城市防御提高发现率
    rate += targetCity.stats.defense * 0.1;
    
    // 活动时间越长越容易被发现
    rate += turnsActive * 5;
    
    return Math.max(0, Math.min(100, rate));
  }
}
