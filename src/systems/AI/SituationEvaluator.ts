/**
 * 局势评估系统
 * 评估AI势力的当前局势，包括实力、威胁、机会和需求
 */

import type { 
  City, 
  Faction, 
  General, 
  Army 
} from '@/types';

/**
 * 威胁等级
 */
export enum ThreatLevel {
  NONE = 'none',       // 无威胁
  LOW = 'low',         // 低威胁
  MEDIUM = 'medium',   // 中威胁
  HIGH = 'high',       // 高威胁
  CRITICAL = 'critical' // 危急
}

/**
 * 机会等级
 */
export enum OpportunityLevel {
  NONE = 'none',       // 无机会
  LOW = 'low',         // 低机会
  MEDIUM = 'medium',   // 中机会
  HIGH = 'high',       // 高机会
  EXCELLENT = 'excellent' // 绝佳
}

/**
 * 资源紧缺度
 */
export enum ResourceScarcity {
  ABUNDANT = 'abundant', // 充足
  NORMAL = 'normal',     // 正常
  MODERATE = 'moderate', // 中度紧缺
  SEVERE = 'severe',     // 严重紧缺
  CRITICAL = 'critical'  // 危急
}

/**
 * 势力规模
 */
export enum FactionScale {
  SMALL = 'small',    // 小势力（1-3城）
  MEDIUM = 'medium',  // 中势力（4-8城）
  LARGE = 'large',    // 大势力（9-15城）
  HUGE = 'huge'       // 超大势力（16+城）
}

/**
 * 势力实力评估
 */
export interface FactionStrength {
  military: number;      // 军事实力（0-100）
  economy: number;       // 经济实力（0-100）
  territory: number;     // 领土实力（0-100）
  generals: number;      // 武将实力（0-100）
  overall: number;       // 综合实力（0-100）
}

/**
 * 外部威胁信息
 */
export interface ThreatInfo {
  factionId: string;
  factionName: string;
  threatLevel: ThreatLevel;
  militaryRatio: number;  // 敌我军力比
  distance: number;       // 距离（相邻城市数）
  isAtWar: boolean;       // 是否交战
}

/**
 * 机会信息
 */
export interface OpportunityInfo {
  type: 'weak_neighbor' | 'unguarded_city' | 'free_general' | 'alliance_chance';
  targetId: string;
  targetName: string;
  opportunityLevel: OpportunityLevel;
  potential: number;      // 潜在收益（0-100）
}

/**
 * 资源需求
 */
export interface ResourceNeeds {
  money: ResourceScarcity;
  food: ResourceScarcity;
  soldiers: ResourceScarcity;
  generals: ResourceScarcity;
}

/**
 * 局势评估结果
 */
export interface SituationAssessment {
  // 自身实力
  strength: FactionStrength;
  
  // 外部威胁
  threats: ThreatInfo[];
  overallThreat: ThreatLevel;
  
  // 发展机会
  opportunities: OpportunityInfo[];
  overallOpportunity: OpportunityLevel;
  
  // 资源需求
  resourceNeeds: ResourceNeeds;
  overallScarcity: ResourceScarcity;
  
  // 势力规模
  scale: FactionScale;
  
  // 战略建议
  strategicAdvice: {
    focus: 'economy' | 'military' | 'defense' | 'expansion';
    urgency: 'low' | 'medium' | 'high';
  };
}

/**
 * 局势评估器
 */
export class SituationEvaluator {
  /**
   * 评估局势
   */
  static evaluate(
    faction: Faction,
    allFactions: Record<string, Faction>,
    cities: Record<string, City>,
    generals: Record<string, General>,
    armies: Record<string, Army>
  ): SituationAssessment {
    // 评估自身实力
    const strength = this.evaluateStrength(faction, cities, generals, armies);
    
    // 评估外部威胁
    const threats = this.evaluateThreats(faction, allFactions, cities, armies);
    const overallThreat = this.calculateOverallThreat(threats);
    
    // 评估机会
    const opportunities = this.evaluateOpportunities(faction, allFactions, cities, generals);
    const overallOpportunity = this.calculateOverallOpportunity(opportunities);
    
    // 评估资源需求
    const resourceNeeds = this.evaluateResourceNeeds(faction, cities);
    const overallScarcity = this.calculateOverallScarcity(resourceNeeds);
    
    // 评估势力规模
    const scale = this.evaluateScale(faction);
    
    // 生成战略建议
    const strategicAdvice = this.generateStrategicAdvice(
      strength,
      overallThreat,
      overallOpportunity,
      overallScarcity,
      scale
    );

    return {
      strength,
      threats,
      overallThreat,
      opportunities,
      overallOpportunity,
      resourceNeeds,
      overallScarcity,
      scale,
      strategicAdvice
    };
  }

  /**
   * 评估势力实力
   */
  private static evaluateStrength(
    faction: Faction,
    cities: Record<string, City>,
    generals: Record<string, General>,
    armies: Record<string, Army>
  ): FactionStrength {
    // 军事实力：兵力 + 军队数量
    let totalSoldiers = 0;
    let armyCount = 0;
    Object.values(armies).forEach(army => {
      if (army.faction === faction.id) {
        armyCount++;
        army.units.forEach(unit => {
          totalSoldiers += unit.count;
        });
      }
    });
    const military = Math.min(100, Math.floor(totalSoldiers / 1000 + armyCount * 10));

    // 经济实力：金钱 + 粮草
    let totalMoney = 0;
    let totalFood = 0;
    faction.cities.forEach(cityId => {
      const city = cities[cityId];
      if (city) {
        totalMoney += city.resources.money;
        totalFood += city.resources.food;
      }
    });
    const economy = Math.min(100, Math.floor(totalMoney / 1000 + totalFood / 5000));

    // 领土实力：城市数量 + 城防
    let totalDefense = 0;
    faction.cities.forEach(cityId => {
      const city = cities[cityId];
      if (city) {
        totalDefense += city.stats.defense;
      }
    });
    const territory = Math.min(100, faction.cities.length * 10 + Math.floor(totalDefense / 10));

    // 武将实力：武将数量 + 质量
    let generalScore = 0;
    faction.generals.forEach(generalId => {
      const general = generals[generalId];
      if (general) {
        const avgAttr = (
          general.attributes.command +
          general.attributes.force +
          general.attributes.intelligence +
          general.attributes.politics +
          general.attributes.charm
        ) / 5;
        generalScore += avgAttr;
      }
    });
    const generalsScore = Math.min(100, Math.floor(generalScore / faction.generals.length));

    // 综合实力
    const overall = Math.floor((military + economy + territory + generalsScore) / 4);

    return {
      military,
      economy,
      territory,
      generals: generalsScore,
      overall
    };
  }

  /**
   * 评估外部威胁
   */
  private static evaluateThreats(
    faction: Faction,
    allFactions: Record<string, Faction>,
    cities: Record<string, City>,
    armies: Record<string, Army>
  ): ThreatInfo[] {
    const threats: ThreatInfo[] = [];

    // 获取己方城市
    const myCities = faction.cities.map(id => cities[id]).filter(Boolean);
    
    // 获取己方兵力
    let mySoldiers = 0;
    Object.values(armies).forEach(army => {
      if (army.faction === faction.id) {
        army.units.forEach(unit => {
          mySoldiers += unit.count;
        });
      }
    });

    // 评估每个势力
    Object.values(allFactions).forEach(otherFaction => {
      if (otherFaction.id === faction.id || otherFaction.isPlayer) {
        return;
      }

      // 检查是否相邻
      let isAdjacent = false;
      let minDistance = 999;
      
      myCities.forEach(myCity => {
        otherFaction.cities.forEach(otherCityId => {
          const otherCity = cities[otherCityId];
          if (otherCity && myCity.neighbors.includes(otherCityId)) {
            isAdjacent = true;
            minDistance = 1;
          }
        });
      });

      if (!isAdjacent) {
        return;
      }

      // 计算敌我军力比
      let enemySoldiers = 0;
      Object.values(armies).forEach(army => {
        if (army.faction === otherFaction.id) {
          army.units.forEach(unit => {
            enemySoldiers += unit.count;
          });
        }
      });

      const militaryRatio = mySoldiers > 0 ? enemySoldiers / mySoldiers : 0;

      // 检查外交状态
      const diplomacy = faction.diplomacy?.[otherFaction.id];
      const isAtWar = diplomacy?.status === 'enemy';

      // 判断威胁等级
      let threatLevel = ThreatLevel.NONE;
      if (isAtWar) {
        if (militaryRatio >= 2) {
          threatLevel = ThreatLevel.CRITICAL;
        } else if (militaryRatio >= 1.5) {
          threatLevel = ThreatLevel.HIGH;
        } else if (militaryRatio >= 1) {
          threatLevel = ThreatLevel.MEDIUM;
        } else {
          threatLevel = ThreatLevel.LOW;
        }
      } else {
        if (militaryRatio >= 2) {
          threatLevel = ThreatLevel.MEDIUM;
        } else if (militaryRatio >= 1.5) {
          threatLevel = ThreatLevel.LOW;
        }
      }

      if (threatLevel !== ThreatLevel.NONE) {
        threats.push({
          factionId: otherFaction.id,
          factionName: otherFaction.name,
          threatLevel,
          militaryRatio,
          distance: minDistance,
          isAtWar
        });
      }
    });

    return threats.sort((a, b) => {
      const levelOrder = {
        [ThreatLevel.CRITICAL]: 5,
        [ThreatLevel.HIGH]: 4,
        [ThreatLevel.MEDIUM]: 3,
        [ThreatLevel.LOW]: 2,
        [ThreatLevel.NONE]: 1
      };
      return levelOrder[b.threatLevel] - levelOrder[a.threatLevel];
    });
  }

  /**
   * 计算总体威胁等级
   */
  private static calculateOverallThreat(threats: ThreatInfo[]): ThreatLevel {
    if (threats.length === 0) {
      return ThreatLevel.NONE;
    }

    const hasCritical = threats.some(t => t.threatLevel === ThreatLevel.CRITICAL);
    const hasHigh = threats.some(t => t.threatLevel === ThreatLevel.HIGH);
    const hasMedium = threats.some(t => t.threatLevel === ThreatLevel.MEDIUM);

    if (hasCritical) return ThreatLevel.CRITICAL;
    if (hasHigh) return ThreatLevel.HIGH;
    if (hasMedium) return ThreatLevel.MEDIUM;
    if (threats.length > 0) return ThreatLevel.LOW;
    return ThreatLevel.NONE;
  }

  /**
   * 评估机会
   */
  private static evaluateOpportunities(
    faction: Faction,
    allFactions: Record<string, Faction>,
    cities: Record<string, City>,
    generals: Record<string, General>
  ): OpportunityInfo[] {
    const opportunities: OpportunityInfo[] = [];

    // 获取己方城市
    const myCities = faction.cities.map(id => cities[id]).filter(Boolean);

    // 检查弱小邻国
    Object.values(allFactions).forEach(otherFaction => {
      if (otherFaction.id === faction.id || otherFaction.isPlayer) {
        return;
      }

      // 检查是否相邻
      let isAdjacent = false;
      myCities.forEach(myCity => {
        otherFaction.cities.forEach(otherCityId => {
          if (myCity.neighbors.includes(otherCityId)) {
            isAdjacent = true;
          }
        });
      });

      if (!isAdjacent) {
        return;
      }

      // 评估对方实力
      const cityCount = otherFaction.cities.length;
      const generalCount = otherFaction.generals.length;

      if (cityCount <= 2 && generalCount <= 3) {
        opportunities.push({
          type: 'weak_neighbor',
          targetId: otherFaction.id,
          targetName: otherFaction.name,
          opportunityLevel: cityCount === 1 ? OpportunityLevel.HIGH : OpportunityLevel.MEDIUM,
          potential: 100 - cityCount * 20
        });
      }
    });

    // 检查无防备城市
    myCities.forEach(myCity => {
      myCity.neighbors.forEach(neighborId => {
        const neighbor = cities[neighborId];
        if (neighbor && neighbor.faction !== faction.id) {
          if (neighbor.stats.defense < 30 && neighbor.resources.soldiers < 1000) {
            opportunities.push({
              type: 'unguarded_city',
              targetId: neighborId,
              targetName: neighbor.name,
              opportunityLevel: OpportunityLevel.HIGH,
              potential: 80
            });
          }
        }
      });
    });

    // 检查自由武将
    Object.values(generals).forEach(general => {
      if (!general.faction && general.status === 'active') {
        const inMyCity = faction.cities.some(cityId => {
          const city = cities[cityId];
          return city && general.location === cityId;
        });

        if (inMyCity) {
          const avgAttr = (
            general.attributes.command +
            general.attributes.force +
            general.attributes.intelligence +
            general.attributes.politics +
            general.attributes.charm
          ) / 5;

          opportunities.push({
            type: 'free_general',
            targetId: general.id,
            targetName: general.name,
            opportunityLevel: avgAttr >= 70 ? OpportunityLevel.HIGH : OpportunityLevel.MEDIUM,
            potential: avgAttr
          });
        }
      }
    });

    return opportunities.sort((a, b) => b.potential - a.potential);
  }

  /**
   * 计算总体机会等级
   */
  private static calculateOverallOpportunity(opportunities: OpportunityInfo[]): OpportunityLevel {
    if (opportunities.length === 0) {
      return OpportunityLevel.NONE;
    }

    const hasExcellent = opportunities.some(o => o.opportunityLevel === OpportunityLevel.EXCELLENT);
    const hasHigh = opportunities.some(o => o.opportunityLevel === OpportunityLevel.HIGH);
    const hasMedium = opportunities.some(o => o.opportunityLevel === OpportunityLevel.MEDIUM);

    if (hasExcellent) return OpportunityLevel.EXCELLENT;
    if (hasHigh) return OpportunityLevel.HIGH;
    if (hasMedium) return OpportunityLevel.MEDIUM;
    if (opportunities.length > 0) return OpportunityLevel.LOW;
    return OpportunityLevel.NONE;
  }

  /**
   * 评估资源需求
   */
  private static evaluateResourceNeeds(
    faction: Faction,
    cities: Record<string, City>
  ): ResourceNeeds {
    let totalMoney = 0;
    let totalFood = 0;
    let totalSoldiers = 0;

    faction.cities.forEach(cityId => {
      const city = cities[cityId];
      if (city) {
        totalMoney += city.resources.money;
        totalFood += city.resources.food;
        totalSoldiers += city.resources.soldiers;
      }
    });

    const cityCount = faction.cities.length;
    const generalCount = faction.generals.length;

    // 根据势力规模判断资源紧缺度
    const moneyPerCity = totalMoney / cityCount;
    const foodPerCity = totalFood / cityCount;
    const soldiersPerCity = totalSoldiers / cityCount;

    return {
      money: this.judgeScarcity(moneyPerCity, 500, 1000, 2000, 5000),
      food: this.judgeScarcity(foodPerCity, 2000, 5000, 10000, 20000),
      soldiers: this.judgeScarcity(soldiersPerCity, 500, 1000, 2000, 5000),
      generals: this.judgeGeneralScarcity(generalCount, cityCount)
    };
  }

  /**
   * 判断紧缺度
   */
  private static judgeScarcity(
    value: number,
    critical: number,
    severe: number,
    moderate: number,
    normal: number
  ): ResourceScarcity {
    if (value < critical) return ResourceScarcity.CRITICAL;
    if (value < severe) return ResourceScarcity.SEVERE;
    if (value < moderate) return ResourceScarcity.MODERATE;
    if (value < normal) return ResourceScarcity.NORMAL;
    return ResourceScarcity.ABUNDANT;
  }

  /**
   * 判断武将紧缺度
   */
  private static judgeGeneralScarcity(
    generalCount: number,
    cityCount: number
  ): ResourceScarcity {
    const ratio = generalCount / cityCount;
    if (ratio < 1) return ResourceScarcity.CRITICAL;
    if (ratio < 1.5) return ResourceScarcity.SEVERE;
    if (ratio < 2) return ResourceScarcity.MODERATE;
    if (ratio < 3) return ResourceScarcity.NORMAL;
    return ResourceScarcity.ABUNDANT;
  }

  /**
   * 计算总体紧缺度
   */
  private static calculateOverallScarcity(needs: ResourceNeeds): ResourceScarcity {
    const levels = [needs.money, needs.food, needs.soldiers, needs.generals];
    
    if (levels.includes(ResourceScarcity.CRITICAL)) return ResourceScarcity.CRITICAL;
    if (levels.includes(ResourceScarcity.SEVERE)) return ResourceScarcity.SEVERE;
    if (levels.includes(ResourceScarcity.MODERATE)) return ResourceScarcity.MODERATE;
    if (levels.includes(ResourceScarcity.NORMAL)) return ResourceScarcity.NORMAL;
    return ResourceScarcity.ABUNDANT;
  }

  /**
   * 评估势力规模
   */
  private static evaluateScale(faction: Faction): FactionScale {
    const cityCount = faction.cities.length;
    
    if (cityCount <= 3) return FactionScale.SMALL;
    if (cityCount <= 8) return FactionScale.MEDIUM;
    if (cityCount <= 15) return FactionScale.LARGE;
    return FactionScale.HUGE;
  }

  /**
   * 生成战略建议
   */
  private static generateStrategicAdvice(
    strength: FactionStrength,
    overallThreat: ThreatLevel,
    overallOpportunity: OpportunityLevel,
    overallScarcity: ResourceScarcity,
    scale: FactionScale
  ): { focus: 'economy' | 'military' | 'defense' | 'expansion'; urgency: 'low' | 'medium' | 'high' } {
    // 根据威胁等级决定紧迫度
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (overallThreat === ThreatLevel.CRITICAL || overallThreat === ThreatLevel.HIGH) {
      urgency = 'high';
    } else if (overallThreat === ThreatLevel.MEDIUM || overallScarcity === ResourceScarcity.SEVERE) {
      urgency = 'medium';
    }

    // 根据局势决定重点
    let focus: 'economy' | 'military' | 'defense' | 'expansion' = 'economy';

    if (overallThreat === ThreatLevel.CRITICAL || overallThreat === ThreatLevel.HIGH) {
      focus = 'defense';
    } else if (overallOpportunity === OpportunityLevel.HIGH || overallOpportunity === OpportunityLevel.EXCELLENT) {
      if (strength.military >= 60) {
        focus = 'expansion';
      } else {
        focus = 'military';
      }
    } else if (overallScarcity === ResourceScarcity.SEVERE || overallScarcity === ResourceScarcity.CRITICAL) {
      focus = 'economy';
    } else if (scale === FactionScale.SMALL) {
      focus = 'economy';
    } else if (scale === FactionScale.MEDIUM) {
      focus = strength.military > strength.economy ? 'expansion' : 'economy';
    } else {
      focus = 'expansion';
    }

    return { focus, urgency };
  }
}
