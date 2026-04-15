/**
 * AI决策执行器
 * 执行AI生成的决策
 */

import type { GameState } from '@/types';
import { AIDecision, DecisionType } from './DecisionGenerator';
import { useGameStore } from '@/store';

/**
 * 决策执行结果
 */
export interface ExecutionResult {
  success: boolean;
  decision: AIDecision;
  message: string;
  effects?: {
    moneyChange?: number;
    foodChange?: number;
    soldierChange?: number;
    cityChange?: string;
    generalChange?: string;
  };
}

/**
 * AI决策执行器
 */
export class AIExecutor {
  /**
   * 执行决策
   */
  static executeDecision(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    switch (decision.type) {
      case DecisionType.DEVELOP:
        return this.executeDevelop(decision, gameState);
      
      case DecisionType.RECRUIT:
        return this.executeRecruit(decision, gameState);
      
      case DecisionType.BUILD_FACILITY:
        return this.executeBuild(decision, gameState);
      
      case DecisionType.ATTACK:
        return this.executeAttack(decision, gameState);
      
      case DecisionType.DEFEND:
        return this.executeDefend(decision, gameState);
      
      case DecisionType.MOVE_ARMY:
        return this.executeMoveArmy(decision, gameState);
      
      case DecisionType.ALLIANCE:
        return this.executeAlliance(decision, gameState);
      
      case DecisionType.DECLARE_WAR:
        return this.executeDeclareWar(decision, gameState);
      
      case DecisionType.PEACE:
        return this.executePeace(decision, gameState);
      
      case DecisionType.RECRUIT_GENERAL:
        return this.executeRecruitGeneral(decision, gameState);
      
      case DecisionType.PROMOTE_GENERAL:
        return this.executePromoteGeneral(decision, gameState);
      
      case DecisionType.SEARCH_ITEM:
        return this.executeSearchItem(decision, gameState);
      
      case DecisionType.ASSIGN_GENERAL:
        return this.executeAssignGeneral(decision, gameState);
      
      default:
        return {
          success: false,
          decision,
          message: '未知的决策类型'
        };
    }
  }

  /**
   * 执行发展决策
   */
  private static executeDevelop(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const city = gameState.cities[decision.target || ''];
    if (!city) {
      return { success: false, decision, message: '城市不存在' };
    }

    const focus = decision.params?.focus as string;
    let effect = '';
    
    // 使用gameStore更新城市
    const store = useGameStore.getState();
    
    if (focus === 'commerce') {
      const newCommerce = Math.min(100, city.stats.commerce + 10);
      store.updateCity(city.id, {
        stats: { ...city.stats, commerce: newCommerce }
      });
      effect = `商业度提升至${newCommerce}`;
    } else if (focus === 'development') {
      const newDevelopment = Math.min(100, city.stats.development + 10);
      store.updateCity(city.id, {
        stats: { ...city.stats, development: newDevelopment }
      });
      effect = `开发度提升至${newDevelopment}`;
    }

    return {
      success: true,
      decision,
      message: `${city.name} ${effect}`,
      effects: { cityChange: city.id }
    };
  }

  /**
   * 执行征兵决策
   */
  private static executeRecruit(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const city = gameState.cities[decision.target || ''];
    if (!city) {
      return { success: false, decision, message: '城市不存在' };
    }

    const amount = (decision.params?.amount as number) || 500;
    const cost = amount * 10;

    if (city.resources.money < cost) {
      return { success: false, decision, message: '金钱不足' };
    }

    const store = useGameStore.getState();
    store.updateCity(city.id, {
      resources: {
        ...city.resources,
        money: city.resources.money - cost,
        soldiers: city.resources.soldiers + amount
      }
    });

    return {
      success: true,
      decision,
      message: `${city.name} 征兵${amount}人`,
      effects: {
        moneyChange: -cost,
        soldierChange: amount
      }
    };
  }

  /**
   * 执行建设决策
   */
  private static executeBuild(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const city = gameState.cities[decision.target || ''];
    if (!city) {
      return { success: false, decision, message: '城市不存在' };
    }

    const facility = decision.params?.facility as string;
    const cost = 300;

    if (city.resources.money < cost) {
      return { success: false, decision, message: '金钱不足' };
    }

    const store = useGameStore.getState();
    const facilities = { ...city.facilities };

    if (facility === 'wall') {
      facilities.wall = Math.min(5, facilities.wall + 1);
      store.updateCity(city.id, {
        resources: { ...city.resources, money: city.resources.money - cost },
        facilities
      });
    }

    return {
      success: true,
      decision,
      message: `${city.name} 城墙升级`,
      effects: { moneyChange: -cost }
    };
  }

  /**
   * 执行进攻决策
   */
  private static executeAttack(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const targetCity = gameState.cities[decision.target || ''];
    if (!targetCity) {
      return { success: false, decision, message: '目标城市不存在' };
    }

    // 这里只是标记进攻意图，实际战斗在战斗系统中处理
    return {
      success: true,
      decision,
      message: `准备进攻 ${targetCity.name}`,
      effects: { cityChange: targetCity.id }
    };
  }

  /**
   * 执行防守决策
   */
  private static executeDefend(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const city = gameState.cities[decision.target || ''];
    if (!city) {
      return { success: false, decision, message: '城市不存在' };
    }

    // 提升城防
    const store = useGameStore.getState();
    const newDefense = Math.min(100, city.stats.defense + 15);
    store.updateCity(city.id, {
      stats: { ...city.stats, defense: newDefense }
    });

    return {
      success: true,
      decision,
      message: `${city.name} 加强防守`,
      effects: { cityChange: city.id }
    };
  }

  /**
   * 执行军队调动决策
   */
  private static executeMoveArmy(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const fromCity = gameState.cities[decision.target || ''];
    const toCityId = decision.params?.destination as string;
    const toCity = gameState.cities[toCityId];

    if (!fromCity || !toCity) {
      return { success: false, decision, message: '城市不存在' };
    }

    // 找到在该城市的军队
    const army = Object.values(gameState.armies).find(
      a => a.location === fromCity.id && a.faction === fromCity.faction
    );

    if (!army) {
      return { success: false, decision, message: '未找到可调动的军队' };
    }

    // 执行移动
    const store = useGameStore.getState();
    const success = store.moveArmy(army.id, toCityId);

    return {
      success,
      decision,
      message: success 
        ? `军队从${fromCity.name}调动到${toCity.name}` 
        : '军队调动失败'
    };
  }

  /**
   * 执行结盟决策
   */
  private static executeAlliance(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const targetFaction = gameState.factions[decision.target || ''];
    if (!targetFaction) {
      return { success: false, decision, message: '目标势力不存在' };
    }

    // 这里只是记录结盟意图，实际外交在外交系统中处理
    return {
      success: true,
      decision,
      message: `向 ${targetFaction.name} 提议结盟`
    };
  }

  /**
   * 执行宣战决策
   */
  private static executeDeclareWar(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const targetFaction = gameState.factions[decision.target || ''];
    if (!targetFaction) {
      return { success: false, decision, message: '目标势力不存在' };
    }

    // 更新外交状态
    const store = useGameStore.getState();
    const faction = gameState.factions[gameState.currentPlayer];
    
    if (faction) {
      const diplomacy = { ...faction.diplomacy };
      diplomacy[targetFaction.id] = {
        relation: -100,
        status: 'enemy'
      };
      store.updateFaction(faction.id, { diplomacy });
    }

    return {
      success: true,
      decision,
      message: `向 ${targetFaction.name} 宣战`
    };
  }

  /**
   * 执行求和决策
   */
  private static executePeace(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const targetFaction = gameState.factions[decision.target || ''];
    if (!targetFaction) {
      return { success: false, decision, message: '目标势力不存在' };
    }

    return {
      success: true,
      decision,
      message: `向 ${targetFaction.name} 求和`
    };
  }

  /**
   * 执行招募武将决策
   */
  private static executeRecruitGeneral(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const general = gameState.generals[decision.target || ''];
    if (!general) {
      return { success: false, decision, message: '武将不存在' };
    }

    if (general.faction) {
      return { success: false, decision, message: '武将已有归属' };
    }

    // 招募武将
    const store = useGameStore.getState();
    const faction = gameState.factions[gameState.currentPlayer];
    
    if (faction) {
      store.updateGeneral(general.id, {
        faction: faction.id,
        loyalty: 50
      });
      
      store.updateFaction(faction.id, {
        generals: [...faction.generals, general.id]
      });
    }

    return {
      success: true,
      decision,
      message: `招募 ${general.name}`,
      effects: { generalChange: general.id }
    };
  }

  /**
   * 执行封官决策
   */
  private static executePromoteGeneral(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const general = gameState.generals[decision.target || ''];
    if (!general) {
      return { success: false, decision, message: '武将不存在' };
    }

    // 这里只是记录封官意图，实际封官在官职系统中处理
    return {
      success: true,
      decision,
      message: `为 ${general.name} 封官`
    };
  }

  /**
   * 执行搜索宝物决策
   */
  private static executeSearchItem(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const city = gameState.cities[decision.target || ''];
    if (!city) {
      return { success: false, decision, message: '城市不存在' };
    }

    // 执行搜索
    const store = useGameStore.getState();
    const generalId = decision.params?.generalId as string;
    
    if (generalId) {
      const result = store.executeSearch(generalId, city.id);
      
      return {
        success: true,
        decision,
        message: `在${city.name}搜索: ${result.message}`
      };
    }

    return {
      success: false,
      decision,
      message: '未指定搜索武将'
    };
  }

  /**
   * 执行分配武将决策
   */
  private static executeAssignGeneral(
    decision: AIDecision,
    gameState: GameState
  ): ExecutionResult {
    const city = gameState.cities[decision.target || ''];
    const generalId = decision.params?.generalId as string;
    const general = gameState.generals[generalId];

    if (!city || !general) {
      return { success: false, decision, message: '城市或武将不存在' };
    }

    // 更新武将位置
    const store = useGameStore.getState();
    store.updateGeneral(generalId, { location: city.id });
    
    // 更新城市武将列表
    if (!city.generals.includes(generalId)) {
      store.updateCity(city.id, {
        generals: [...city.generals, generalId]
      });
    }

    return {
      success: true,
      decision,
      message: `${general.name} 被分配到 ${city.name}`,
      effects: { cityChange: city.id, generalChange: generalId }
    };
  }

  /**
   * 批量执行决策
   */
  static executeDecisions(
    decisions: AIDecision[],
    gameState: GameState
  ): ExecutionResult[] {
    return decisions.map(decision => this.executeDecision(decision, gameState));
  }
}
