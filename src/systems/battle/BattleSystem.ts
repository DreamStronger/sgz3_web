/**
 * 战斗系统核心逻辑
 */

import type { 
  Battle, 
  Unit, 
  General, 
  Formation, 
  Tactics, 
  Stratagem,
  City
} from '@/types';

// 兵种克制关系
const UNIT_COUNTER: Record<string, string> = {
  infantry: 'cavalry',    // 步兵克制骑兵
  cavalry: 'archer',      // 骑兵克制弓兵
  archer: 'infantry',     // 弓兵克制步兵
  navy: 'navy'            // 水军只克制水军
};

// 兵种基础属性
const UNIT_STATS: Record<string, { attack: number; defense: number; speed: number }> = {
  infantry: { attack: 10, defense: 12, speed: 3 },
  cavalry: { attack: 14, defense: 8, speed: 5 },
  archer: { attack: 12, defense: 6, speed: 3 },
  navy: { attack: 10, defense: 10, speed: 4 }
};

// 地形加成
const TERRAIN_BONUS: Record<string, { attack: number; defense: number }> = {
  plain: { attack: 0, defense: 0 },
  mountain: { attack: -0.1, defense: 0.3 },
  water: { attack: 0, defense: 0 },
  pass: { attack: -0.2, defense: 0.5 }
};

// 天气影响
const WEATHER_EFFECTS: Record<string, { attack: number; defense: number; morale: number }> = {
  sunny: { attack: 0, defense: 0, morale: 0 },
  cloudy: { attack: 0, defense: 0, morale: 0 },
  rain: { attack: -0.1, defense: -0.1, morale: -5 },
  snow: { attack: -0.2, defense: -0.15, morale: -10 }
};

// 阵型效果
const FORMATION_EFFECTS: Record<string, { attack: number; defense: number; mobility: number }> = {
  fish_scale: { attack: -0.1, defense: 0.3, mobility: 0 },      // 鱼鳞阵
  arrow: { attack: 0.3, defense: -0.1, mobility: 0 },           // 锋矢阵
  goose: { attack: 0, defense: 0, mobility: 0 },                // 雁行阵
  circle: { attack: 0.1, defense: 0.1, mobility: -0.1 },        // 方圆阵
  snake: { attack: 0, defense: -0.1, mobility: 0.5 },           // 长蛇阵
  crane: { attack: 0.15, defense: 0.15, mobility: 0 }           // 衡轭阵
};

export interface BattleResult {
  winner: 'attacker' | 'defender' | 'draw';
  attackerLosses: number;
  defenderLosses: number;
  attackerMorale: number;
  defenderMorale: number;
  captives: string[];
  experience: { attacker: number; defender: number };
}

export interface CombatUnit {
  unit: Unit;
  general?: General;
  effectiveAttack: number;
  effectiveDefense: number;
  morale: number;
  fatigue: number;
}

/**
 * 战斗系统类
 */
export class BattleSystem {
  private battle: Battle;
  private attackerUnits: CombatUnit[] = [];
  private defenderUnits: CombatUnit[] = [];
  private generals: Record<string, General>;
  // private formations: Record<string, Formation>; // 预留字段
  private tactics: Record<string, Tactics>;
  private stratagems: Record<string, Stratagem>;
  private city?: City;
  
  constructor(
    battle: Battle,
    generals: Record<string, General>,
    _formations: Record<string, Formation>, // 预留参数
    tactics: Record<string, Tactics>,
    stratagems: Record<string, Stratagem>,
    city?: City
  ) {
    this.battle = battle;
    this.generals = generals;
    // this.formations = formations; // 预留字段
    this.tactics = tactics;
    this.stratagems = stratagems;
    this.city = city;
    
    this.initializeUnits();
  }
  
  /**
   * 初始化战斗单位
   */
  private initializeUnits(): void {
    // 初始化攻击方单位
    this.attackerUnits = this.battle.attacker.units.map(unit => {
      const general = unit.general ? this.generals[unit.general] : undefined;
      return this.createCombatUnit(unit, general, this.battle.attacker.formation, true);
    });
    
    // 初始化防守方单位
    this.defenderUnits = this.battle.defender.units.map(unit => {
      const general = unit.general ? this.generals[unit.general] : undefined;
      return this.createCombatUnit(unit, general, this.battle.defender.formation, false);
    });
  }
  
  /**
   * 创建战斗单位
   */
  private createCombatUnit(
    unit: Unit, 
    general: General | undefined, 
    formationType: string,
    isAttacker: boolean
  ): CombatUnit {
    const baseStats = UNIT_STATS[unit.type];
    const formationEffect = FORMATION_EFFECTS[formationType] || { attack: 0, defense: 0, mobility: 0 };
    const terrainBonus = this.city ? TERRAIN_BONUS[this.city.terrain] : { attack: 0, defense: 0 };
    const weatherEffect = WEATHER_EFFECTS[this.battle.weather];
    
    // 计算武将加成
    let generalBonus = { attack: 0, defense: 0 };
    if (general) {
      generalBonus.attack = general.attributes.force * 0.01; // 武力影响攻击
      generalBonus.defense = general.attributes.command * 0.01; // 统率影响防御
    }
    
    // 计算有效攻击力
    let effectiveAttack = baseStats.attack * unit.count * 0.01;
    effectiveAttack *= (1 + formationEffect.attack);
    effectiveAttack *= (1 + terrainBonus.attack);
    effectiveAttack *= (1 + weatherEffect.attack);
    effectiveAttack *= (1 + generalBonus.attack);
    
    // 攻城战防守方有城防加成
    if (!isAttacker && this.battle.type === 'siege' && this.city) {
      effectiveAttack *= (1 + this.city.stats.defense * 0.01);
    }
    
    // 计算有效防御力
    let effectiveDefense = baseStats.defense * unit.count * 0.01;
    effectiveDefense *= (1 + formationEffect.defense);
    effectiveDefense *= (1 + terrainBonus.defense);
    effectiveDefense *= (1 + weatherEffect.defense);
    effectiveDefense *= (1 + generalBonus.defense);
    
    // 攻城战防守方有城墙加成
    if (!isAttacker && this.battle.type === 'siege' && this.city) {
      effectiveDefense *= (1 + this.city.facilities.wall * 0.2);
    }
    
    return {
      unit,
      general,
      effectiveAttack,
      effectiveDefense,
      morale: unit.morale,
      fatigue: unit.fatigue
    };
  }
  
  /**
   * 执行战斗回合
   */
  executeTurn(): { attackerDamage: number; defenderDamage: number; events: string[] } {
    const events: string[] = [];
    let attackerDamage = 0;
    let defenderDamage = 0;
    
    // 攻击方攻击
    for (const attacker of this.attackerUnits) {
      if (attacker.unit.count <= 0) continue;
      
      // 选择目标（优先攻击克制的单位）
      const target = this.selectTarget(attacker, this.defenderUnits);
      if (!target) continue;
      
      const damage = this.calculateDamage(attacker, target);
      defenderDamage += damage;
      
      // 应用伤害
      target.unit.count = Math.max(0, target.unit.count - damage);
      target.morale = Math.max(0, target.morale - 5);
      
      events.push(`${attacker.general?.name || attacker.unit.type} 对 ${target.general?.name || target.unit.type} 造成 ${damage.toFixed(0)} 伤害`);
    }
    
    // 防守方反击
    for (const defender of this.defenderUnits) {
      if (defender.unit.count <= 0) continue;
      
      const target = this.selectTarget(defender, this.attackerUnits);
      if (!target) continue;
      
      const damage = this.calculateDamage(defender, target);
      attackerDamage += damage;
      
      target.unit.count = Math.max(0, target.unit.count - damage);
      target.morale = Math.max(0, target.morale - 5);
      
      events.push(`${defender.general?.name || defender.unit.type} 对 ${target.general?.name || target.unit.type} 造成 ${damage.toFixed(0)} 伤害`);
    }
    
    // 更新疲劳度
    this.attackerUnits.forEach(u => u.fatigue = Math.min(100, u.fatigue + 10));
    this.defenderUnits.forEach(u => u.fatigue = Math.min(100, u.fatigue + 10));
    
    return { attackerDamage, defenderDamage, events };
  }
  
  /**
   * 选择目标
   */
  private selectTarget(attacker: CombatUnit, enemies: CombatUnit[]): CombatUnit | null {
    const aliveEnemies = enemies.filter(e => e.unit.count > 0);
    if (aliveEnemies.length === 0) return null;
    
    // 优先攻击克制的单位
    const counterType = UNIT_COUNTER[attacker.unit.type];
    const counterTargets = aliveEnemies.filter(e => e.unit.type === counterType);
    
    if (counterTargets.length > 0) {
      // 随机选择一个克制目标
      return counterTargets[Math.floor(Math.random() * counterTargets.length)];
    }
    
    // 否则随机选择
    return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  }
  
  /**
   * 计算伤害
   */
  private calculateDamage(attacker: CombatUnit, defender: CombatUnit): number {
    let damage = attacker.effectiveAttack;
    
    // 兵种克制加成
    if (UNIT_COUNTER[attacker.unit.type] === defender.unit.type) {
      damage *= 1.3; // 克制加成30%
    }
    
    // 防御减免
    damage -= defender.effectiveDefense * 0.5;
    
    // 士气影响
    damage *= (1 + (attacker.morale - 50) * 0.01);
    damage *= (1 - (defender.morale - 50) * 0.005);
    
    // 疲劳度影响
    damage *= (1 - attacker.fatigue * 0.003);
    
    // 随机因素
    damage *= (0.8 + Math.random() * 0.4);
    
    return Math.max(1, damage);
  }
  
  /**
   * 检查战斗是否结束
   */
  checkBattleEnd(): { ended: boolean; winner: 'attacker' | 'defender' | 'draw' | null } {
    const attackerAlive = this.attackerUnits.some(u => u.unit.count > 0);
    const defenderAlive = this.defenderUnits.some(u => u.unit.count > 0);
    
    if (!attackerAlive && !defenderAlive) {
      return { ended: true, winner: 'draw' };
    }
    
    if (!attackerAlive) {
      return { ended: true, winner: 'defender' };
    }
    
    if (!defenderAlive) {
      return { ended: true, winner: 'attacker' };
    }
    
    // 检查士气崩溃
    const attackerAvgMorale = this.getAverageMorale(this.attackerUnits);
    const defenderAvgMorale = this.defenderUnits.some(u => u.unit.count > 0) ? 
      this.getAverageMorale(this.defenderUnits) : 100;
    
    if (attackerAvgMorale < 20 && defenderAvgMorale >= 20) {
      return { ended: true, winner: 'defender' };
    }
    
    if (defenderAvgMorale < 20 && attackerAvgMorale >= 20) {
      return { ended: true, winner: 'attacker' };
    }
    
    return { ended: false, winner: null };
  }
  
  /**
   * 获取平均士气
   */
  private getAverageMorale(units: CombatUnit[]): number {
    const aliveUnits = units.filter(u => u.unit.count > 0);
    if (aliveUnits.length === 0) return 0;
    
    const totalMorale = aliveUnits.reduce((sum, u) => sum + u.morale * u.unit.count, 0);
    const totalCount = aliveUnits.reduce((sum, u) => sum + u.unit.count, 0);
    
    return totalMorale / totalCount;
  }
  
  /**
   * 执行战术
   */
  executeTactics(tacticsId: string, isAttacker: boolean): { success: boolean; effect: number; message: string } {
    const tactics = this.tactics[tacticsId];
    if (!tactics) {
      return { success: false, effect: 0, message: '战术不存在' };
    }
    
    // 检查条件
    if (tactics.requirements.terrain && this.city) {
      if (!tactics.requirements.terrain.includes(this.city.terrain)) {
        return { success: false, effect: 0, message: '地形不符合要求' };
      }
    }
    
    if (tactics.requirements.weather) {
      if (!tactics.requirements.weather.includes(this.battle.weather)) {
        return { success: false, effect: 0, message: '天气不符合要求' };
      }
    }
    
    // 计算成功率
    let successRate = tactics.successRate;
    const units = isAttacker ? this.attackerUnits : this.defenderUnits;
    const general = units.find(u => u.general)?.general;
    
    if (general && tactics.requirements.minIntelligence) {
      if (general.attributes.intelligence < tactics.requirements.minIntelligence) {
        return { success: false, effect: 0, message: '智力不足' };
      }
      successRate += (general.attributes.intelligence - tactics.requirements.minIntelligence) * 0.01;
    }
    
    // 执行战术
    const success = Math.random() < successRate;
    
    if (success) {
      const effect = tactics.damageBonus;
      const targets = isAttacker ? this.defenderUnits : this.attackerUnits;
      
      // 对所有敌方单位造成伤害
      targets.forEach(target => {
        if (target.unit.count > 0) {
          const damage = target.unit.count * effect * 0.1;
          target.unit.count = Math.max(0, target.unit.count - damage);
          target.morale = Math.max(0, target.morale - 10);
        }
      });
      
      return { success: true, effect, message: `${tactics.name}成功！` };
    } else {
      return { success: false, effect: 0, message: `${tactics.name}失败` };
    }
  }
  
  /**
   * 执行计谋
   */
  executeStratagem(stratagemId: string, targetGeneralId: string, isAttacker: boolean): { success: boolean; message: string } {
    const stratagem = this.stratagems[stratagemId];
    if (!stratagem) {
      return { success: false, message: '计谋不存在' };
    }
    
    const targetGeneral = this.generals[targetGeneralId];
    if (!targetGeneral) {
      return { success: false, message: '目标武将不存在' };
    }
    
    // 计算成功率
    let successRate = stratagem.successRate;
    const units = isAttacker ? this.attackerUnits : this.defenderUnits;
    const general = units.find(u => u.general)?.general;
    
    if (general && stratagem.requirements.minIntelligence) {
      successRate += (general.attributes.intelligence - stratagem.requirements.minIntelligence) * 0.01;
    }
    
    // 目标忠诚度影响
    if (stratagem.requirements.targetLoyalty && targetGeneral.loyalty > stratagem.requirements.targetLoyalty) {
      return { success: false, message: '目标忠诚度过高' };
    }
    
    // 执行计谋
    const success = Math.random() < successRate;
    
    if (success) {
      // 应用效果
      if (stratagem.effect.loyaltyChange) {
        targetGeneral.loyalty = Math.max(0, Math.min(100, targetGeneral.loyalty + stratagem.effect.loyaltyChange));
      }
      
      if (stratagem.effect.moraleChange) {
        const targetUnits = isAttacker ? this.defenderUnits : this.attackerUnits;
        targetUnits.forEach(u => {
          u.morale = Math.max(0, Math.min(100, u.morale + stratagem.effect.moraleChange!));
        });
      }
      
      return { success: true, message: `${stratagem.name}成功！` };
    } else {
      return { success: false, message: `${stratagem.name}失败` };
    }
  }
  
  /**
   * 获取战斗结果
   */
  getBattleResult(): BattleResult {
    const endCheck = this.checkBattleEnd();
    
    // 计算损失
    const attackerLosses = this.battle.attacker.units.reduce((sum, u) => {
      const current = this.attackerUnits.find(cu => cu.unit === u);
      return sum + (u.count - (current?.unit.count || 0));
    }, 0);
    
    const defenderLosses = this.battle.defender.units.reduce((sum, u) => {
      const current = this.defenderUnits.find(cu => cu.unit === u);
      return sum + (u.count - (current?.unit.count || 0));
    }, 0);
    
    // 计算士气
    const attackerMorale = this.getAverageMorale(this.attackerUnits);
    const defenderMorale = this.getAverageMorale(this.defenderUnits);
    
    // 计算俘虏
    const captives: string[] = [];
    if (endCheck.winner === 'attacker') {
      this.defenderUnits.forEach(u => {
        if (u.general && u.unit.count <= 0 && Math.random() < 0.3) {
          captives.push(u.general.id);
        }
      });
    } else if (endCheck.winner === 'defender') {
      this.attackerUnits.forEach(u => {
        if (u.general && u.unit.count <= 0 && Math.random() < 0.3) {
          captives.push(u.general.id);
        }
      });
    }
    
    // 计算经验
    const experience = {
      attacker: Math.floor(defenderLosses * 0.1 + (endCheck.winner === 'attacker' ? 10 : 0)),
      defender: Math.floor(attackerLosses * 0.1 + (endCheck.winner === 'defender' ? 10 : 0))
    };
    
    return {
      winner: endCheck.winner || 'draw',
      attackerLosses,
      defenderLosses,
      attackerMorale,
      defenderMorale,
      captives,
      experience
    };
  }
  
  /**
   * 获取当前战斗状态
   */
  getBattleState(): {
    attackerUnits: CombatUnit[];
    defenderUnits: CombatUnit[];
    turn: number;
    status: Battle['status'];
  } {
    return {
      attackerUnits: this.attackerUnits,
      defenderUnits: this.defenderUnits,
      turn: this.battle.turn,
      status: this.battle.status
    };
  }
}
