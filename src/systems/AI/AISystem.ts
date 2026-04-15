/**
 * AI决策系统
 * 负责AI势力的每回合决策流程
 */

import type { GameState } from '@/types';
import { SituationEvaluator, SituationAssessment } from './SituationEvaluator';
import { DecisionGenerator, AIDecision } from './DecisionGenerator';
import { WeightSystem, AIDecisionWeights } from './WeightSystem';
import { PersonalitySystem } from './PersonalitySystem';

/**
 * AI难度等级
 */
export enum AIDifficulty {
  EASY = 'easy',      // 初级：决策质量低，反应慢
  NORMAL = 'normal',  // 中级：决策质量中等
  HARD = 'hard'       // 高级：决策质量高，反应快
}

/**
 * AI配置
 */
export interface AIConfig {
  difficulty: AIDifficulty;
  enabled: boolean;
}

/**
 * AI决策结果
 */
export interface AITurnDecision {
  factionId: string;
  decisions: AIDecision[];
  assessment: SituationAssessment;
}

/**
 * AI系统主类
 */
export class AISystem {
  private static instance: AISystem;
  private config: AIConfig = {
    difficulty: AIDifficulty.NORMAL,
    enabled: true
  };

  private constructor() {}

  static getInstance(): AISystem {
    if (!AISystem.instance) {
      AISystem.instance = new AISystem();
    }
    return AISystem.instance;
  }

  /**
   * 设置AI难度
   */
  setDifficulty(difficulty: AIDifficulty): void {
    this.config.difficulty = difficulty;
  }

  /**
   * 获取AI难度
   */
  getDifficulty(): AIDifficulty {
    return this.config.difficulty;
  }

  /**
   * 执行AI回合决策
   */
  executeTurn(
    factionId: string,
    gameState: GameState
  ): AITurnDecision {
    const faction = gameState.factions[factionId];
    if (!faction || faction.isPlayer) {
      return {
        factionId,
        decisions: [],
        assessment: {} as SituationAssessment
      };
    }

    // 第一步：局势评估
    const assessment = SituationEvaluator.evaluate(
      faction,
      gameState.factions,
      gameState.cities,
      gameState.generals,
      gameState.armies
    );

    // 第二步：获取基础权重
    let weights = WeightSystem.getBaseWeights();

    // 第三步：根据君主性格调整权重
    const ruler = gameState.generals[faction.ruler];
    if (ruler) {
      const personality = PersonalitySystem.getPersonality(ruler);
      weights = PersonalitySystem.applyPersonalityWeights(personality, weights);
    }

    // 第四步：根据局势调整权重
    weights = WeightSystem.adjustBySituation(weights, assessment);

    // 第五步：根据难度调整权重
    weights = WeightSystem.adjustByDifficulty(weights, this.config.difficulty);

    // 第六步：生成决策
    const decisions = DecisionGenerator.generate(
      faction,
      gameState,
      assessment,
      weights
    );

    // 第七步：按优先级排序
    const sortedDecisions = this.prioritizeDecisions(decisions, weights);

    // 第八步：根据难度筛选决策
    const filteredDecisions = this.filterByDifficulty(sortedDecisions);

    return {
      factionId,
      decisions: filteredDecisions,
      assessment
    };
  }

  /**
   * 决策优先级排序
   */
  private prioritizeDecisions(
    decisions: AIDecision[],
    weights: AIDecisionWeights
  ): AIDecision[] {
    return decisions.sort((a, b) => {
      const scoreA = this.calculateDecisionScore(a, weights);
      const scoreB = this.calculateDecisionScore(b, weights);
      return scoreB - scoreA;
    });
  }

  /**
   * 计算决策得分
   */
  private calculateDecisionScore(
    decision: AIDecision,
    weights: AIDecisionWeights
  ): number {
    const weightMap: Record<string, number> = {
      'develop': weights.developEconomy,
      'recruit': weights.recruit,
      'attack': weights.attack,
      'defend': weights.defend,
      'alliance': weights.alliance,
      'recruitGeneral': weights.recruitGeneral,
      'promoteGeneral': weights.promoteGeneral,
      'searchItem': weights.searchItem
    };

    return decision.priority * (weightMap[decision.type] || 50);
  }

  /**
   * 根据难度筛选决策
   */
  private filterByDifficulty(decisions: AIDecision[]): AIDecision[] {
    const limitMap: Record<AIDifficulty, number> = {
      [AIDifficulty.EASY]: 3,
      [AIDifficulty.NORMAL]: 5,
      [AIDifficulty.HARD]: 8
    };

    const limit = limitMap[this.config.difficulty];
    return decisions.slice(0, limit);
  }

  /**
   * 执行所有AI势力的回合
   */
  executeAllAITurns(gameState: GameState): AITurnDecision[] {
    const results: AITurnDecision[] = [];

    Object.keys(gameState.factions).forEach(factionId => {
      const faction = gameState.factions[factionId];
      if (!faction.isPlayer) {
        const result = this.executeTurn(factionId, gameState);
        results.push(result);
      }
    });

    return results;
  }
}

// 导出单例
export const aiSystem = AISystem.getInstance();
