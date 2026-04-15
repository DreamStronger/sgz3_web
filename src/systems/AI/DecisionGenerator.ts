/**
 * AI决策生成系统
 * 根据局势评估生成具体的行动决策
 */

import type { 
  Faction,
  GameState 
} from '@/types';
import { SituationAssessment, ThreatLevel, OpportunityLevel, ResourceScarcity, FactionScale } from './SituationEvaluator';
import { AIDecisionWeights } from './WeightSystem';

/**
 * 决策类型
 */
export enum DecisionType {
  // 内政决策
  DEVELOP = 'develop',           // 发展城市
  BUILD_FACILITY = 'build',      // 建设设施
  RECRUIT = 'recruit',           // 征兵
  
  // 军事决策
  ATTACK = 'attack',             // 进攻
  DEFEND = 'defend',             // 防守
  MOVE_ARMY = 'move',            // 调动军队
  
  // 外交决策
  ALLIANCE = 'alliance',         // 结盟
  DECLARE_WAR = 'declareWar',    // 宣战
  PEACE = 'peace',               // 求和
  
  // 武将决策
  RECRUIT_GENERAL = 'recruitGeneral',  // 招募武将
  PROMOTE_GENERAL = 'promoteGeneral',  // 封官晋升
  SEARCH_ITEM = 'searchItem',          // 搜索宝物
  ASSIGN_GENERAL = 'assignGeneral'     // 分配武将
}

/**
 * 决策优先级
 */
export enum DecisionPriority {
  CRITICAL = 100,  // 紧急
  HIGH = 80,       // 高
  MEDIUM = 60,     // 中
  LOW = 40,        // 低
  MINOR = 20       // 次要
}

/**
 * AI决策
 */
export interface AIDecision {
  type: DecisionType;
  priority: number;
  target?: string;          // 目标ID（城市、武将、势力等）
  targetName?: string;      // 目标名称
  params?: Record<string, unknown>;  // 决策参数
  reason: string;           // 决策原因
  estimatedCost?: {
    money?: number;
    food?: number;
    soldiers?: number;
  };
  estimatedBenefit?: string;  // 预期收益
}

/**
 * 决策生成器
 */
export class DecisionGenerator {
  /**
   * 生成决策
   */
  static generate(
    faction: Faction,
    gameState: GameState,
    assessment: SituationAssessment,
    weights: AIDecisionWeights
  ): AIDecision[] {
    const decisions: AIDecision[] = [];

    // 生成内政决策
    decisions.push(...this.generatePoliticsDecisions(faction, gameState, assessment, weights));

    // 生成军事决策
    decisions.push(...this.generateMilitaryDecisions(faction, gameState, assessment, weights));

    // 生成外交决策
    decisions.push(...this.generateDiplomacyDecisions(faction, gameState, assessment, weights));

    // 生成武将决策
    decisions.push(...this.generateGeneralDecisions(faction, gameState, assessment, weights));

    return decisions;
  }

  /**
   * 生成内政决策
   */
  private static generatePoliticsDecisions(
    faction: Faction,
    gameState: GameState,
    assessment: SituationAssessment,
    weights: AIDecisionWeights
  ): AIDecision[] {
    const decisions: AIDecision[] = [];
    const cities = faction.cities.map(id => gameState.cities[id]).filter(Boolean);

    // 根据资源紧缺度生成发展决策
    if (assessment.resourceNeeds.money === ResourceScarcity.SEVERE ||
        assessment.resourceNeeds.money === ResourceScarcity.CRITICAL) {
      // 找商业度最低的城市优先发展
      const sortedByCommerce = [...cities].sort((a, b) => 
        a.stats.commerce - b.stats.commerce
      );
      
      if (sortedByCommerce.length > 0) {
        const target = sortedByCommerce[0];
        decisions.push({
          type: DecisionType.DEVELOP,
          priority: DecisionPriority.HIGH,
          target: target.id,
          targetName: target.name,
          params: { focus: 'commerce' },
          reason: '金钱紧缺，优先发展商业',
          estimatedBenefit: '增加金钱收入'
        });
      }
    }

    if (assessment.resourceNeeds.food === ResourceScarcity.SEVERE ||
        assessment.resourceNeeds.food === ResourceScarcity.CRITICAL) {
      // 找开发度最低的城市优先发展
      const sortedByDevelopment = [...cities].sort((a, b) => 
        a.stats.development - b.stats.development
      );
      
      if (sortedByDevelopment.length > 0) {
        const target = sortedByDevelopment[0];
        decisions.push({
          type: DecisionType.DEVELOP,
          priority: DecisionPriority.HIGH,
          target: target.id,
          targetName: target.name,
          params: { focus: 'development' },
          reason: '粮草紧缺，优先发展农业',
          estimatedBenefit: '增加粮草收入'
        });
      }
    }

    // 根据权重生成征兵决策
    if (weights.recruit >= 60 && assessment.resourceNeeds.soldiers !== ResourceScarcity.ABUNDANT) {
      // 找兵营等级最高的城市征兵
      const sortedByBarracks = [...cities].sort((a, b) => 
        b.facilities.barracks - a.facilities.barracks
      );
      
      if (sortedByBarracks.length > 0) {
        const target = sortedByBarracks[0];
        if (target.resources.money >= 500) {
          decisions.push({
            type: DecisionType.RECRUIT,
            priority: DecisionPriority.MEDIUM,
            target: target.id,
            targetName: target.name,
            params: { amount: Math.min(1000, Math.floor(target.resources.money / 100)) },
            reason: '扩充军备，增强实力',
            estimatedCost: { money: 500 },
            estimatedBenefit: '增加士兵数量'
          });
        }
      }
    }

    // 防御建设
    if (assessment.overallThreat === ThreatLevel.HIGH || assessment.overallThreat === ThreatLevel.CRITICAL) {
      // 找城防最低的边境城市
      const borderCities = cities.filter(city => {
        return city.neighbors.some(neighborId => {
          const neighbor = gameState.cities[neighborId];
          return neighbor && neighbor.faction !== faction.id;
        });
      });

      const sortedByDefense = borderCities.sort((a, b) => 
        a.stats.defense - b.stats.defense
      );

      if (sortedByDefense.length > 0 && sortedByDefense[0].stats.defense < 50) {
        const target = sortedByDefense[0];
        decisions.push({
          type: DecisionType.BUILD_FACILITY,
          priority: DecisionPriority.HIGH,
          target: target.id,
          targetName: target.name,
          params: { facility: 'wall' },
          reason: '边境城市防御不足，急需加强',
          estimatedCost: { money: 300 },
          estimatedBenefit: '提升城防'
        });
      }
    }

    return decisions;
  }

  /**
   * 生成军事决策
   */
  private static generateMilitaryDecisions(
    faction: Faction,
    gameState: GameState,
    assessment: SituationAssessment,
    weights: AIDecisionWeights
  ): AIDecision[] {
    const decisions: AIDecision[] = [];

    // 防守决策
    if (assessment.overallThreat === ThreatLevel.HIGH || assessment.overallThreat === ThreatLevel.CRITICAL) {
      // 找到威胁来源，调动军队防守
      const criticalThreats = assessment.threats.filter(
        t => t.threatLevel === ThreatLevel.HIGH || t.threatLevel === ThreatLevel.CRITICAL
      );

      if (criticalThreats.length > 0) {
        const threat = criticalThreats[0];
        
        // 找到靠近威胁的城市
        const myCities = faction.cities.map(id => gameState.cities[id]).filter(Boolean);
        const borderCities = myCities.filter(city => {
          return city.neighbors.some(neighborId => {
            const neighbor = gameState.cities[neighborId];
            return neighbor && neighbor.faction === threat.factionId;
          });
        });

        if (borderCities.length > 0) {
          const target = borderCities[0];
          decisions.push({
            type: DecisionType.DEFEND,
            priority: DecisionPriority.CRITICAL,
            target: target.id,
            targetName: target.name,
            params: { threatFaction: threat.factionId },
            reason: `${threat.factionName}威胁严重，需加强防守`,
            estimatedBenefit: '提升防御能力'
          });
        }
      }
    }

    // 进攻决策
    if (weights.attack >= 60 && 
        (assessment.overallOpportunity === OpportunityLevel.HIGH || 
         assessment.overallOpportunity === OpportunityLevel.EXCELLENT)) {
      
      // 找最佳进攻目标
      const attackOpportunities = assessment.opportunities.filter(
        o => o.type === 'weak_neighbor' || o.type === 'unguarded_city'
      );

      if (attackOpportunities.length > 0) {
        const target = attackOpportunities[0];
        
        // 检查是否有足够军力
        let totalSoldiers = 0;
        Object.values(gameState.armies).forEach(army => {
          if (army.faction === faction.id) {
            army.units.forEach(unit => {
              totalSoldiers += unit.count;
            });
          }
        });

        if (totalSoldiers >= 2000) {
          decisions.push({
            type: DecisionType.ATTACK,
            priority: DecisionPriority.HIGH,
            target: target.targetId,
            targetName: target.targetName,
            params: { opportunityType: target.type },
            reason: `${target.targetName}防御薄弱，是进攻良机`,
            estimatedCost: { food: 500 },
            estimatedBenefit: '攻占城市，扩大领土'
          });
        }
      }
    }

    // 军队调动
    if (assessment.scale === FactionScale.MEDIUM || assessment.scale === FactionScale.LARGE) {
      // 找兵力过剩的城市和兵力不足的城市
      const myCities = faction.cities.map(id => gameState.cities[id]).filter(Boolean);
      const citySoldiers: Record<string, number> = {};

      myCities.forEach(city => {
        let soldiers = city.resources.soldiers;
        Object.values(gameState.armies).forEach(army => {
          if (army.faction === faction.id && army.location === city.id) {
            army.units.forEach(unit => {
              soldiers += unit.count;
            });
          }
        });
        citySoldiers[city.id] = soldiers;
      });

      // 找边境城市
      const borderCities = myCities.filter(city => {
        return city.neighbors.some(neighborId => {
          const neighbor = gameState.cities[neighborId];
          return neighbor && neighbor.faction !== faction.id;
        });
      });

      // 找后方城市
      const rearCities = myCities.filter(city => !borderCities.includes(city));

      // 如果后方兵力过剩，边境兵力不足
      if (rearCities.length > 0 && borderCities.length > 0) {
        const richRear = rearCities.sort((a, b) => 
          citySoldiers[b.id] - citySoldiers[a.id]
        )[0];
        
        const poorBorder = borderCities.sort((a, b) => 
          citySoldiers[a.id] - citySoldiers[b.id]
        )[0];

        if (citySoldiers[richRear.id] > citySoldiers[poorBorder.id] * 2) {
          decisions.push({
            type: DecisionType.MOVE_ARMY,
            priority: DecisionPriority.MEDIUM,
            target: richRear.id,
            targetName: richRear.name,
            params: { destination: poorBorder.id },
            reason: '调动后方兵力支援边境',
            estimatedBenefit: '优化兵力分布'
          });
        }
      }
    }

    return decisions;
  }

  /**
   * 生成外交决策
   */
  private static generateDiplomacyDecisions(
    faction: Faction,
    gameState: GameState,
    assessment: SituationAssessment,
    weights: AIDecisionWeights
  ): AIDecision[] {
    const decisions: AIDecision[] = [];

    // 求和决策
    if (assessment.overallThreat === ThreatLevel.CRITICAL && weights.diplomacy >= 50) {
      const enemies = assessment.threats.filter(t => t.isAtWar);
      if (enemies.length > 0) {
        decisions.push({
          type: DecisionType.PEACE,
          priority: DecisionPriority.CRITICAL,
          target: enemies[0].factionId,
          targetName: enemies[0].factionName,
          reason: '局势危急，寻求和平',
          estimatedBenefit: '避免被灭'
        });
      }
    }

    // 结盟决策
    if (weights.alliance >= 60 && assessment.scale === FactionScale.SMALL) {
      // 找可能的盟友（与敌对势力交战的势力）
      const enemies = assessment.threats.filter(t => t.isAtWar);
      if (enemies.length > 0) {
        const enemyId = enemies[0].factionId;
        
        Object.values(gameState.factions).forEach(otherFaction => {
          if (otherFaction.id !== faction.id && !otherFaction.isPlayer) {
            const diplomacy = otherFaction.diplomacy?.[enemyId];
            if (diplomacy?.status === 'enemy') {
              decisions.push({
                type: DecisionType.ALLIANCE,
                priority: DecisionPriority.HIGH,
                target: otherFaction.id,
                targetName: otherFaction.name,
                reason: '敌人的敌人是朋友',
                estimatedBenefit: '建立联盟，共同对抗强敌'
              });
            }
          }
        });
      }
    }

    // 宣战决策
    if (weights.declareWar >= 70 && 
        assessment.overallOpportunity === OpportunityLevel.EXCELLENT &&
        assessment.overallThreat === ThreatLevel.NONE) {
      
      const weakNeighbors = assessment.opportunities.filter(
        o => o.type === 'weak_neighbor' && o.opportunityLevel === OpportunityLevel.HIGH
      );

      if (weakNeighbors.length > 0) {
        const target = weakNeighbors[0];
        decisions.push({
          type: DecisionType.DECLARE_WAR,
          priority: DecisionPriority.MEDIUM,
          target: target.targetId,
          targetName: target.targetName,
          reason: '实力悬殊，是吞并良机',
          estimatedBenefit: '快速扩张领土'
        });
      }
    }

    return decisions;
  }

  /**
   * 生成武将决策
   */
  private static generateGeneralDecisions(
    faction: Faction,
    gameState: GameState,
    assessment: SituationAssessment,
    weights: AIDecisionWeights
  ): AIDecision[] {
    const decisions: AIDecision[] = [];

    // 招募自由武将
    if (weights.recruitGeneral >= 50) {
      const freeGenerals = assessment.opportunities.filter(
        o => o.type === 'free_general'
      );

      freeGenerals.slice(0, 2).forEach(opp => {
        decisions.push({
          type: DecisionType.RECRUIT_GENERAL,
          priority: opp.opportunityLevel === OpportunityLevel.HIGH 
            ? DecisionPriority.HIGH 
            : DecisionPriority.MEDIUM,
          target: opp.targetId,
          targetName: opp.targetName,
          reason: '发现可用人才',
          estimatedBenefit: '增加武将数量'
        });
      });
    }

    // 封官决策
    if (weights.promoteGeneral >= 50 && faction.generals.length > 0) {
      // 找功勋高但官职低的武将
      const generals = faction.generals
        .map(id => gameState.generals[id])
        .filter(Boolean)
        .sort((a, b) => {
          // 按统率和武力排序
          const scoreA = a.attributes.command + a.attributes.force;
          const scoreB = b.attributes.command + b.attributes.force;
          return scoreB - scoreA;
        });

      if (generals.length > 0) {
        const topGeneral = generals[0];
        decisions.push({
          type: DecisionType.PROMOTE_GENERAL,
          priority: DecisionPriority.LOW,
          target: topGeneral.id,
          targetName: topGeneral.name,
          reason: '奖励功勋，提升忠诚',
          estimatedCost: { money: 200 },
          estimatedBenefit: '提升武将能力和忠诚度'
        });
      }
    }

    // 搜索宝物
    if (weights.searchItem >= 40) {
      const cities = faction.cities.map(id => gameState.cities[id]).filter(Boolean);
      
      // 找智力高的武将搜索
      const generals = faction.generals
        .map(id => gameState.generals[id])
        .filter(g => g && g.attributes.intelligence >= 70);

      if (generals.length > 0 && cities.length > 0) {
        const searcher = generals[0];
        const targetCity = cities[Math.floor(Math.random() * cities.length)];
        
        decisions.push({
          type: DecisionType.SEARCH_ITEM,
          priority: DecisionPriority.MINOR,
          target: targetCity.id,
          targetName: targetCity.name,
          params: { generalId: searcher.id },
          reason: '搜索宝物，增强实力',
          estimatedCost: { money: 100 },
          estimatedBenefit: '可能发现宝物或人才'
        });
      }
    }

    // 分配武将
    if (assessment.resourceNeeds.generals === ResourceScarcity.ABUNDANT) {
      const cities = faction.cities.map(id => gameState.cities[id]).filter(Boolean);
      const unassignedGenerals = faction.generals
        .map(id => gameState.generals[id])
        .filter(g => g && !cities.some(c => c.generals.includes(g.id)));

      if (unassignedGenerals.length > 0) {
        // 找武将最少的边境城市
        const borderCities = cities.filter(city => {
          return city.neighbors.some(neighborId => {
            const neighbor = gameState.cities[neighborId];
            return neighbor && neighbor.faction !== faction.id;
          });
        }).sort((a, b) => a.generals.length - b.generals.length);

        if (borderCities.length > 0) {
          const target = borderCities[0];
          const general = unassignedGenerals[0];
          
          decisions.push({
            type: DecisionType.ASSIGN_GENERAL,
            priority: DecisionPriority.LOW,
            target: target.id,
            targetName: target.name,
            params: { generalId: general.id },
            reason: '加强边境城市武将配置',
            estimatedBenefit: '提升城市防御能力'
          });
        }
      }
    }

    return decisions;
  }
}
