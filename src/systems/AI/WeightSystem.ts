/**
 * AI决策权重系统
 * 管理和调整AI决策的各项权重
 */

import { 
  ThreatLevel, 
  OpportunityLevel, 
  ResourceScarcity, 
  FactionScale,
  SituationAssessment 
} from './SituationEvaluator';
import { AIDifficulty } from './AISystem';

/**
 * AI决策权重配置
 */
export interface AIDecisionWeights {
  // 内政权重
  developEconomy: number;    // 发展经济权重（0-100）
  developMilitary: number;   // 发展军事权重（0-100）
  developDefense: number;    // 发展防御权重（0-100）

  // 军事权重
  attack: number;            // 进攻权重（0-100）
  defend: number;            // 防守权重（0-100）
  recruit: number;           // 征兵权重（0-100）

  // 外交权重
  alliance: number;          // 结盟权重（0-100）
  declareWar: number;        // 宣战权重（0-100）
  diplomacy: number;         // 外交活动权重（0-100）

  // 武将权重
  recruitGeneral: number;    // 招募武将权重（0-100）
  promoteGeneral: number;    // 封官晋升权重（0-100）
  searchItem: number;        // 搜索宝物权重（0-100）
}

/**
 * 权重系统
 */
export class WeightSystem {
  /**
   * 获取基础权重
   */
  static getBaseWeights(): AIDecisionWeights {
    return {
      // 内政
      developEconomy: 50,
      developMilitary: 50,
      developDefense: 50,

      // 军事
      attack: 50,
      defend: 50,
      recruit: 50,

      // 外交
      alliance: 50,
      declareWar: 50,
      diplomacy: 50,

      // 武将
      recruitGeneral: 50,
      promoteGeneral: 50,
      searchItem: 50
    };
  }

  /**
   * 根据局势调整权重
   */
  static adjustBySituation(
    weights: AIDecisionWeights,
    assessment: SituationAssessment
  ): AIDecisionWeights {
    const adjustedWeights = { ...weights };

    // 根据威胁等级调整
    adjustedWeights.defend = this.adjustByThreat(
      weights.defend, 
      assessment.overallThreat
    );
    adjustedWeights.attack = this.adjustByThreatReverse(
      weights.attack, 
      assessment.overallThreat
    );

    // 根据机会等级调整
    adjustedWeights.attack = this.adjustByOpportunity(
      adjustedWeights.attack,
      assessment.overallOpportunity
    );

    // 根据资源紧缺度调整
    adjustedWeights.developEconomy = this.adjustByScarcity(
      weights.developEconomy,
      assessment.overallScarcity
    );
    adjustedWeights.recruit = this.adjustByScarcityReverse(
      weights.recruit,
      assessment.resourceNeeds.soldiers
    );

    // 根据势力规模调整
    adjustedWeights.attack = this.adjustByScale(
      adjustedWeights.attack,
      assessment.scale
    );
    adjustedWeights.developEconomy = this.adjustByScaleReverse(
      adjustedWeights.developEconomy,
      assessment.scale
    );

    // 根据战略建议调整
    if (assessment.strategicAdvice) {
      switch (assessment.strategicAdvice.focus) {
        case 'economy':
          adjustedWeights.developEconomy = Math.min(100, adjustedWeights.developEconomy + 20);
          break;
        case 'military':
          adjustedWeights.recruit = Math.min(100, adjustedWeights.recruit + 20);
          adjustedWeights.attack = Math.min(100, adjustedWeights.attack + 10);
          break;
        case 'defense':
          adjustedWeights.defend = Math.min(100, adjustedWeights.defend + 30);
          adjustedWeights.developDefense = Math.min(100, adjustedWeights.developDefense + 20);
          break;
        case 'expansion':
          adjustedWeights.attack = Math.min(100, adjustedWeights.attack + 30);
          adjustedWeights.recruit = Math.min(100, adjustedWeights.recruit + 10);
          break;
      }
    }

    return adjustedWeights;
  }

  /**
   * 根据威胁等级调整权重（正向）
   */
  private static adjustByThreat(weight: number, threat: ThreatLevel): number {
    const adjustments: Record<ThreatLevel, number> = {
      [ThreatLevel.NONE]: 0,
      [ThreatLevel.LOW]: 10,
      [ThreatLevel.MEDIUM]: 20,
      [ThreatLevel.HIGH]: 50,
      [ThreatLevel.CRITICAL]: 70
    };
    return Math.min(100, weight + adjustments[threat]);
  }

  /**
   * 根据威胁等级调整权重（反向）
   */
  private static adjustByThreatReverse(weight: number, threat: ThreatLevel): number {
    const adjustments: Record<ThreatLevel, number> = {
      [ThreatLevel.NONE]: 20,
      [ThreatLevel.LOW]: 10,
      [ThreatLevel.MEDIUM]: 0,
      [ThreatLevel.HIGH]: -20,
      [ThreatLevel.CRITICAL]: -30
    };
    return Math.max(0, Math.min(100, weight + adjustments[threat]));
  }

  /**
   * 根据机会等级调整权重
   */
  private static adjustByOpportunity(weight: number, opportunity: OpportunityLevel): number {
    const adjustments: Record<OpportunityLevel, number> = {
      [OpportunityLevel.NONE]: 0,
      [OpportunityLevel.LOW]: 10,
      [OpportunityLevel.MEDIUM]: 20,
      [OpportunityLevel.HIGH]: 40,
      [OpportunityLevel.EXCELLENT]: 60
    };
    return Math.min(100, weight + adjustments[opportunity]);
  }

  /**
   * 根据紧缺度调整权重（正向）
   */
  private static adjustByScarcity(weight: number, scarcity: ResourceScarcity): number {
    const adjustments: Record<ResourceScarcity, number> = {
      [ResourceScarcity.ABUNDANT]: 0,
      [ResourceScarcity.NORMAL]: 10,
      [ResourceScarcity.MODERATE]: 20,
      [ResourceScarcity.SEVERE]: 40,
      [ResourceScarcity.CRITICAL]: 60
    };
    return Math.min(100, weight + adjustments[scarcity]);
  }

  /**
   * 根据紧缺度调整权重（反向）
   */
  private static adjustByScarcityReverse(weight: number, scarcity: ResourceScarcity): number {
    const adjustments: Record<ResourceScarcity, number> = {
      [ResourceScarcity.ABUNDANT]: 20,
      [ResourceScarcity.NORMAL]: 10,
      [ResourceScarcity.MODERATE]: 0,
      [ResourceScarcity.SEVERE]: -10,
      [ResourceScarcity.CRITICAL]: -20
    };
    return Math.max(0, Math.min(100, weight + adjustments[scarcity]));
  }

  /**
   * 根据势力规模调整权重
   */
  private static adjustByScale(weight: number, scale: FactionScale): number {
    const adjustments: Record<FactionScale, number> = {
      [FactionScale.SMALL]: -20,
      [FactionScale.MEDIUM]: 0,
      [FactionScale.LARGE]: 20,
      [FactionScale.HUGE]: 30
    };
    return Math.max(0, Math.min(100, weight + adjustments[scale]));
  }

  /**
   * 根据势力规模调整权重（反向）
   */
  private static adjustByScaleReverse(weight: number, scale: FactionScale): number {
    const adjustments: Record<FactionScale, number> = {
      [FactionScale.SMALL]: 30,
      [FactionScale.MEDIUM]: 10,
      [FactionScale.LARGE]: 0,
      [FactionScale.HUGE]: -10
    };
    return Math.max(0, Math.min(100, weight + adjustments[scale]));
  }

  /**
   * 根据难度调整权重
   */
  static adjustByDifficulty(
    weights: AIDecisionWeights,
    difficulty: AIDifficulty
  ): AIDecisionWeights {
    const adjustedWeights = { ...weights };

    switch (difficulty) {
      case AIDifficulty.EASY:
        // 初级AI：决策保守，权重分散
        adjustedWeights.attack = Math.max(0, weights.attack - 20);
        adjustedWeights.defend = Math.max(0, weights.defend - 10);
        adjustedWeights.developEconomy = Math.min(100, weights.developEconomy + 10);
        break;

      case AIDifficulty.NORMAL:
        // 中级AI：标准权重
        break;

      case AIDifficulty.HARD:
        // 高级AI：决策激进，权重集中
        adjustedWeights.attack = Math.min(100, weights.attack + 20);
        adjustedWeights.recruit = Math.min(100, weights.recruit + 10);
        adjustedWeights.recruitGeneral = Math.min(100, weights.recruitGeneral + 15);
        break;
    }

    return adjustedWeights;
  }

  /**
   * 获取特定类型决策的权重
   */
  static getDecisionWeight(
    weights: AIDecisionWeights,
    decisionType: string
  ): number {
    const weightMap: Record<string, keyof AIDecisionWeights> = {
      'develop': 'developEconomy',
      'recruit': 'recruit',
      'attack': 'attack',
      'defend': 'defend',
      'alliance': 'alliance',
      'declareWar': 'declareWar',
      'recruitGeneral': 'recruitGeneral',
      'promoteGeneral': 'promoteGeneral',
      'searchItem': 'searchItem'
    };

    const key = weightMap[decisionType];
    return key ? weights[key] : 50;
  }

  /**
   * 合并权重（用于多因素影响）
   */
  static mergeWeights(
    base: AIDecisionWeights,
    ...modifiers: Partial<AIDecisionWeights>[]
  ): AIDecisionWeights {
    const result = { ...base };

    modifiers.forEach(modifier => {
      Object.keys(modifier).forEach(key => {
        const k = key as keyof AIDecisionWeights;
        if (modifier[k] !== undefined) {
          result[k] = Math.max(0, Math.min(100, result[k] + (modifier[k] as number)));
        }
      });
    });

    return result;
  }

  /**
   * 计算权重得分
   */
  static calculateWeightScore(
    weights: AIDecisionWeights,
    decisionType: string,
    basePriority: number
  ): number {
    const weight = this.getDecisionWeight(weights, decisionType);
    return (weight / 100) * basePriority;
  }
}
