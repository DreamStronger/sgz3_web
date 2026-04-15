/**
 * 君主性格系统
 * 定义君主性格对AI决策的影响
 */

import type { General } from '@/types';
import { AIDecisionWeights } from './WeightSystem';

/**
 * 君主性格类型
 */
export enum RulerPersonality {
  BRAVE = 'brave',        // 刚胆：进攻性强，不易撤退
  TIMID = 'timid',        // 胆小：保守防御，容易求和
  RIGHTEOUS = 'righteous', // 仁义：重视外交和武将忠诚
  CALM = 'calm',          // 冷静：均衡发展，计谋成功率高
  RECKLESS = 'reckless',  // 鲁莽：冲动进攻，容易中计
  NORMAL = 'normal'       // 普通：标准行为模式
}

/**
 * 性格特征
 */
export interface PersonalityTraits {
  attackBonus: number;      // 进攻加成（-30 to +30）
  defendBonus: number;      // 防御加成（-30 to +30）
  diplomacyBonus: number;   // 外交加成（-30 to +30）
  riskTolerance: number;    // 风险承受（0-100）
  loyaltyFocus: number;     // 忠诚度重视（0-100）
  strategyBonus: number;    // 计谋加成（-20 to +20）
}

/**
 * 性格系统
 */
export class PersonalitySystem {
  /**
   * 根据武将属性判断性格
   */
  static getPersonality(general: General): RulerPersonality {
    const { force, intelligence, charm, command } = general.attributes;

    // 根据属性组合判断性格
    if (force >= 85 && command >= 80) {
      return RulerPersonality.BRAVE;
    }
    
    if (intelligence >= 85 && charm >= 75) {
      return RulerPersonality.CALM;
    }
    
    if (charm >= 85 && force < 70) {
      return RulerPersonality.RIGHTEOUS;
    }
    
    if (force >= 80 && intelligence < 60) {
      return RulerPersonality.RECKLESS;
    }
    
    if (command < 60 && force < 60) {
      return RulerPersonality.TIMID;
    }

    return RulerPersonality.NORMAL;
  }

  /**
   * 获取性格特征
   */
  static getPersonalityTraits(personality: RulerPersonality): PersonalityTraits {
    const traitsMap: Record<RulerPersonality, PersonalityTraits> = {
      [RulerPersonality.BRAVE]: {
        attackBonus: 30,
        defendBonus: -20,
        diplomacyBonus: -10,
        riskTolerance: 80,
        loyaltyFocus: 50,
        strategyBonus: 0
      },
      [RulerPersonality.TIMID]: {
        attackBonus: -20,
        defendBonus: 30,
        diplomacyBonus: 20,
        riskTolerance: 20,
        loyaltyFocus: 60,
        strategyBonus: 0
      },
      [RulerPersonality.RIGHTEOUS]: {
        attackBonus: -10,
        defendBonus: 0,
        diplomacyBonus: 30,
        riskTolerance: 40,
        loyaltyFocus: 90,
        strategyBonus: 0
      },
      [RulerPersonality.CALM]: {
        attackBonus: 0,
        defendBonus: 10,
        diplomacyBonus: 10,
        riskTolerance: 50,
        loyaltyFocus: 70,
        strategyBonus: 20
      },
      [RulerPersonality.RECKLESS]: {
        attackBonus: 20,
        defendBonus: -10,
        diplomacyBonus: -20,
        riskTolerance: 90,
        loyaltyFocus: 30,
        strategyBonus: -20
      },
      [RulerPersonality.NORMAL]: {
        attackBonus: 0,
        defendBonus: 0,
        diplomacyBonus: 0,
        riskTolerance: 50,
        loyaltyFocus: 50,
        strategyBonus: 0
      }
    };

    return traitsMap[personality];
  }

  /**
   * 应用性格对权重的影响
   */
  static applyPersonalityWeights(
    personality: RulerPersonality,
    baseWeights: AIDecisionWeights
  ): AIDecisionWeights {
    const traits = this.getPersonalityTraits(personality);
    const weights = { ...baseWeights };

    // 应用进攻/防御加成
    weights.attack = Math.max(0, Math.min(100, weights.attack + traits.attackBonus));
    weights.defend = Math.max(0, Math.min(100, weights.defend + traits.defendBonus));
    
    // 应用外交加成
    weights.alliance = Math.max(0, Math.min(100, weights.alliance + traits.diplomacyBonus));
    weights.diplomacy = Math.max(0, Math.min(100, weights.diplomacy + traits.diplomacyBonus));

    // 根据风险承受调整
    if (traits.riskTolerance >= 70) {
      // 高风险承受：更愿意宣战和进攻
      weights.declareWar = Math.min(100, weights.declareWar + 20);
      weights.recruit = Math.min(100, weights.recruit + 10);
    } else if (traits.riskTolerance <= 30) {
      // 低风险承受：更保守
      weights.declareWar = Math.max(0, weights.declareWar - 20);
      weights.developDefense = Math.min(100, weights.developDefense + 15);
    }

    // 根据忠诚度重视调整
    if (traits.loyaltyFocus >= 70) {
      weights.promoteGeneral = Math.min(100, weights.promoteGeneral + 20);
      weights.recruitGeneral = Math.min(100, weights.recruitGeneral + 10);
    }

    // 根据计谋加成调整
    if (traits.strategyBonus > 0) {
      weights.developEconomy = Math.min(100, weights.developEconomy + 10);
    } else if (traits.strategyBonus < 0) {
      weights.recruit = Math.min(100, weights.recruit + 10);
    }

    return weights;
  }

  /**
   * 获取性格描述
   */
  static getPersonalityDescription(personality: RulerPersonality): string {
    const descriptions: Record<RulerPersonality, string> = {
      [RulerPersonality.BRAVE]: '刚胆：勇猛果敢，善于进攻，但有时过于冒险',
      [RulerPersonality.TIMID]: '胆小：谨慎保守，重视防御，但可能错失良机',
      [RulerPersonality.RIGHTEOUS]: '仁义：仁德爱民，重视人才，善于外交',
      [RulerPersonality.CALM]: '冷静：深谋远虑，均衡发展，善于用计',
      [RulerPersonality.RECKLESS]: '鲁莽：冲动急躁，勇猛但易中计',
      [RulerPersonality.NORMAL]: '普通：中规中矩，按常理行事'
    };

    return descriptions[personality];
  }

  /**
   * 获取性格对战斗的影响
   */
  static getCombatModifiers(personality: RulerPersonality): {
    attackModifier: number;
    defenseModifier: number;
    moraleModifier: number;
    retreatThreshold: number;
  } {
    const modifiersMap: Record<RulerPersonality, {
      attackModifier: number;
      defenseModifier: number;
      moraleModifier: number;
      retreatThreshold: number;
    }> = {
      [RulerPersonality.BRAVE]: {
        attackModifier: 10,
        defenseModifier: -5,
        moraleModifier: 10,
        retreatThreshold: 20  // 士气低于20才撤退
      },
      [RulerPersonality.TIMID]: {
        attackModifier: -5,
        defenseModifier: 10,
        moraleModifier: -5,
        retreatThreshold: 50  // 士气低于50就撤退
      },
      [RulerPersonality.RIGHTEOUS]: {
        attackModifier: 0,
        defenseModifier: 5,
        moraleModifier: 5,
        retreatThreshold: 35
      },
      [RulerPersonality.CALM]: {
        attackModifier: 5,
        defenseModifier: 5,
        moraleModifier: 0,
        retreatThreshold: 30
      },
      [RulerPersonality.RECKLESS]: {
        attackModifier: 15,
        defenseModifier: -10,
        moraleModifier: 15,
        retreatThreshold: 10  // 几乎不撤退
      },
      [RulerPersonality.NORMAL]: {
        attackModifier: 0,
        defenseModifier: 0,
        moraleModifier: 0,
        retreatThreshold: 30
      }
    };

    return modifiersMap[personality];
  }

  /**
   * 获取性格对单挑接受率的影响
   */
  static getDuelAcceptanceRate(personality: RulerPersonality): number {
    const rates: Record<RulerPersonality, number> = {
      [RulerPersonality.BRAVE]: 90,      // 刚胆：90%接受
      [RulerPersonality.TIMID]: 20,      // 胆小：20%接受
      [RulerPersonality.RIGHTEOUS]: 60,  // 仁义：60%接受
      [RulerPersonality.CALM]: 50,       // 冷静：50%接受
      [RulerPersonality.RECKLESS]: 95,   // 鲁莽：95%接受
      [RulerPersonality.NORMAL]: 50      // 普通：50%接受
    };

    return rates[personality];
  }

  /**
   * 获取性格对计谋抵抗的影响
   */
  static getStratagemResistance(personality: RulerPersonality): number {
    const resistances: Record<RulerPersonality, number> = {
      [RulerPersonality.BRAVE]: 0,       // 刚胆：无加成
      [RulerPersonality.TIMID]: 10,      // 胆小：+10%
      [RulerPersonality.RIGHTEOUS]: 10,  // 仁义：+10%
      [RulerPersonality.CALM]: 30,       // 冷静：+30%
      [RulerPersonality.RECKLESS]: -20,  // 鲁莽：-20%
      [RulerPersonality.NORMAL]: 0       // 普通：无加成
    };

    return resistances[personality];
  }

  /**
   * 判断是否应该接受外交提议
   */
  static shouldAcceptDiplomacy(
    personality: RulerPersonality,
    proposalType: 'alliance' | 'peace' | 'truce',
    relationValue: number
  ): boolean {
    const baseChance = relationValue > 0 ? 60 : 30;

    const modifiers: Record<RulerPersonality, Record<string, number>> = {
      [RulerPersonality.BRAVE]: {
        alliance: -10,
        peace: -20,
        truce: -10
      },
      [RulerPersonality.TIMID]: {
        alliance: 20,
        peace: 30,
        truce: 20
      },
      [RulerPersonality.RIGHTEOUS]: {
        alliance: 20,
        peace: 10,
        truce: 10
      },
      [RulerPersonality.CALM]: {
        alliance: 10,
        peace: 10,
        truce: 10
      },
      [RulerPersonality.RECKLESS]: {
        alliance: -20,
        peace: -30,
        truce: -20
      },
      [RulerPersonality.NORMAL]: {
        alliance: 0,
        peace: 0,
        truce: 0
      }
    };

    const finalChance = baseChance + modifiers[personality][proposalType];
    return Math.random() * 100 < finalChance;
  }
}
