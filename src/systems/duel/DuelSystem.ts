import type { General, GeneralRelation } from '@/types';

/**
 * 单挑结果
 */
export interface DuelResult {
  winner: string; // 获胜武将ID
  loser: string; // 失败武将ID
  winnerHP: number; // 获胜方剩余生命值
  loserHP: number; // 失败方剩余生命值
  rounds: DuelRound[]; // 每回合详情
  criticalHit: boolean; // 是否有暴击
  surrendered: boolean; // 是否投降
  captured: boolean; // 是否被俘
}

/**
 * 单挑回合
 */
export interface DuelRound {
  round: number;
  attackerAction: 'attack' | 'defend' | 'skill';
  defenderAction: 'attack' | 'defend' | 'skill';
  attackerDamage: number;
  defenderDamage: number;
  attackerHP: number;
  defenderHP: number;
  description: string;
}

/**
 * 单挑系统
 * 管理武将单挑的机制和结果判定
 */
export class DuelSystem {
  /**
   * 执行单挑
   */
  static executeDuel(
    challenger: General,
    defender: General,
    relations: GeneralRelation[]
  ): DuelResult {
    const rounds: DuelRound[] = [];
    
    // 初始化生命值（基于武力）
    let challengerHP = 100 + challenger.attributes.force;
    let defenderHP = 100 + defender.attributes.force;
    const maxChallengerHP = challengerHP;
    const maxDefenderHP = defenderHP;
    
    let round = 1;
    let criticalHit = false;
    let surrendered = false;
    
    // 单挑最多20回合
    while (round <= 20 && challengerHP > 0 && defenderHP > 0) {
      const roundResult = this.executeRound(
        round,
        challenger,
        defender,
        challengerHP,
        defenderHP,
        maxChallengerHP,
        maxDefenderHP,
        relations
      );
      
      rounds.push(roundResult);
      challengerHP = roundResult.attackerHP;
      defenderHP = roundResult.defenderHP;
      
      if (roundResult.attackerDamage >= 30 || roundResult.defenderDamage >= 30) {
        criticalHit = true;
      }
      
      // 检查是否投降
      if (defenderHP < maxDefenderHP * 0.2 && Math.random() < 0.3) {
        surrendered = true;
        break;
      }
      
      round++;
    }
    
    // 判定胜负
    const winner = challengerHP > defenderHP ? challenger.id : defender.id;
    const loser = winner === challenger.id ? defender.id : challenger.id;
    const winnerHP = winner === challenger.id ? challengerHP : defenderHP;
    const loserHP = loser === challenger.id ? challengerHP : defenderHP;
    
    // 判定是否被俘（生命值低于20%时有概率被俘）
    const captured = loserHP < maxDefenderHP * 0.2 && Math.random() < 0.5;
    
    return {
      winner,
      loser,
      winnerHP,
      loserHP,
      rounds,
      criticalHit,
      surrendered,
      captured,
    };
  }

  /**
   * 执行单挑回合
   */
  private static executeRound(
    round: number,
    challenger: General,
    defender: General,
    challengerHP: number,
    defenderHP: number,
    maxChallengerHP: number,
    maxDefenderHP: number,
    relations: GeneralRelation[]
  ): DuelRound {
    // 决定行动
    const attackerAction = this.decideAction(challenger, challengerHP, maxChallengerHP);
    const defenderAction = this.decideAction(defender, defenderHP, maxDefenderHP);
    
    // 计算伤害
    let attackerDamage = 0;
    let defenderDamage = 0;
    let description = '';
    
    // 根据行动类型计算伤害
    if (attackerAction === 'attack' && defenderAction === 'attack') {
      // 双方攻击
      attackerDamage = this.calculateDamage(challenger, defender, relations, false);
      defenderDamage = this.calculateDamage(defender, challenger, relations, false);
      description = `${challenger.name}和${defender.name}同时发动攻击！`;
    } else if (attackerAction === 'attack' && defenderAction === 'defend') {
      // 攻击vs防御
      attackerDamage = Math.max(0, this.calculateDamage(challenger, defender, relations, false) - 5);
      description = `${defender.name}防守，${challenger.name}的攻击被削弱！`;
    } else if (attackerAction === 'defend' && defenderAction === 'attack') {
      // 防御vs攻击
      defenderDamage = Math.max(0, this.calculateDamage(defender, challenger, relations, false) - 5);
      description = `${challenger.name}防守，${defender.name}的攻击被削弱！`;
    } else if (attackerAction === 'skill' || defenderAction === 'skill') {
      // 技能攻击
      if (attackerAction === 'skill') {
        attackerDamage = this.calculateDamage(challenger, defender, relations, true);
        description = `${challenger.name}发动技能攻击！`;
      }
      if (defenderAction === 'skill') {
        defenderDamage = this.calculateDamage(defender, challenger, relations, true);
        description += `${defender.name}发动技能攻击！`;
      }
    } else {
      // 双方防御
      description = '双方都在防守，没有造成伤害。';
    }
    
    // 更新生命值
    const newChallengerHP = Math.max(0, challengerHP - defenderDamage);
    const newDefenderHP = Math.max(0, defenderHP - attackerDamage);
    
    return {
      round,
      attackerAction,
      defenderAction,
      attackerDamage,
      defenderDamage,
      attackerHP: newChallengerHP,
      defenderHP: newDefenderHP,
      description,
    };
  }

  /**
   * 决定行动
   */
  private static decideAction(
    general: General,
    currentHP: number,
    maxHP: number
  ): 'attack' | 'defend' | 'skill' {
    const hpRatio = currentHP / maxHP;
    
    // 生命值低时更倾向于防御
    if (hpRatio < 0.3) {
      const rand = Math.random();
      if (rand < 0.5) return 'defend';
      if (rand < 0.8) return 'attack';
      return 'skill';
    }
    
    // 生命值中等时均衡
    if (hpRatio < 0.6) {
      const rand = Math.random();
      if (rand < 0.4) return 'attack';
      if (rand < 0.7) return 'defend';
      return 'skill';
    }
    
    // 生命值高时更倾向于攻击
    const rand = Math.random();
    if (rand < 0.6) return 'attack';
    if (rand < 0.8) return 'defend';
    return 'skill';
  }

  /**
   * 计算伤害
   */
  private static calculateDamage(
    attacker: General,
    defender: General,
    relations: GeneralRelation[],
    isSkill: boolean
  ): number {
    // 基础伤害
    let baseDamage = attacker.attributes.force * 0.5;
    
    // 技能伤害加成
    if (isSkill) {
      baseDamage *= 1.5;
    }
    
    // 防御减免
    const defense = defender.attributes.force * 0.3;
    
    // 武力差异影响
    const forceDiff = attacker.attributes.force - defender.attributes.force;
    const forceModifier = 1 + forceDiff * 0.01;
    
    // 性格影响
    let personalityModifier = 1;
    switch (attacker.personality) {
      case 'brave':
        personalityModifier = 1.2; // 刚胆武将攻击力+20%
        break;
      case 'timid':
        personalityModifier = 0.8; // 胆小武将攻击力-20%
        break;
      case 'rash':
        personalityModifier = 1.3; // 鲁莽武将攻击力+30%，但防御降低
        break;
    }
    
    // 暴击判定
    let criticalModifier = 1;
    if (Math.random() < 0.1) {
      criticalModifier = 1.5; // 10%概率暴击，伤害+50%
    }
    
    // 计算最终伤害
    let damage = (baseDamage - defense) * forceModifier * personalityModifier * criticalModifier;
    
    // 添加随机波动
    damage *= (0.8 + Math.random() * 0.4); // 80%-120%波动
    
    return Math.max(1, Math.round(damage));
  }

  /**
   * 判定是否接受单挑
   */
  static shouldAcceptDuel(
    challenger: General,
    defender: General,
    relations: GeneralRelation[]
  ): boolean {
    // 基础接受概率
    let acceptChance = 0.5;
    
    // 性格影响
    switch (defender.personality) {
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
    const forceDiff = defender.attributes.force - challenger.attributes.force;
    if (forceDiff > 10) {
      acceptChance += 0.2;
    } else if (forceDiff < -10) {
      acceptChance -= 0.2;
    }
    
    // 仇敌关系，必定接受
    const relation = relations.find(
      r => (r.general1 === defender.id && r.general2 === challenger.id) ||
           (r.general1 === challenger.id && r.general2 === defender.id)
    );
    if (relation && relation.type === 'enemy') {
      acceptChance = 1.0;
    }
    
    return Math.random() < acceptChance;
  }

  /**
   * 计算单挑对士气的影响
   */
  static calculateDuelMoraleEffect(
    winnerId: string,
    loserId: string,
    surrendered: boolean,
    captured: boolean
  ): { winnerMorale: number; loserMorale: number } {
    let winnerMorale = 20; // 获胜方士气+20
    let loserMorale = -20; // 失败方士气-20
    
    if (surrendered) {
      winnerMorale += 10; // 对方投降，额外+10
      loserMorale -= 10; // 投降，额外-10
    }
    
    if (captured) {
      winnerMorale += 5; // 俘虏敌方武将，额外+5
      loserMorale -= 5; // 武将被俘，额外-5
    }
    
    return { winnerMorale, loserMorale };
  }
}
