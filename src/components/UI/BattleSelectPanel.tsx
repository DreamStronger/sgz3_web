/**
 * 战斗选择面板
 * 让玩家选择进攻军队和目标城市
 */

import { useState } from 'react';
import { useGameStore } from '@/store';
import { useDialogStore } from '@/store/dialogStore';
import type { Army, City } from '@/types';

interface BattleSelectPanelProps {
  onClose: () => void;
}

export function BattleSelectPanel({ onClose }: BattleSelectPanelProps) {
  const { armies, cities, generals, factions, currentPlayer } = useGameStore();
  const { showAlert } = useDialogStore();

  const [selectedArmy, setSelectedArmy] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [showBattle, setShowBattle] = useState(false);

  // 获取玩家军队
  const playerArmies = Object.values(armies).filter(
    army => army.faction === currentPlayer
  );

  // 获取可攻击的目标城市
  const getAttackableTargets = (armyId: string): City[] => {
    const army = armies[armyId];
    if (!army) return [];

    const currentCity = cities[army.location];
    if (!currentCity) return [];

    // 获取相邻城市中敌方城市
    const targets: City[] = [];
    currentCity.neighbors.forEach(neighborId => {
      const neighbor = cities[neighborId];
      if (neighbor && neighbor.faction !== currentPlayer) {
        targets.push(neighbor);
      }
    });

    return targets;
  };

  const attackableTargets = selectedArmy ? getAttackableTargets(selectedArmy) : [];

  const handleStartBattle = () => {
    if (!selectedArmy) {
      showAlert('请先选择进攻军队');
      return;
    }

    if (!selectedTarget) {
      showAlert('请选择攻击目标');
      return;
    }

    // 检查军队状态
    const army = armies[selectedArmy];
    if (army.status !== 'idle') {
      showAlert('该军队正在执行其他任务');
      return;
    }

    // 检查兵力
    const totalSoldiers = army.units.reduce((sum, unit) => sum + unit.count, 0);
    if (totalSoldiers < 100) {
      showAlert('军队兵力不足');
      return;
    }

    // 开始战斗
    setShowBattle(true);
  };

  const getArmyInfo = (army: Army): string => {
    const totalSoldiers = army.units.reduce((sum, unit) => sum + unit.count, 0);
    const generalNames = army.generals
      .map(id => generals[id]?.name)
      .filter(Boolean)
      .join('、');
    return `${totalSoldiers}人 | ${generalNames || '无武将'}`;
  };

  const getCityDefense = (city: City): string => {
    return `城防${city.stats.defense} | 兵${city.resources.soldiers}`;
  };

  const getFactionName = (factionId: string): string => {
    return factions[factionId]?.name || '未知';
  };

  if (showBattle && selectedArmy && selectedTarget) {
    // 这里应该打开战斗界面
    // 暂时使用简单的提示
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80"></div>
        <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-red-800/50 shadow-2xl w-[800px] max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-red-800/30">
            <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
              ⚔️ 战斗准备
            </h2>
            <button
              onClick={() => setShowBattle(false)}
              className="text-red-400 hover:text-red-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-red-900/30 transition-colors"
            >
              ×
            </button>
          </div>
          
          <div className="p-6 text-center">
            <p className="text-amber-200 mb-4">
              战斗系统已就绪
            </p>
            <p className="text-sm text-amber-200/60 mb-6">
              攻击军队: {getArmyInfo(armies[selectedArmy])}<br/>
              目标城市: {cities[selectedTarget]?.name}
            </p>
            <p className="text-xs text-amber-200/40">
              战斗功能已集成到军队面板，请从军队面板发起战斗
            </p>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-red-800/30">
            <button
              onClick={() => setShowBattle(false)}
              className="px-6 py-2 bg-stone-700/60 hover:bg-stone-600/60 rounded text-sm font-medium transition-colors border border-stone-500/30"
            >
              返回
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-700/60 hover:bg-red-600/60 rounded text-sm font-medium transition-colors border border-red-500/30"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-red-800/50 shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-red-800/30">
          <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
            ⚔️ 发起战斗
          </h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-red-900/30 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* 选择进攻军队 */}
          <div>
            <h3 className="text-sm font-semibold text-amber-200 mb-2">选择进攻军队</h3>
            {playerArmies.length === 0 ? (
              <div className="bg-stone-800/40 rounded p-3 text-center text-amber-200/60 text-sm">
                暂无可用的军队，请先在军事面板中创建军队
              </div>
            ) : (
              <div className="space-y-2">
                {playerArmies.map(army => {
                  const city = cities[army.location];
                  const isSelected = selectedArmy === army.id;
                  const hasTargets = getAttackableTargets(army.id).length > 0;

                  return (
                    <button
                      key={army.id}
                      onClick={() => {
                        setSelectedArmy(army.id);
                        setSelectedTarget('');
                      }}
                      disabled={!hasTargets}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        isSelected
                          ? 'bg-red-900/40 border-red-600/60'
                          : hasTargets
                            ? 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20 hover:border-amber-700/40'
                            : 'bg-stone-900/40 border-stone-800/20 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-amber-100">
                            {city?.name || '未知位置'}
                          </div>
                          <div className="text-xs text-amber-200/60 mt-1">
                            {getArmyInfo(army)}
                          </div>
                        </div>
                        <div className="text-xs">
                          {army.status === 'idle' ? (
                            hasTargets ? (
                              <span className="text-green-400">可出击</span>
                            ) : (
                              <span className="text-amber-400/60">无目标</span>
                            )
                          ) : (
                            <span className="text-orange-400">{army.status}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 选择攻击目标 */}
          {selectedArmy && attackableTargets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-200 mb-2">选择攻击目标</h3>
              <div className="space-y-2">
                {attackableTargets.map(city => {
                  const isSelected = selectedTarget === city.id;
                  const factionName = getFactionName(city.faction);

                  return (
                    <button
                      key={city.id}
                      onClick={() => setSelectedTarget(city.id)}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        isSelected
                          ? 'bg-red-900/40 border-red-600/60'
                          : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20 hover:border-amber-700/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-amber-100">
                            {city.name}
                            <span className="ml-2 text-xs text-amber-200/60">
                              ({factionName})
                            </span>
                          </div>
                          <div className="text-xs text-amber-200/60 mt-1">
                            {getCityDefense(city)}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-red-400 text-sm">✓ 已选中</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          {selectedArmy && attackableTargets.length === 0 && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded p-3 text-center">
              <p className="text-amber-200/60 text-sm">
                该军队所在城市没有相邻的敌方城市可以攻击
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 p-4 border-t border-red-800/30">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-stone-700/60 hover:bg-stone-600/60 rounded text-sm font-medium transition-colors border border-stone-500/30"
          >
            取消
          </button>
          <button
            onClick={handleStartBattle}
            disabled={!selectedArmy || !selectedTarget}
            className="px-6 py-2 bg-red-700/60 hover:bg-red-600/60 rounded text-sm font-medium transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始战斗
          </button>
        </div>
      </div>
    </div>
  );
}
