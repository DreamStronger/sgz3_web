import { useState, useEffect } from 'react';
import { useBattleStore, useGameStore } from '@/store';

interface BattleFieldProps {
  onClose?: () => void;
}

export function BattleField({ onClose }: BattleFieldProps) {
  const {
    currentBattle,
    battleSystem,
    isBattleActive,
    battleTurn,
    battleLog,
    battleResult,
    executeTurn,
    executeTactics,
    executeStratagem,
    endBattle,
    clearBattle
  } = useBattleStore();
  
  const { formations, tactics, stratagems, cities } = useGameStore();
  
  const [selectedTactics, setSelectedTactics] = useState<string>('');
  const [selectedStratagem, setSelectedStratagem] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [autoPlay, setAutoPlay] = useState(false);
  
  // 自动战斗
  useEffect(() => {
    if (autoPlay && isBattleActive) {
      const timer = setTimeout(() => {
        executeTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, isBattleActive, battleTurn, executeTurn]);
  
  // 如果没有战斗，显示提示
  if (!currentBattle || !battleSystem) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl p-8">
          <p className="text-amber-200 text-lg">没有进行中的战斗</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    );
  }
  
  const battleState = battleSystem.getBattleState();
  const city = currentBattle.location ? cities[currentBattle.location] : null;
  
  // 处理战术
  const handleTactics = () => {
    if (!selectedTactics) return;
    const result = executeTactics(selectedTactics);
    if (result.success) {
      setSelectedTactics('');
    }
  };
  
  // 处理计谋
  const handleStratagem = () => {
    if (!selectedStratagem || !selectedTarget) return;
    const result = executeStratagem(selectedStratagem, selectedTarget);
    if (result.success) {
      setSelectedStratagem('');
      setSelectedTarget('');
    }
  };
  
  // 渲染单位卡片
  const renderUnitCard = (unit: any, isAttacker: boolean) => {
    const general = unit.general;
    const healthPercent = (unit.unit.count / 10000) * 100; // 假设最大10000
    
    return (
      <div
        key={`${unit.unit.type}-${unit.general?.id || 'no-general'}`}
        className={`bg-stone-800/60 rounded p-3 border ${
          isAttacker ? 'border-red-900/40' : 'border-blue-900/40'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium text-amber-100">
              {general?.name || unit.unit.type}
            </div>
            <div className="text-xs text-amber-200/50">
              {unit.unit.type === 'infantry' ? '步兵' :
               unit.unit.type === 'cavalry' ? '骑兵' :
               unit.unit.type === 'archer' ? '弓兵' : '水军'}
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-amber-200/60">兵力: {Math.floor(unit.unit.count)}</div>
            <div className="text-amber-200/60">士气: {Math.floor(unit.morale)}</div>
          </div>
        </div>
        
        {/* 血条 */}
        <div className="w-full bg-stone-900 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              healthPercent > 50 ? 'bg-green-500' :
              healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, healthPercent))}%` }}
          />
        </div>
        
        {/* 属性 */}
        <div className="grid grid-cols-2 gap-1 text-xs text-amber-200/60">
          <div>攻击: {Math.floor(unit.effectiveAttack)}</div>
          <div>防御: {Math.floor(unit.effectiveDefense)}</div>
          <div>疲劳: {Math.floor(unit.fatigue)}%</div>
          {general && (
            <>
              <div>武力: {general.attributes.force}</div>
              <div>统率: {general.attributes.command}</div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90">
      <div className="w-[95vw] h-[90vh] bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
              {currentBattle.type === 'field' ? '野战' :
               currentBattle.type === 'siege' ? '攻城战' : '水战'}
            </h2>
            <span className="text-amber-200/60">
              {city?.name || '未知地点'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-amber-200/80">回合: {battleTurn}</span>
            {isBattleActive ? (
              <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-sm">
                战斗中
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-sm">
                已结束
              </span>
            )}
            {onClose && (
              <button
                onClick={() => {
                  clearBattle();
                  onClose();
                }}
                className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {/* 主战场区域 */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* 攻击方 */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-400" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                攻击方
              </h3>
              <div className="text-sm text-amber-200/60">
                阵型: {formations[currentBattle.attacker.formation]?.name || '未知'}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {battleState.attackerUnits.map((unit) => renderUnitCard(unit, true))}
            </div>
          </div>
          
          {/* 中间战斗日志 */}
          <div className="w-80 flex flex-col">
            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
              战斗日志
            </h3>
            <div className="flex-1 bg-stone-950/50 rounded border border-amber-900/20 p-3 overflow-y-auto">
              {battleLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-sm mb-1 ${
                    log.includes('回合') ? 'text-amber-400 font-semibold' :
                    log.includes('伤害') ? 'text-red-400' :
                    log.includes('结束') ? 'text-green-400' :
                    'text-amber-200/70'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
          
          {/* 防守方 */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-400" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                防守方
              </h3>
              <div className="text-sm text-amber-200/60">
                阵型: {formations[currentBattle.defender.formation]?.name || '未知'}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {battleState.defenderUnits.map((unit) => renderUnitCard(unit, false))}
            </div>
          </div>
        </div>
        
        {/* 底部控制面板 */}
        <div className="border-t border-amber-800/30 p-4">
          {isBattleActive ? (
            <div className="flex gap-4">
              {/* 战术 */}
              <div className="flex-1">
                <label className="block text-sm text-amber-200/60 mb-1">战术</label>
                <div className="flex gap-2">
                  <select
                    value={selectedTactics}
                    onChange={(e) => setSelectedTactics(e.target.value)}
                    className="flex-1 bg-stone-800 border border-amber-900/30 rounded px-3 py-2 text-amber-100"
                  >
                    <option value="">选择战术</option>
                    {Object.values(tactics).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleTactics}
                    disabled={!selectedTactics}
                    className="px-4 py-2 bg-gradient-to-r from-orange-900 to-orange-800 hover:from-orange-800 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    使用
                  </button>
                </div>
              </div>
              
              {/* 计谋 */}
              <div className="flex-1">
                <label className="block text-sm text-amber-200/60 mb-1">计谋</label>
                <div className="flex gap-2">
                  <select
                    value={selectedStratagem}
                    onChange={(e) => setSelectedStratagem(e.target.value)}
                    className="flex-1 bg-stone-800 border border-amber-900/30 rounded px-3 py-2 text-amber-100"
                  >
                    <option value="">选择计谋</option>
                    {Object.values(stratagems).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="flex-1 bg-stone-800 border border-amber-900/30 rounded px-3 py-2 text-amber-100"
                  >
                    <option value="">选择目标</option>
                    {battleState.defenderUnits
                      .filter(u => u.general && u.unit.count > 0)
                      .map(u => (
                        <option key={u.general!.id} value={u.general!.id}>
                          {u.general!.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleStratagem}
                    disabled={!selectedStratagem || !selectedTarget}
                    className="px-4 py-2 bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    使用
                  </button>
                </div>
              </div>
              
              {/* 战斗控制 */}
              <div className="flex gap-2 items-end">
                <button
                  onClick={executeTurn}
                  className="px-6 py-2 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 rounded transition-colors font-semibold"
                >
                  执行回合
                </button>
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`px-4 py-2 rounded transition-colors ${
                    autoPlay ? 'bg-green-900 hover:bg-green-800' : 'bg-stone-800 hover:bg-stone-700'
                  }`}
                >
                  {autoPlay ? '停止自动' : '自动战斗'}
                </button>
                <button
                  onClick={endBattle}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded transition-colors"
                >
                  结束战斗
                </button>
              </div>
            </div>
          ) : (
            /* 战斗结果 */
            battleResult && (
              <div className="bg-gradient-to-r from-amber-950/50 to-stone-900/50 rounded p-4 border border-amber-800/30">
                <h3 className="text-lg font-semibold mb-3 text-center" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                  战斗结果
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-amber-400">
                      {battleResult.winner === 'attacker' ? '攻击方' :
                       battleResult.winner === 'defender' ? '防守方' : '平局'}
                    </div>
                    <div className="text-sm text-amber-200/60">获胜方</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-400">{battleResult.attackerLosses}</div>
                    <div className="text-sm text-amber-200/60">攻击方损失</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-400">{battleResult.defenderLosses}</div>
                    <div className="text-sm text-amber-200/60">防守方损失</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-400">{battleResult.captives.length}</div>
                    <div className="text-sm text-amber-200/60">俘虏人数</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
