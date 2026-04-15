import { create } from 'zustand';
import { BattleSystem, BattleResult } from '@/systems/battle/BattleSystem';
import type { Battle, General, Formation, Tactics, Stratagem, City } from '@/types';

interface BattleState {
  // 当前战斗
  currentBattle: Battle | null;
  battleSystem: BattleSystem | null;
  
  // 战斗状态
  isBattleActive: boolean;
  battleTurn: number;
  battleLog: string[];
  
  // 战斗结果
  battleResult: BattleResult | null;
  
  // Actions
  startBattle: (
    battle: Battle,
    generals: Record<string, General>,
    formations: Record<string, Formation>,
    tactics: Record<string, Tactics>,
    stratagems: Record<string, Stratagem>,
    city?: City
  ) => void;
  
  executeTurn: () => void;
  executeTactics: (tacticsId: string) => { success: boolean; effect: number; message: string };
  executeStratagem: (stratagemId: string, targetGeneralId: string) => { success: boolean; message: string };
  endBattle: () => void;
  clearBattle: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  currentBattle: null,
  battleSystem: null,
  isBattleActive: false,
  battleTurn: 0,
  battleLog: [],
  battleResult: null,
  
  // 开始战斗
  startBattle: (battle, generals, formations, tactics, stratagems, city) => {
    const battleSystem = new BattleSystem(
      battle,
      generals,
      formations,
      tactics,
      stratagems,
      city
    );
    
    set({
      currentBattle: battle,
      battleSystem,
      isBattleActive: true,
      battleTurn: 1,
      battleLog: [`战斗开始：${battle.type === 'field' ? '野战' : battle.type === 'siege' ? '攻城战' : '水战'}`],
      battleResult: null
    });
  },
  
  // 执行战斗回合
  executeTurn: () => {
    const { battleSystem, battleTurn, battleLog } = get();
    if (!battleSystem) return;
    
    // 执行回合
    const result = battleSystem.executeTurn();
    
    // 添加日志
    const newLog = [
      ...battleLog,
      `回合 ${battleTurn}`,
      ...result.events
    ];
    
    // 检查战斗是否结束
    const endCheck = battleSystem.checkBattleEnd();
    
    if (endCheck.ended) {
      const battleResult = battleSystem.getBattleResult();
      set({
        isBattleActive: false,
        battleLog: [
          ...newLog,
          `战斗结束：${battleResult.winner === 'attacker' ? '攻击方' : battleResult.winner === 'defender' ? '防守方' : '平局'}获胜`,
          `攻击方损失：${battleResult.attackerLosses}`,
          `防守方损失：${battleResult.defenderLosses}`,
          `俘虏：${battleResult.captives.length}人`
        ],
        battleResult
      });
    } else {
      set({
        battleTurn: battleTurn + 1,
        battleLog: newLog
      });
    }
  },
  
  // 执行战术
  executeTactics: (tacticsId) => {
    const { battleSystem, battleLog, isBattleActive } = get();
    if (!battleSystem || !isBattleActive) {
      return { success: false, effect: 0, message: '战斗未激活' };
    }
    
    const result = battleSystem.executeTactics(tacticsId, true);
    
    set({
      battleLog: [...battleLog, result.message]
    });
    
    return result;
  },
  
  // 执行计谋
  executeStratagem: (stratagemId, targetGeneralId) => {
    const { battleSystem, battleLog, isBattleActive } = get();
    if (!battleSystem || !isBattleActive) {
      return { success: false, message: '战斗未激活' };
    }
    
    const result = battleSystem.executeStratagem(stratagemId, targetGeneralId, true);
    
    set({
      battleLog: [...battleLog, result.message]
    });
    
    return result;
  },
  
  // 结束战斗
  endBattle: () => {
    const { battleSystem, battleLog } = get();
    if (!battleSystem) return;
    
    const battleResult = battleSystem.getBattleResult();
    set({
      isBattleActive: false,
      battleResult,
      battleLog: [
        ...battleLog,
        '战斗结束！',
        `获胜方：${battleResult.winner === 'attacker' ? '攻击方' : battleResult.winner === 'defender' ? '防守方' : '平局'}`
      ]
    });
  },
  
  // 清除战斗
  clearBattle: () => {
    set({
      currentBattle: null,
      battleSystem: null,
      isBattleActive: false,
      battleTurn: 0,
      battleLog: [],
      battleResult: null
    });
  }
}));
