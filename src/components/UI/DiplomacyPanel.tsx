/**
 * 外交面板
 * 显示势力外交关系和执行外交行动
 */

import { useState } from 'react';
import { useGameStore } from '@/store';
import { useDialogStore } from '@/store/dialogStore';
import { DiplomacySystem, DiplomacyStatus, DiplomacyAction } from '@/systems/diplomacy/DiplomacySystem';
import type { General } from '@/types';

interface DiplomacyPanelProps {
  onClose: () => void;
}

export function DiplomacyPanel({ onClose }: DiplomacyPanelProps) {
  const { factions, generals, currentPlayer, updateFaction, updateGeneral } = useGameStore();
  const { showAlert, showConfirm } = useDialogStore();

  const [selectedFaction, setSelectedFaction] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<DiplomacyAction | null>(null);
  const [selectedGeneral, setSelectedGeneral] = useState<string>('');
  const [bribeAmount, setBribeAmount] = useState<number>(1000);

  const playerFaction = factions[currentPlayer];
  const otherFactions = Object.values(factions).filter(f => f.id !== currentPlayer);

  const targetFaction = selectedFaction ? factions[selectedFaction] : null;
  const diplomacyStatus = targetFaction 
    ? DiplomacySystem.getDiplomacyStatus(playerFaction, targetFaction.id)
    : DiplomacyStatus.NEUTRAL;
  const relationValue = targetFaction
    ? DiplomacySystem.getRelationValue(playerFaction, targetFaction.id)
    : 0;

  // 执行外交行动
  const handleExecuteAction = async () => {
    if (!selectedFaction || !selectedAction) {
      showAlert('请选择目标势力和外交行动');
      return;
    }

    const target = factions[selectedFaction];
    let result;

    switch (selectedAction) {
      case DiplomacyAction.ALLIANCE:
        result = DiplomacySystem.proposeAlliance(playerFaction, target, generals);
        break;

      case DiplomacyAction.DECLARE_WAR:
        const confirmWar = await showConfirm(`确定要向 ${target.name} 宣战吗？`);
        if (!confirmWar) return;
        result = DiplomacySystem.declareWar(playerFaction, target);
        break;

      case DiplomacyAction.PEACE:
        result = DiplomacySystem.proposePeace(playerFaction, target, generals);
        break;

      case DiplomacyAction.SOW_DISCORD:
        if (!selectedGeneral) {
          showAlert('请选择要离间的武将');
          return;
        }
        const targetGeneral = generals[selectedGeneral];
        result = DiplomacySystem.sowDiscord(playerFaction, target, targetGeneral, generals);
        if (result.success && result.effects?.loyaltyChange) {
          updateGeneral(selectedGeneral, {
            loyalty: Math.max(0, targetGeneral.loyalty + result.effects.loyaltyChange)
          });
        }
        break;

      case DiplomacyAction.BRIBE:
        if (bribeAmount < 500) {
          showAlert('贿赂金额至少500');
          return;
        }
        result = DiplomacySystem.bribe(playerFaction, target, bribeAmount, generals);
        break;

      case DiplomacyAction.THREATEN:
        result = DiplomacySystem.threaten(playerFaction, target, generals);
        break;

      default:
        return;
    }

    // 显示结果
    await showAlert(result.message);

    // 应用效果
    if (result.success) {
      // 更新外交关系
      if (result.relationChange !== undefined || result.newStatus) {
        const diplomacy = { ...playerFaction.diplomacy };
        const current = diplomacy[selectedFaction] || { relation: 0, status: DiplomacyStatus.NEUTRAL };
        
        diplomacy[selectedFaction] = {
          relation: result.relationChange !== undefined 
            ? current.relation + result.relationChange 
            : current.relation,
          status: result.newStatus || current.status
        };

        updateFaction(currentPlayer, { diplomacy });
      }

      // 扣除金钱
      if (result.effects?.moneyCost) {
        // 从玩家资源中扣除（简化处理，从第一个城市扣除）
        const playerCities = playerFaction.cities;
        if (playerCities.length > 0) {
          const cityId = playerCities[0];
          const city = useGameStore.getState().cities[cityId];
          if (city) {
            useGameStore.getState().updateCity(cityId, {
              resources: {
                ...city.resources,
                money: Math.max(0, city.resources.money - result.effects.moneyCost)
              }
            });
          }
        }
      }
    }

    // 重置选择
    setSelectedAction(null);
    setSelectedGeneral('');
  };

  // 获取可离间的武将
  const getTargetGenerals = (): General[] => {
    if (!targetFaction) return [];
    return targetFaction.generals
      .map(id => generals[id])
      .filter(g => g && g.loyalty < 90);
  };

  // 获取状态颜色
  const getStatusColor = (status: DiplomacyStatus): string => {
    const colors: Record<DiplomacyStatus, string> = {
      [DiplomacyStatus.ALLY]: 'text-green-400',
      [DiplomacyStatus.NEUTRAL]: 'text-yellow-400',
      [DiplomacyStatus.ENEMY]: 'text-red-400',
      [DiplomacyStatus.TRUCE]: 'text-blue-400'
    };
    return colors[status];
  };

  // 获取关系颜色
  const getRelationColor = (value: number): string => {
    if (value >= 50) return 'text-green-400';
    if (value >= 0) return 'text-yellow-400';
    if (value >= -50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-green-800/50 shadow-2xl w-[800px] max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-green-800/30">
          <h2 className="text-xl font-bold text-green-400" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
            🤝 外交
          </h2>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-green-900/30 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：势力列表 */}
          <div className="w-1/3 border-r border-green-800/30 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-amber-200 mb-2">势力列表</h3>
              <div className="space-y-2">
                {otherFactions.map(faction => {
                  const isSelected = selectedFaction === faction.id;
                  const status = DiplomacySystem.getDiplomacyStatus(playerFaction, faction.id);
                  const relation = DiplomacySystem.getRelationValue(playerFaction, faction.id);

                  return (
                    <button
                      key={faction.id}
                      onClick={() => {
                        setSelectedFaction(faction.id);
                        setSelectedAction(null);
                        setSelectedGeneral('');
                      }}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        isSelected
                          ? 'bg-green-900/40 border-green-600/60'
                          : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20 hover:border-amber-700/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-amber-100">{faction.name}</div>
                          <div className="text-xs text-amber-200/60 mt-1">
                            城市: {faction.cities.length} | 武将: {faction.generals.length}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs ${getStatusColor(status)}`}>
                            {DiplomacySystem.getStatusDescription(status)}
                          </div>
                          <div className={`text-xs ${getRelationColor(relation)}`}>
                            {relation}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧：外交详情 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {targetFaction ? (
              <>
                {/* 势力信息 */}
                <div className="p-4 border-b border-green-800/30">
                  <h3 className="text-lg font-semibold text-amber-100 mb-2">{targetFaction.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-amber-200/60">外交状态：</span>
                      <span className={getStatusColor(diplomacyStatus)}>
                        {DiplomacySystem.getStatusDescription(diplomacyStatus)}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-200/60">关系值：</span>
                      <span className={getRelationColor(relationValue)}>
                        {relationValue} ({DiplomacySystem.getRelationDescription(relationValue)})
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-200/60">城市：</span>
                      <span className="text-amber-100">{targetFaction.cities.length}</span>
                    </div>
                    <div>
                      <span className="text-amber-200/60">武将：</span>
                      <span className="text-amber-100">{targetFaction.generals.length}</span>
                    </div>
                  </div>
                </div>

                {/* 外交行动 */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-sm font-semibold text-amber-200 mb-3">外交行动</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {diplomacyStatus === DiplomacyStatus.NEUTRAL && (
                      <button
                        onClick={() => setSelectedAction(DiplomacyAction.ALLIANCE)}
                        className={`p-3 rounded border transition-all ${
                          selectedAction === DiplomacyAction.ALLIANCE
                            ? 'bg-green-900/40 border-green-600/60'
                            : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                        }`}
                      >
                        <div className="font-medium text-amber-100">🤝 结盟</div>
                        <div className="text-xs text-amber-200/60 mt-1">提议结成同盟</div>
                      </button>
                    )}

                    {diplomacyStatus !== DiplomacyStatus.ENEMY && (
                      <button
                        onClick={() => setSelectedAction(DiplomacyAction.DECLARE_WAR)}
                        className={`p-3 rounded border transition-all ${
                          selectedAction === DiplomacyAction.DECLARE_WAR
                            ? 'bg-red-900/40 border-red-600/60'
                            : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                        }`}
                      >
                        <div className="font-medium text-amber-100">⚔️ 宣战</div>
                        <div className="text-xs text-amber-200/60 mt-1">向对方宣战</div>
                      </button>
                    )}

                    {diplomacyStatus === DiplomacyStatus.ENEMY && (
                      <button
                        onClick={() => setSelectedAction(DiplomacyAction.PEACE)}
                        className={`p-3 rounded border transition-all ${
                          selectedAction === DiplomacyAction.PEACE
                            ? 'bg-blue-900/40 border-blue-600/60'
                            : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                        }`}
                      >
                        <div className="font-medium text-amber-100">🕊️ 求和</div>
                        <div className="text-xs text-amber-200/60 mt-1">请求停战</div>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedAction(DiplomacyAction.SOW_DISCORD)}
                      className={`p-3 rounded border transition-all ${
                        selectedAction === DiplomacyAction.SOW_DISCORD
                          ? 'bg-purple-900/40 border-purple-600/60'
                          : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                      }`}
                    >
                      <div className="font-medium text-amber-100">🎭 离间</div>
                      <div className="text-xs text-amber-200/60 mt-1">降低敌方武将忠诚</div>
                    </button>

                    <button
                      onClick={() => setSelectedAction(DiplomacyAction.BRIBE)}
                      className={`p-3 rounded border transition-all ${
                        selectedAction === DiplomacyAction.BRIBE
                          ? 'bg-yellow-900/40 border-yellow-600/60'
                          : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                      }`}
                    >
                      <div className="font-medium text-amber-100">💰 贿赂</div>
                      <div className="text-xs text-amber-200/60 mt-1">用金钱改善关系</div>
                    </button>

                    <button
                      onClick={() => setSelectedAction(DiplomacyAction.THREATEN)}
                      className={`p-3 rounded border transition-all ${
                        selectedAction === DiplomacyAction.THREATEN
                          ? 'bg-orange-900/40 border-orange-600/60'
                          : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                      }`}
                    >
                      <div className="font-medium text-amber-100">😤 威胁</div>
                      <div className="text-xs text-amber-200/60 mt-1">以武力威胁对方</div>
                    </button>
                  </div>

                  {/* 离间计选择武将 */}
                  {selectedAction === DiplomacyAction.SOW_DISCORD && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-amber-200 mb-2">选择目标武将</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getTargetGenerals().map(general => (
                          <button
                            key={general.id}
                            onClick={() => setSelectedGeneral(general.id)}
                            className={`w-full text-left p-2 rounded border transition-all ${
                              selectedGeneral === general.id
                                ? 'bg-purple-900/40 border-purple-600/60'
                                : 'bg-stone-800/40 hover:bg-stone-700/40 border-amber-900/20'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-amber-100">{general.name}</span>
                              <span className="text-xs text-amber-200/60">忠诚: {general.loyalty}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 贿赂金额输入 */}
                  {selectedAction === DiplomacyAction.BRIBE && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-amber-200 mb-2">贿赂金额</h4>
                      <input
                        type="number"
                        value={bribeAmount}
                        onChange={(e) => setBribeAmount(parseInt(e.target.value) || 0)}
                        min={500}
                        step={100}
                        className="w-full px-3 py-2 bg-stone-800/60 border border-amber-900/30 rounded text-amber-100 focus:outline-none focus:border-amber-600/50"
                      />
                      <div className="text-xs text-amber-200/60 mt-1">
                        最少500，每100金钱提升1点关系
                      </div>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-3 p-4 border-t border-green-800/30">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-stone-700/60 hover:bg-stone-600/60 rounded text-sm font-medium transition-colors border border-stone-500/30"
                  >
                    关闭
                  </button>
                  <button
                    onClick={handleExecuteAction}
                    disabled={!selectedAction}
                    className="px-6 py-2 bg-green-700/60 hover:bg-green-600/60 rounded text-sm font-medium transition-colors border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    执行
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-amber-200/60">
                请选择一个势力
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
