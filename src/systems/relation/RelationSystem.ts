import type { General, GeneralRelation, Faction, City } from '@/types';

/**
 * 武将关系管理系统
 * 管理武将之间的关系，计算忠诚度变化，判定叛变等
 */
export class RelationSystem {
  /**
   * 获取武将的所有关系
   */
  static getGeneralRelations(generalId: string, relations: GeneralRelation[]): GeneralRelation[] {
    return relations.filter(
      r => r.general1 === generalId || r.general2 === generalId
    );
  }

  /**
   * 获取两个武将之间的关系
   */
  static getRelationBetween(
    general1Id: string,
    general2Id: string,
    relations: GeneralRelation[]
  ): GeneralRelation | undefined {
    return relations.find(
      r => (r.general1 === general1Id && r.general2 === general2Id) ||
           (r.general1 === general2Id && r.general2 === general1Id)
    );
  }

  /**
   * 计算关系对忠诚度的影响
   */
  static calculateRelationLoyaltyEffect(
    generalId: string,
    factionId: string,
    generals: Record<string, General>,
    relations: GeneralRelation[]
  ): number {
    const general = generals[generalId];
    if (!general) return 0;

    let loyaltyEffect = 0;

    // 获取该武将的所有关系
    const generalRelations = this.getGeneralRelations(generalId, relations);

    for (const relation of generalRelations) {
      const otherGeneralId = relation.general1 === generalId ? relation.general2 : relation.general1;
      const otherGeneral = generals[otherGeneralId];

      if (!otherGeneral) continue;

      // 根据关系类型计算忠诚度影响
      switch (relation.type) {
        case 'father':
        case 'son':
          // 父子关系影响最大
          if (otherGeneral.faction === factionId) {
            loyaltyEffect += 10; // 同阵营父子，忠诚度+
          } else {
            loyaltyEffect -= 20; // 敌对阵营父子，忠诚度-
          }
          break;

        case 'brother':
          // 兄弟关系
          if (otherGeneral.faction === factionId) {
            loyaltyEffect += 8; // 同阵营兄弟
          } else {
            loyaltyEffect -= 15; // 敌对阵营兄弟
          }
          break;

        case 'friend':
          // 朋友关系
          if (otherGeneral.faction === factionId) {
            loyaltyEffect += 5; // 同阵营朋友
          } else {
            loyaltyEffect -= 10; // 敌对阵营朋友
          }
          break;

        case 'enemy':
          // 仇敌关系
          if (otherGeneral.faction === factionId) {
            loyaltyEffect -= 5; // 同阵营仇敌，忠诚度-
          }
          // 敌对阵营仇敌不影响忠诚度
          break;

        case 'former_lord':
          // 旧主关系
          if (otherGeneral.faction !== factionId) {
            loyaltyEffect -= 25; // 旧主在敌对阵营，忠诚度大幅下降
          }
          break;
      }

      // 根据亲密值调整影响
      const intimacyModifier = Math.abs(relation.intimacy) / 100;
      loyaltyEffect *= intimacyModifier;
    }

    return Math.round(loyaltyEffect);
  }

  /**
   * 计算战斗配合加成
   */
  static calculateBattleCooperation(
    general1Id: string,
    general2Id: string,
    relations: GeneralRelation[]
  ): number {
    const relation = this.getRelationBetween(general1Id, general2Id, relations);
    if (!relation) return 0;

    let bonus = 0;
    switch (relation.type) {
      case 'father':
      case 'son':
        bonus = 20;
        break;
      case 'brother':
        bonus = 15;
        break;
      case 'friend':
        bonus = 10;
        break;
      case 'enemy':
        bonus = -10; // 仇敌同阵，效率降低
        break;
    }

    // 根据亲密值调整
    const intimacyModifier = Math.abs(relation.intimacy) / 100;
    return Math.round(bonus * intimacyModifier);
  }

  /**
   * 计算忠诚度变化（回合结束时）
   */
  static calculateLoyaltyChange(
    general: General,
    generals: Record<string, General>,
    relations: GeneralRelation[],
    faction: Faction,
    cities: Record<string, City>
  ): number {
    let change = 0;

    // 1. 基础忠诚度下降（长期未赏赐）
    const hasReward = false; // TODO: 跟踪上次赏赐时间
    if (!hasReward) {
      change -= 2; // 每回合忠诚度下降2点
    }

    // 2. 城市民心影响
    const city = cities[general.location];
    if (city) {
      // 民心高，武将忠诚度略微上升
      if (city.stats.morale > 80) {
        change += 1;
      } else if (city.stats.morale < 30) {
        change -= 2;
      }
    }

    // 3. 关系影响
    const relationEffect = this.calculateRelationLoyaltyEffect(
      general.id,
      faction.id,
      generals,
      relations
    );
    change += Math.round(relationEffect / 10); // 关系影响除以10，避免影响过大

    // 4. 势力实力影响
    const factionStrength = faction.cities.length;
    if (factionStrength <= 1) {
      change -= 5; // 势力弱小，忠诚度下降
    }

    // 5. 性格影响
    switch (general.personality) {
      case 'righteous':
        change += 1; // 义士忠诚度较稳定
        break;
      case 'timid':
        change -= 1; // 胆小者忠诚度不稳定
        break;
      case 'rash':
        change -= 2; // 鲁莽者忠诚度易变
        break;
    }

    return change;
  }

  /**
   * 判定是否叛变
   */
  static shouldDefect(
    general: General,
    generals: Record<string, General>,
    relations: GeneralRelation[],
    factions: Record<string, Faction>
  ): { shouldDefect: boolean; targetFaction?: string; reason: string } {
    // 忠诚度检查
    if (general.loyalty >= 50) {
      return { shouldDefect: false, reason: '忠诚度尚可' };
    }

    // 忠诚度低于20，直接叛变
    if (general.loyalty < 20) {
      // 寻找叛变目标
      const targetFaction = this.findDefectTarget(general, generals, relations, factions);
      return {
        shouldDefect: true,
        targetFaction,
        reason: `忠诚度过低(${general.loyalty})，决定叛变`
      };
    }

    // 忠诚度20-50，有一定概率叛变
    const defectChance = (50 - general.loyalty) / 100; // 忠诚度越低，概率越高

    // 检查关系影响
    const relationRelations = this.getGeneralRelations(general.id, relations);

    for (const relation of relationRelations) {
      const otherGeneralId = relation.general1 === general.id ? relation.general2 : relation.general1;
      const otherGeneral = generals[otherGeneralId];

      if (!otherGeneral) continue;

      // 旧主关系，叛变概率大幅增加
      if (relation.type === 'former_lord' && otherGeneral.faction !== general.faction) {
        if (Math.random() < 0.5) {
          return {
            shouldDefect: true,
            targetFaction: otherGeneral.faction,
            reason: `旧主${otherGeneral.name}在敌对阵营，决定投奔`
          };
        }
      }

      // 兄弟/父子在敌对阵营
      if ((relation.type === 'brother' || relation.type === 'father' || relation.type === 'son') &&
          otherGeneral.faction !== general.faction) {
        if (Math.random() < 0.3) {
          return {
            shouldDefect: true,
            targetFaction: otherGeneral.faction,
            reason: `亲属${otherGeneral.name}在敌对阵营，决定投奔`
          };
        }
      }
    }

    // 性格影响
    if (general.personality === 'timid' && Math.random() < defectChance) {
      const targetFaction = this.findDefectTarget(general, generals, relations, factions);
      return {
        shouldDefect: true,
        targetFaction,
        reason: '性格胆小，决定投靠强者'
      };
    }

    return { shouldDefect: false, reason: '忠诚度尚可' };
  }

  /**
   * 寻找叛变目标势力
   */
  private static findDefectTarget(
    general: General,
    generals: Record<string, General>,
    relations: GeneralRelation[],
    factions: Record<string, Faction>
  ): string | undefined {
    // 优先投奔有关系的势力
    const generalRelations = this.getGeneralRelations(general.id, relations);

    for (const relation of generalRelations) {
      const otherGeneralId = relation.general1 === general.id ? relation.general2 : relation.general1;
      const otherGeneral = generals[otherGeneralId];

      if (!otherGeneral || otherGeneral.faction === general.faction) continue;

      // 父子、兄弟、朋友关系，优先投奔
      if (['father', 'son', 'brother', 'friend'].includes(relation.type)) {
        return otherGeneral.faction;
      }
    }

    // 其次投奔最强势力
    const factionStrengths = Object.entries(factions)
      .filter(([id]) => id !== general.faction)
      .map(([id, faction]) => ({
        id,
        strength: faction.cities.length
      }))
      .sort((a, b) => b.strength - a.strength);

    return factionStrengths[0]?.id;
  }

  /**
   * 判定是否接受单挑
   */
  static shouldAcceptDuel(
    general: General,
    challenger: General,
    relations: GeneralRelation[]
  ): boolean {
    // 基础接受概率
    let acceptChance = 0.5;

    // 性格影响
    switch (general.personality) {
      case 'brave':
        acceptChance += 0.3;
        break;
      case 'timid':
        acceptChance -= 0.3;
        break;
      case 'rash':
        acceptChance += 0.2;
        break;
    }

    // 武力对比
    const forceDiff = general.attributes.force - challenger.attributes.force;
    if (forceDiff > 10) {
      acceptChance += 0.2;
    } else if (forceDiff < -10) {
      acceptChance -= 0.2;
    }

    // 仇敌关系，必定接受
    const relation = this.getRelationBetween(general.id, challenger.id, relations);
    if (relation && relation.type === 'enemy') {
      acceptChance = 1.0;
    }

    return Math.random() < acceptChance;
  }

  /**
   * 计算招降成功率
   */
  static calculatePersuasionSuccess(
    captive: General,
    persuader: General,
    relations: GeneralRelation[]
  ): number {
    let successRate = 0;

    // 基础成功率（忠诚度越低，成功率越高）
    successRate = (100 - captive.loyalty) / 100 * 0.5;

    // 劝说者魅力影响
    successRate += persuader.attributes.charm / 200;

    // 关系影响
    const relation = this.getRelationBetween(captive.id, persuader.id, relations);
    if (relation) {
      switch (relation.type) {
        case 'friend':
          successRate += 0.2;
          break;
        case 'brother':
        case 'father':
        case 'son':
          successRate += 0.3;
          break;
        case 'enemy':
          successRate -= 0.3;
          break;
      }
    }

    // 劝说者智力影响
    successRate += persuader.attributes.intelligence / 200;

    // 性格影响
    switch (captive.personality) {
      case 'righteous':
        successRate -= 0.2; // 义士不易招降
        break;
      case 'timid':
        successRate += 0.1; // 胆小者容易招降
        break;
    }

    return Math.max(0, Math.min(1, successRate));
  }
}
