/**
 * 外交系统
 * 管理势力间的外交关系和行动
 */

import type { Faction, General } from '@/types';

/**
 * 外交状态
 */
export enum DiplomacyStatus {
  ALLY = 'ally',       // 同盟
  NEUTRAL = 'neutral', // 中立
  ENEMY = 'enemy',     // 敌对
  TRUCE = 'truce'      // 停战
}

/**
 * 外交行动类型
 */
export enum DiplomacyAction {
  ALLIANCE = 'alliance',       // 结盟
  DECLARE_WAR = 'declareWar',  // 宣战
  PEACE = 'peace',             // 求和
  TRUCE = 'truce',             // 停战
  SOW_DISCORD = 'sowDiscord',  // 离间
  BRIBE = 'bribe',             // 贿赂
  THREATEN = 'threaten'        // 威胁
}

/**
 * 外交行动结果
 */
export interface DiplomacyResult {
  success: boolean;
  message: string;
  relationChange?: number;
  newStatus?: DiplomacyStatus;
  effects?: {
    moneyCost?: number;
    loyaltyChange?: number;
    generalChange?: string;
  };
}

/**
 * 外交提议
 */
export interface DiplomacyProposal {
  fromFaction: string;
  toFaction: string;
  action: DiplomacyAction;
  turn: number;
  params?: Record<string, unknown>;
}

/**
 * 外交系统
 */
export class DiplomacySystem {
  /**
   * 获取外交状态
   */
  static getDiplomacyStatus(
    faction1: Faction,
    faction2Id: string
  ): DiplomacyStatus {
    const diplomacy = faction1.diplomacy?.[faction2Id];
    return diplomacy?.status as DiplomacyStatus || DiplomacyStatus.NEUTRAL;
  }

  /**
   * 获取关系值
   */
  static getRelationValue(
    faction1: Faction,
    faction2Id: string
  ): number {
    const diplomacy = faction1.diplomacy?.[faction2Id];
    return diplomacy?.relation || 0;
  }

  /**
   * 更新外交关系
   */
  static updateRelation(
    faction: Faction,
    targetFactionId: string,
    change: number,
    newStatus?: DiplomacyStatus
  ): void {
    const diplomacy = { ...faction.diplomacy };
    const current = diplomacy[targetFactionId] || {
      relation: 0,
      status: DiplomacyStatus.NEUTRAL
    };

    diplomacy[targetFactionId] = {
      relation: Math.max(-100, Math.min(100, current.relation + change)),
      status: newStatus || current.status
    };

    return;
  }

  /**
   * 提议结盟
   */
  static proposeAlliance(
    fromFaction: Faction,
    toFaction: Faction,
    generals: Record<string, General>
  ): DiplomacyResult {
    const currentStatus = this.getDiplomacyStatus(fromFaction, toFaction.id);
    const relationValue = this.getRelationValue(fromFaction, toFaction.id);

    // 检查当前状态
    if (currentStatus === DiplomacyStatus.ALLY) {
      return {
        success: false,
        message: '已经是同盟关系'
      };
    }

    if (currentStatus === DiplomacyStatus.ENEMY) {
      return {
        success: false,
        message: '处于敌对状态，无法结盟'
      };
    }

    // 计算成功率
    const ruler = generals[fromFaction.ruler];
    
    let successRate = 30; // 基础成功率
    
    // 关系值影响
    successRate += relationValue * 0.5;
    
    // 魅力影响
    if (ruler) {
      successRate += ruler.attributes.charm * 0.2;
    }
    
    // 目标势力规模影响
    const sizeRatio = fromFaction.cities.length / Math.max(1, toFaction.cities.length);
    if (sizeRatio > 1.5) {
      successRate += 10; // 实力强，更容易接受
    } else if (sizeRatio < 0.5) {
      successRate -= 20; // 实力弱，对方可能看不上
    }

    const success = Math.random() * 100 < successRate;

    if (success) {
      return {
        success: true,
        message: `${toFaction.name} 同意结盟`,
        relationChange: 20,
        newStatus: DiplomacyStatus.ALLY,
        effects: { moneyCost: 500 }
      };
    } else {
      return {
        success: false,
        message: `${toFaction.name} 拒绝了结盟提议`,
        relationChange: -5
      };
    }
  }

  /**
   * 宣战
   */
  static declareWar(
    fromFaction: Faction,
    toFaction: Faction
  ): DiplomacyResult {
    const currentStatus = this.getDiplomacyStatus(fromFaction, toFaction.id);

    if (currentStatus === DiplomacyStatus.ENEMY) {
      return {
        success: false,
        message: '已经处于交战状态'
      };
    }

    return {
      success: true,
      message: `向 ${toFaction.name} 宣战！`,
      relationChange: -50,
      newStatus: DiplomacyStatus.ENEMY
    };
  }

  /**
   * 求和
   */
  static proposePeace(
    fromFaction: Faction,
    toFaction: Faction,
    generals: Record<string, General>
  ): DiplomacyResult {
    const currentStatus = this.getDiplomacyStatus(fromFaction, toFaction.id);

    if (currentStatus !== DiplomacyStatus.ENEMY) {
      return {
        success: false,
        message: '当前未处于交战状态'
      };
    }

    // 计算成功率
    const ruler = generals[fromFaction.ruler];
    
    let successRate = 40;
    
    // 实力对比
    const myStrength = fromFaction.cities.length + fromFaction.generals.length;
    const theirStrength = toFaction.cities.length + toFaction.generals.length;
    
    if (myStrength < theirStrength * 0.5) {
      successRate += 30; // 弱势求和更容易被接受
    } else if (myStrength > theirStrength * 1.5) {
      successRate -= 20; // 强势求和，对方可能怀疑
    }
    
    // 魅力影响
    if (ruler) {
      successRate += ruler.attributes.charm * 0.1;
    }

    const success = Math.random() * 100 < successRate;

    if (success) {
      return {
        success: true,
        message: `${toFaction.name} 同意停战`,
        relationChange: 10,
        newStatus: DiplomacyStatus.TRUCE,
        effects: { moneyCost: 1000 }
      };
    } else {
      return {
        success: false,
        message: `${toFaction.name} 拒绝了求和`,
        relationChange: -10
      };
    }
  }

  /**
   * 离间计
   */
  static sowDiscord(
    fromFaction: Faction,
    targetFaction: Faction,
    targetGeneral: General,
    generals: Record<string, General>
  ): DiplomacyResult {
    // 检查目标武将
    if (targetGeneral.faction !== targetFaction.id) {
      return {
        success: false,
        message: '目标武将不属于该势力'
      };
    }

    // 计算成功率
    const spyGeneral = Object.values(generals).find(
      g => g.faction === fromFaction.id && g.attributes.intelligence >= 70
    );

    if (!spyGeneral) {
      return {
        success: false,
        message: '没有合适的武将执行离间计'
      };
    }

    let successRate = 30;
    
    // 智力影响
    successRate += spyGeneral.attributes.intelligence * 0.3;
    
    // 目标忠诚度影响
    if (targetGeneral.loyalty < 50) {
      successRate += 20;
    } else if (targetGeneral.loyalty < 70) {
      successRate += 10;
    }
    
    // 目标性格影响
    if (targetGeneral.personality === 'timid') {
      successRate += 15;
    } else if (targetGeneral.personality === 'righteous') {
      successRate -= 20;
    }

    const success = Math.random() * 100 < successRate;

    if (success) {
      const loyaltyDrop = Math.floor(10 + Math.random() * 20);
      return {
        success: true,
        message: `离间成功，${targetGeneral.name} 忠诚度下降 ${loyaltyDrop}`,
        relationChange: -30,
        effects: {
          moneyCost: 800,
          loyaltyChange: -loyaltyDrop
        }
      };
    } else {
      return {
        success: false,
        message: '离间失败，对方识破了计谋',
        relationChange: -20
      };
    }
  }

  /**
   * 贿赂
   */
  static bribe(
    fromFaction: Faction,
    _toFaction: Faction,
    amount: number,
    _generals: Record<string, General>
  ): DiplomacyResult {
    if (fromFaction.resources.money < amount) {
      return {
        success: false,
        message: '金钱不足'
      };
    }

    if (amount < 500) {
      return {
        success: false,
        message: '贿赂金额太少，对方不屑一顾'
      };
    }

    // 计算效果
    const relationIncrease = Math.floor(amount / 100);
    
    return {
      success: true,
      message: `贿赂成功，关系提升 ${relationIncrease}`,
      relationChange: relationIncrease,
      effects: { moneyCost: amount }
    };
  }

  /**
   * 威胁
   */
  static threaten(
    fromFaction: Faction,
    toFaction: Faction,
    generals: Record<string, General>
  ): DiplomacyResult {
    const ruler = generals[fromFaction.ruler];
    
    // 计算实力对比
    const myStrength = fromFaction.cities.length + fromFaction.generals.length;
    const theirStrength = toFaction.cities.length + toFaction.generals.length;
    
    if (myStrength < theirStrength) {
      return {
        success: false,
        message: '实力不足，威胁无效',
        relationChange: -15
      };
    }

    // 成功率
    let successRate = 40;
    
    if (myStrength > theirStrength * 2) {
      successRate += 30;
    } else if (myStrength > theirStrength * 1.5) {
      successRate += 15;
    }
    
    // 武力影响
    if (ruler) {
      successRate += ruler.attributes.force * 0.1;
    }

    const success = Math.random() * 100 < successRate;

    if (success) {
      return {
        success: true,
        message: `${toFaction.name} 被迫屈服`,
        relationChange: -10, // 虽然成功，但关系下降
        effects: { moneyCost: 0 }
      };
    } else {
      return {
        success: false,
        message: `${toFaction.name} 拒绝屈服`,
        relationChange: -25
      };
    }
  }

  /**
   * 劝降武将
   */
  static persuadeGeneral(
    fromFaction: Faction,
    targetGeneral: General,
    generals: Record<string, General>
  ): DiplomacyResult {
    if (targetGeneral.faction) {
      return {
        success: false,
        message: '该武将已有归属'
      };
    }

    const ruler = generals[fromFaction.ruler];
    if (!ruler) {
      return {
        success: false,
        message: '没有君主'
      };
    }

    // 计算成功率
    let successRate = 50;
    
    // 魅力影响
    successRate += ruler.attributes.charm * 0.3;
    
    // 忠诚度影响（自由武将忠诚度代表加入意愿）
    successRate += (100 - targetGeneral.loyalty) * 0.2;
    
    // 性格影响
    if (targetGeneral.personality === 'righteous') {
      successRate += 20;
    } else if (targetGeneral.personality === 'brave') {
      successRate += 10;
    }

    const success = Math.random() * 100 < successRate;

    if (success) {
      return {
        success: true,
        message: `${targetGeneral.name} 同意加入`,
        effects: {
          moneyCost: 200,
          generalChange: targetGeneral.id
        }
      };
    } else {
      return {
        success: false,
        message: `${targetGeneral.name} 拒绝了邀请`
      };
    }
  }

  /**
   * 劝降势力
   */
  static persuadeFaction(
    fromFaction: Faction,
    toFaction: Faction,
    generals: Record<string, General>
  ): DiplomacyResult {
    // 只剩1-2座城市才能劝降
    if (toFaction.cities.length > 2) {
      return {
        success: false,
        message: '对方势力尚存，不会投降'
      };
    }

    // 实力对比
    const myStrength = fromFaction.cities.length + fromFaction.generals.length;
    const theirStrength = toFaction.cities.length + toFaction.generals.length;
    
    if (myStrength < theirStrength * 3) {
      return {
        success: false,
        message: '实力优势不够明显，对方拒绝投降'
      };
    }

    const ruler = generals[fromFaction.ruler];
    const targetRuler = generals[toFaction.ruler];
    
    let successRate = 30;
    
    // 魅力影响
    if (ruler) {
      successRate += ruler.attributes.charm * 0.2;
    }
    
    // 目标君主性格
    if (targetRuler) {
      if (targetRuler.personality === 'timid') {
        successRate += 20;
      } else if (targetRuler.personality === 'righteous') {
        successRate -= 20;
      } else if (targetRuler.personality === 'brave') {
        successRate -= 30;
      }
    }

    const success = Math.random() * 100 < successRate;

    if (success) {
      return {
        success: true,
        message: `${toFaction.name} 投降！`,
        relationChange: 50,
        newStatus: DiplomacyStatus.ALLY
      };
    } else {
      return {
        success: false,
        message: `${toFaction.name} 拒绝投降`,
        relationChange: -20
      };
    }
  }

  /**
   * 检查是否可以攻击
   */
  static canAttack(
    fromFaction: Faction,
    toFactionId: string
  ): boolean {
    const status = this.getDiplomacyStatus(fromFaction, toFactionId);
    return status === DiplomacyStatus.ENEMY || status === DiplomacyStatus.NEUTRAL;
  }

  /**
   * 检查是否可以结盟
   */
  static canAlly(
    fromFaction: Faction,
    toFactionId: string
  ): boolean {
    const status = this.getDiplomacyStatus(fromFaction, toFactionId);
    return status === DiplomacyStatus.NEUTRAL;
  }

  /**
   * 获取外交状态描述
   */
  static getStatusDescription(status: DiplomacyStatus): string {
    const descriptions: Record<DiplomacyStatus, string> = {
      [DiplomacyStatus.ALLY]: '同盟',
      [DiplomacyStatus.NEUTRAL]: '中立',
      [DiplomacyStatus.ENEMY]: '敌对',
      [DiplomacyStatus.TRUCE]: '停战'
    };
    return descriptions[status];
  }

  /**
   * 获取关系描述
   */
  static getRelationDescription(value: number): string {
    if (value >= 80) return '亲密';
    if (value >= 50) return '友好';
    if (value >= 20) return '友善';
    if (value >= -20) return '中立';
    if (value >= -50) return '冷淡';
    if (value >= -80) return '敌视';
    return '仇恨';
  }
}
