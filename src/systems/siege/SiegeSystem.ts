import type { City, Army, General, Formation, Weather } from '@/types';

/**
 * 攻城战结果
 */
export interface SiegeResult {
  success: boolean; // 是否攻破
  attackerLosses: number; // 攻方损失
  defenderLosses: number; // 守方损失
  wallDamage: number; // 城墙损坏
  gateDestroyed: boolean; // 城门是否被毁
  siegeEquipmentUsed: string[]; // 使用的攻城器械
  rounds: SiegeRound[]; // 每回合详情
}

/**
 * 攻城战回合
 */
export interface SiegeRound {
  round: number;
  attackerAction: 'assault' | 'bombard' | 'siege_equipment' | 'retreat';
  defenderAction: 'defend' | 'sally' | 'fire_arrows';
  attackerDamage: number;
  defenderDamage: number;
  wallIntegrity: number; // 城墙完整度
  description: string;
}

/**
 * 攻城器械类型
 */
export type SiegeEquipment = 'ram' | 'tower' | 'catapult' | 'ladder';

/**
 * 攻城战系统
 * 管理攻城战的机制和结果判定
 */
export class SiegeSystem {
  /**
   * 执行攻城战
   */
  static executeSiege(
    attacker: Army,
    defender: City,
    attackerGenerals: General[],
    defenderGenerals: General[],
    formation: Formation,
    weather: Weather,
    siegeEquipment: SiegeEquipment[]
  ): SiegeResult {
    const rounds: SiegeRound[] = [];
    const equipmentUsed: string[] = [];
    
    // 初始化城墙和城门
    let wallIntegrity = defender.facilities.wall * 20; // 城墙等级*20 = 城墙完整度
    let gateDestroyed = false;
    const maxWallIntegrity = wallIntegrity;
    
    // 初始化兵力
    let attackerSoldiers = attacker.units.reduce((sum, u) => sum + u.count, 0);
    let defenderSoldiers = defender.resources.soldiers;
    
    let round = 1;
    const maxRounds = 10; // 最多10回合
    
    while (round <= maxRounds && attackerSoldiers > 0 && defenderSoldiers > 0 && wallIntegrity > 0) {
      const roundResult = this.executeRound(
        round,
        attacker,
        defender,
        attackerGenerals,
        defenderGenerals,
        formation,
        weather,
        wallIntegrity,
        maxWallIntegrity,
        siegeEquipment,
        attackerSoldiers,
        defenderSoldiers
      );
      
      rounds.push(roundResult);
      wallIntegrity = roundResult.wallIntegrity;
      attackerSoldiers -= roundResult.attackerDamage;
      defenderSoldiers -= roundResult.defenderDamage;
      
      if (roundResult.attackerAction === 'siege_equipment') {
        equipmentUsed.push(roundResult.description);
      }
      
      // 检查城门是否被毁
      if (wallIntegrity < maxWallIntegrity * 0.3 && !gateDestroyed) {
        gateDestroyed = Math.random() < 0.3;
      }
      
      round++;
    }
    
    // 判定胜负
    const success = wallIntegrity <= 0 || defenderSoldiers <= 0;
    
    // 计算损失
    const attackerLosses = attacker.units.reduce((sum, u) => sum + u.count, 0) - attackerSoldiers;
    const defenderLosses = defender.resources.soldiers - defenderSoldiers;
    const wallDamage = maxWallIntegrity - wallIntegrity;
    
    return {
      success,
      attackerLosses,
      defenderLosses,
      wallDamage,
      gateDestroyed,
      siegeEquipmentUsed: equipmentUsed,
      rounds,
    };
  }

  /**
   * 执行攻城战回合
   */
  private static executeRound(
    round: number,
    attacker: Army,
    defender: City,
    attackerGenerals: General[],
    defenderGenerals: General[],
    formation: Formation,
    weather: Weather,
    wallIntegrity: number,
    maxWallIntegrity: number,
    siegeEquipment: SiegeEquipment[],
    attackerSoldiers: number,
    defenderSoldiers: number
  ): SiegeRound {
    // 决定行动
    const attackerAction = this.decideAttackerAction(wallIntegrity, maxWallIntegrity, siegeEquipment);
    const defenderAction = this.decideDefenderAction(attackerSoldiers, defenderSoldiers);
    
    let attackerDamage = 0;
    let defenderDamage = 0;
    let newWallIntegrity = wallIntegrity;
    let description = '';
    
    // 根据行动类型计算伤害
    switch (attackerAction) {
      case 'assault':
        // 直接攻击
        attackerDamage = this.calculateAssaultDamage(attacker, defender, defenderGenerals, weather);
        defenderDamage = this.calculateDefenseDamage(defender, attackerGenerals, weather);
        description = '攻方发动猛烈攻击！';
        break;
        
      case 'bombard':
        // 炮击城墙
        const bombardDamage = this.calculateBombardDamage(formation, weather);
        newWallIntegrity -= bombardDamage;
        defenderDamage = this.calculateDefenseDamage(defender, attackerGenerals, weather) * 0.5;
        description = `攻方炮击城墙，造成${bombardDamage}点损坏！`;
        break;
        
      case 'siege_equipment':
        // 使用攻城器械
        const equipment = siegeEquipment[Math.floor(Math.random() * siegeEquipment.length)];
        const equipmentResult = this.useSiegeEquipment(equipment, wallIntegrity, maxWallIntegrity);
        newWallIntegrity = equipmentResult.wallIntegrity;
        attackerDamage = equipmentResult.attackerDamage;
        defenderDamage = equipmentResult.defenderDamage;
        description = `攻方使用${this.getEquipmentName(equipment)}！`;
        break;
        
      case 'retreat':
        // 撤退
        description = '攻方选择撤退。';
        break;
    }
    
    // 守方行动
    if (defenderAction === 'sally') {
      // 出击
      const sallyDamage = this.calculateSallyDamage(defender, attackerGenerals, weather);
      attackerDamage += sallyDamage;
      description += ' 守方出击！';
    } else if (defenderAction === 'fire_arrows') {
      // 火箭
      const fireDamage = this.calculateFireArrowDamage(weather);
      attackerDamage += fireDamage;
      description += ' 守方发射火箭！';
    }
    
    return {
      round,
      attackerAction,
      defenderAction,
      attackerDamage,
      defenderDamage,
      wallIntegrity: Math.max(0, newWallIntegrity),
      description,
    };
  }

  /**
   * 决定攻方行动
   */
  private static decideAttackerAction(
    wallIntegrity: number,
    maxWallIntegrity: number,
    siegeEquipment: SiegeEquipment[]
  ): 'assault' | 'bombard' | 'siege_equipment' | 'retreat' {
    const wallRatio = wallIntegrity / maxWallIntegrity;
    
    // 城墙损坏严重时直接攻击
    if (wallRatio < 0.3) {
      return Math.random() < 0.7 ? 'assault' : 'siege_equipment';
    }
    
    // 有攻城器械时使用
    if (siegeEquipment.length > 0 && Math.random() < 0.4) {
      return 'siege_equipment';
    }
    
    // 否则随机选择
    const rand = Math.random();
    if (rand < 0.4) return 'assault';
    if (rand < 0.7) return 'bombard';
    if (rand < 0.9) return 'siege_equipment';
    return 'retreat';
  }

  /**
   * 决定守方行动
   */
  private static decideDefenderAction(
    attackerSoldiers: number,
    defenderSoldiers: number
  ): 'defend' | 'sally' | 'fire_arrows' {
    const ratio = defenderSoldiers / attackerSoldiers;
    
    // 兵力优势时出击
    if (ratio > 1.5 && Math.random() < 0.3) {
      return 'sally';
    }
    
    // 否则发射火箭
    if (Math.random() < 0.4) {
      return 'fire_arrows';
    }
    
    return 'defend';
  }

  /**
   * 计算攻击伤害
   */
  private static calculateAssaultDamage(
    attacker: Army,
    defender: City,
    defenderGenerals: General[],
    weather: Weather
  ): number {
    // 基础伤害
    let damage = attacker.units.reduce((sum, u) => sum + u.count, 0) * 0.1;
    
    // 武将加成
    const avgForce = defenderGenerals.length > 0
      ? defenderGenerals.reduce((sum, g) => sum + g.attributes.force, 0) / defenderGenerals.length
      : 50;
    damage *= (1 + avgForce / 200);
    
    // 城防加成
    damage *= (1 - defender.stats.defense / 200);
    
    // 天气影响
    if (weather === 'rain') damage *= 0.8;
    if (weather === 'snow') damage *= 0.7;
    
    return Math.round(damage);
  }

  /**
   * 计算防御伤害
   */
  private static calculateDefenseDamage(
    defender: City,
    attackerGenerals: General[],
    weather: Weather
  ): number {
    // 基础伤害
    let damage = defender.resources.soldiers * 0.15;
    
    // 城防加成
    damage *= (1 + defender.stats.defense / 100);
    
    // 武将加成
    const avgCommand = attackerGenerals.length > 0
      ? attackerGenerals.reduce((sum, g) => sum + g.attributes.command, 0) / attackerGenerals.length
      : 50;
    damage *= (1 + avgCommand / 200);
    
    // 天气影响
    if (weather === 'rain') damage *= 1.2;
    if (weather === 'snow') damage *= 1.1;
    
    return Math.round(damage);
  }

  /**
   * 计算炮击伤害
   */
  private static calculateBombardDamage(_formation: Formation, weather: Weather): number {
    let damage = 10 + Math.random() * 20;
    
    // 天气影响
    if (weather === 'rain') damage *= 0.5;
    if (weather === 'snow') damage *= 0.7;
    
    return Math.round(damage);
  }

  /**
   * 使用攻城器械
   */
  private static useSiegeEquipment(
    equipment: SiegeEquipment,
    wallIntegrity: number,
    _maxWallIntegrity: number // 预留参数
  ): { wallIntegrity: number; attackerDamage: number; defenderDamage: number } {
    let wallDamage = 0;
    let attackerDamage = 0;
    let defenderDamage = 0;
    
    switch (equipment) {
      case 'ram':
        // 攻城锤
        wallDamage = 15 + Math.random() * 10;
        attackerDamage = 50 + Math.random() * 50;
        defenderDamage = 30 + Math.random() * 30;
        break;
        
      case 'tower':
        // 攻城塔
        wallDamage = 5 + Math.random() * 5;
        attackerDamage = 30 + Math.random() * 30;
        defenderDamage = 50 + Math.random() * 50;
        break;
        
      case 'catapult':
        // 投石车
        wallDamage = 20 + Math.random() * 15;
        attackerDamage = 20 + Math.random() * 20;
        defenderDamage = 40 + Math.random() * 40;
        break;
        
      case 'ladder':
        // 云梯
        wallDamage = 2 + Math.random() * 3;
        attackerDamage = 80 + Math.random() * 80;
        defenderDamage = 60 + Math.random() * 60;
        break;
    }
    
    return {
      wallIntegrity: Math.max(0, wallIntegrity - wallDamage),
      attackerDamage,
      defenderDamage,
    };
  }

  /**
   * 计算出击伤害
   */
  private static calculateSallyDamage(
    defender: City,
    attackerGenerals: General[],
    weather: Weather
  ): number {
    let damage = defender.resources.soldiers * 0.2;
    
    const avgForce = attackerGenerals.length > 0
      ? attackerGenerals.reduce((sum, g) => sum + g.attributes.force, 0) / attackerGenerals.length
      : 50;
    damage *= (1 + avgForce / 200);
    
    if (weather === 'rain') damage *= 0.9;
    if (weather === 'snow') damage *= 0.8;
    
    return Math.round(damage);
  }

  /**
   * 计算火箭伤害
   */
  private static calculateFireArrowDamage(weather: Weather): number {
    let damage = 30 + Math.random() * 30;
    
    // 雨天火箭效果减弱
    if (weather === 'rain') damage *= 0.3;
    if (weather === 'snow') damage *= 0.5;
    
    return Math.round(damage);
  }

  /**
   * 获取攻城器械名称
   */
  private static getEquipmentName(equipment: SiegeEquipment): string {
    const names = {
      ram: '攻城锤',
      tower: '攻城塔',
      catapult: '投石车',
      ladder: '云梯',
    };
    return names[equipment];
  }
}
