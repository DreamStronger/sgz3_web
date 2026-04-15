import type { Army, City } from '@/types';

/**
 * 粮草消耗等级
 */
export enum FoodShortageLevel {
  NONE = 'none',           // 充足
  LIGHT = 'light',         // 轻度不足
  MODERATE = 'moderate',   // 中度不足
  SEVERE = 'severe',       // 严重不足
  CRITICAL = 'critical'    // 完全断粮
}

/**
 * 粮草消耗结果
 */
export interface FoodConsumptionResult {
  totalConsumption: number;      // 总消耗
  remainingFood: number;          // 剩余粮草
  shortageLevel: FoodShortageLevel; // 不足等级
  moralePenalty: number;          // 士气惩罚
  soldierLoss: number;            // 士兵逃亡数量
  message: string;                // 消息
}

/**
 * 粮草运输状态
 */
export interface SupplyTransport {
  id: string;
  fromCity: string;       // 出发城市ID
  toCity: string;         // 目标城市ID
  foodAmount: number;     // 运输粮草数量
  progress: number;       // 运输进度 (0-100)
  turnsRemaining: number; // 剩余回合数
  status: 'ongoing' | 'completed' | 'intercepted';
}

/**
 * 后勤补给系统
 * 管理粮草消耗、运输、补给线路
 */
export class SupplySystem {
  /**
   * 计算军队粮草消耗
   */
  static calculateArmyFoodConsumption(army: Army): number {
    let totalSoldiers = 0;
    
    // 计算总兵力
    army.units.forEach(unit => {
      totalSoldiers += unit.count;
    });
    
    // 基础消耗：每100士兵每回合消耗1粮草
    let consumption = Math.ceil(totalSoldiers / 100);
    
    // 状态影响
    if (army.status === 'moving') {
      // 移动时额外消耗50%
      consumption = Math.floor(consumption * 1.5);
    } else if (army.status === 'fighting') {
      // 战斗时消耗加倍
      consumption *= 2;
    }
    
    // 疲劳度影响：疲劳度越高，消耗越大
    if (army.fatigue > 60) {
      consumption = Math.floor(consumption * 1.2);
    }
    
    return consumption;
  }

  /**
   * 计算城市粮草消耗
   */
  static calculateCityFoodConsumption(city: City): number {
    // 城市驻军消耗
    const soldiers = city.resources.soldiers;
    let consumption = Math.ceil(soldiers / 100);
    
    // 人口消耗（每1000人口消耗0.5粮草）
    consumption += Math.floor(city.stats.population / 2000);
    
    return consumption;
  }

  /**
   * 检查粮草不足等级
   */
  static checkFoodShortage(availableFood: number, requiredFood: number): FoodShortageLevel {
    const ratio = availableFood / requiredFood;
    
    if (ratio >= 1) {
      return FoodShortageLevel.NONE;
    } else if (ratio >= 0.7) {
      return FoodShortageLevel.LIGHT;
    } else if (ratio >= 0.4) {
      return FoodShortageLevel.MODERATE;
    } else if (ratio >= 0.1) {
      return FoodShortageLevel.SEVERE;
    } else {
      return FoodShortageLevel.CRITICAL;
    }
  }

  /**
   * 应用粮草消耗
   */
  static applyFoodConsumption(
    currentFood: number,
    requiredFood: number,
    currentMorale: number
  ): FoodConsumptionResult {
    const shortageLevel = this.checkFoodShortage(currentFood, requiredFood);
    let moralePenalty = 0;
    let soldierLoss = 0;
    let message = '';
    let remainingFood = Math.max(0, currentFood - requiredFood);
    
    switch (shortageLevel) {
      case FoodShortageLevel.NONE:
        message = '粮草充足，士气稳定。';
        break;
        
      case FoodShortageLevel.LIGHT:
        moralePenalty = -5;
        message = '粮草轻度不足，士气小幅下降。';
        break;
        
      case FoodShortageLevel.MODERATE:
        moralePenalty = -10;
        soldierLoss = Math.floor(currentMorale * 0.05); // 5%士兵逃亡
        message = '粮草中度不足，士气下降，部分士兵逃亡。';
        break;
        
      case FoodShortageLevel.SEVERE:
        moralePenalty = -20;
        soldierLoss = Math.floor(currentMorale * 0.1); // 10%士兵逃亡
        message = '粮草严重不足，士气大幅下降，大量士兵逃亡！';
        break;
        
      case FoodShortageLevel.CRITICAL:
        moralePenalty = -30;
        soldierLoss = Math.floor(currentMorale * 0.2); // 20%士兵逃亡
        message = '完全断粮！军队濒临哗变，士兵大量逃亡！';
        break;
    }
    
    return {
      totalConsumption: Math.min(currentFood, requiredFood),
      remainingFood,
      shortageLevel,
      moralePenalty,
      soldierLoss,
      message
    };
  }

  /**
   * 计算粮草运输时间
   */
  static calculateTransportTime(
    fromCity: City,
    toCity: City,
    distance: number
  ): number {
    // 基础时间：距离/100（每100距离1回合）
    let turns = Math.ceil(distance / 100);
    
    // 地形影响
    if (fromCity.terrain === 'mountain' || toCity.terrain === 'mountain') {
      turns += 1;
    }
    
    // 最少1回合
    return Math.max(1, turns);
  }

  /**
   * 计算运输队容量
   */
  static calculateTransportCapacity(soldiers: number): number {
    // 每100士兵可运输100粮草
    return soldiers * 1;
  }

  /**
   * 计算运输消耗
   */
  static calculateTransportCost(foodAmount: number, distance: number): number {
    // 运输消耗：粮草数量的5% + 距离相关消耗
    return Math.floor(foodAmount * 0.05 + distance * 0.1);
  }

  /**
   * 检查是否可以运输
   */
  static canTransport(
    fromCity: City,
    _toCity: City, // 预留参数，未来用于路径检查
    foodAmount: number,
    availableSoldiers: number
  ): { canTransport: boolean; reason?: string } {
    // 检查粮草数量
    if (fromCity.resources.food < foodAmount) {
      return { canTransport: false, reason: '粮草不足' };
    }
    
    // 检查运输能力
    const capacity = this.calculateTransportCapacity(availableSoldiers);
    if (capacity < foodAmount) {
      return { canTransport: false, reason: `运输能力不足，需要${Math.ceil(foodAmount / 100)}士兵` };
    }
    
    // 检查城市是否相邻或通过己方领土连接
    // TODO: 实现路径检查
    
    return { canTransport: true };
  }

  /**
   * 计算补给线路效率
   */
  static calculateSupplyLineEfficiency(
    cities: City[],
    path: string[]
  ): number {
    if (path.length === 0) return 0;
    
    let efficiency = 100;
    
    // 每经过一个城市，效率降低5%
    efficiency -= (path.length - 1) * 5;
    
    // 检查路径上的城市是否安全
    path.forEach(cityId => {
      const city = cities.find(c => c.id === cityId);
      if (city) {
        // 民心低的城市效率降低
        if (city.stats.morale < 50) {
          efficiency -= 10;
        }
        // 防御低的城市效率降低
        if (city.stats.defense < 30) {
          efficiency -= 5;
        }
      }
    });
    
    return Math.max(0, efficiency);
  }

  /**
   * 检查补给线路是否被切断
   */
  static isSupplyLineCut(
    cities: Record<string, City>,
    path: string[],
    playerFaction: string
  ): boolean {
    for (const cityId of path) {
      const city = cities[cityId];
      if (!city) continue;
      
      // 如果路径上有城市不属于玩家势力，补给线被切断
      if (city.faction !== playerFaction) {
        return true;
      }
      
      // 如果城市被围攻（TODO: 实现围攻系统）
      // if (city.isUnderSiege) return true;
    }
    
    return false;
  }

  /**
   * 计算粮草补给优先级
   */
  static calculateSupplyPriority(
    city: City,
    armies: Army[]
  ): number {
    let priority = 0;
    
    // 粮草储备低的城市优先级高
    if (city.resources.food < 1000) {
      priority += 50;
    } else if (city.resources.food < 5000) {
      priority += 30;
    }
    
    // 有军队的城市优先级高
    const cityArmies = armies.filter(a => a.location === city.id);
    if (cityArmies.length > 0) {
      priority += 20;
    }
    
    // 边境城市优先级高
    // TODO: 判断是否为边境城市
    
    // 战略要地优先级高
    if (city.terrain === 'pass') {
      priority += 15;
    }
    
    return priority;
  }
}
