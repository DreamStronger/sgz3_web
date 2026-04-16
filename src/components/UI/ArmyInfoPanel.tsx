import { useState, useEffect } from 'react';
import { useGameStore } from '@/store';
import type { Army, General, Faction, City } from '@/types';

interface ArmyInfoPanelProps {
  army: Army;
  onClose: () => void;
}

export function ArmyInfoPanel({ army, onClose }: ArmyInfoPanelProps) {
  const { factions, generals, cities } = useGameStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const faction = factions[army.faction] as Faction | undefined;
  const location = cities[army.location] as City | undefined;
  const armyGenerals = army.generals.map(id => generals[id]).filter(Boolean) as General[];

  // 计算总兵力
  const totalSoldiers = army.units.reduce((sum, u) => sum + u.count, 0);
  
  // 计算战斗力
  const calculateCombatPower = () => {
    let basePower = 0;
    army.units.forEach(unit => {
      const typeMultiplier = {
        infantry: 1.0,
        cavalry: 1.2,
        archer: 0.9,
        navy: 0.8
      };
      const type = unit.type as keyof typeof typeMultiplier;
      basePower += unit.count * (typeMultiplier[type] || 1.0) * (1 + unit.experience / 100);
    });
    
    // 将领加成
    const generalBonus = armyGenerals.reduce((sum, g) => sum + g.attributes.command * 0.5, 0);
    
    // 士气加成
    const moraleBonus = army.morale / 100;
    
    return Math.floor((basePower + generalBonus) * moraleBonus);
  };

  // 兵种名称映射
  const unitTypeNames: Record<string, string> = {
    infantry: '步兵',
    cavalry: '骑兵',
    archer: '弓兵',
    navy: '水军'
  };

  // 状态名称映射
  const statusNames: Record<string, { text: string; color: string }> = {
    idle: { text: '待命', color: 'text-green-300' },
    moving: { text: '移动中', color: 'text-blue-300' },
    fighting: { text: '战斗中', color: 'text-red-300' },
    resting: { text: '休整', color: 'text-yellow-300' }
  };

  const status = statusNames[army.status] || { text: '未知', color: 'text-gray-300' };

  // 固定显示在地图容器右上角
  const panelWidth = 340;
  
  const calculatePosition = () => {
    // 获取地图容器（第二层div）的位置
    const mapContainers = document.querySelectorAll('[class*="flex-1"][class*="flex-col"][class*="min-h-0"]');
    let mapContainer: Element | null = null;
    
    // 找到包含地图的容器
    mapContainers.forEach(container => {
      if (container.querySelector('canvas')) {
        mapContainer = container;
      }
    });
    
    if (mapContainer) {
      const rect = (mapContainer as Element).getBoundingClientRect();
      // 显示在容器右上角（右上顶点对齐）
      console.log(rect.right)
      return {
        right: 5,
        top: 5
      };
    }
    
    // 降级方案：获取canvas的父容器
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const parent = canvas.parentElement?.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        return {
          left: rect.right - panelWidth - 10,
          top: rect.top + 10
        };
      }
    }
    
    // 最终降级：显示在屏幕右上角
    return {
      left: window.innerWidth - panelWidth - 20,
      top: 80
    };
  };
  
  const panelStyle = calculatePosition();

  return (
    <div 
      className={`fixed z-[200] transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={panelStyle}
    >
      <div 
        className="bg-gradient-to-br from-stone-900/95 to-stone-950/95 rounded-lg border-2 shadow-2xl overflow-hidden flex flex-col"
        style={{ 
          width: panelWidth,
          maxHeight: 'calc(100vh - 100px)',
          borderColor: faction?.color || '#ffd700',
          fontFamily: '"STKaiti", "KaiTi", serif'
        }}
      >
        {/* 标题栏 */}
        <div 
          className="px-4 py-3 border-b flex justify-between items-center flex-shrink-0"
          style={{ 
            background: `linear-gradient(to right, ${faction?.color || '#ffd700'}30, transparent)`,
            borderColor: faction?.color || '#ffd700'
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚔️</span>
            <span className="font-bold text-lg text-amber-100">
              {faction?.name || '未知势力'} 军团
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30"
          >
            ✕
          </button>
        </div>

        {/* 基本信息 - 可滚动 */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          {/* 状态和位置 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-amber-200/80">状态:</span>
              <span className={`font-semibold ${status.color}`}>{status.text}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-amber-200/80">位置:</span>
              <span className="text-amber-100">{location?.name || '未知'}</span>
            </div>
          </div>

          {/* 总兵力和战斗力 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-stone-800/50 rounded p-2.5 border border-amber-700/30">
              <div className="text-xs text-amber-200/60 mb-1">总兵力</div>
              <div className="text-lg font-bold text-amber-100">{totalSoldiers.toLocaleString()}</div>
            </div>
            <div className="bg-stone-800/50 rounded p-2.5 border border-amber-700/30">
              <div className="text-xs text-amber-200/60 mb-1">战斗力</div>
              <div className="text-lg font-bold text-red-300">{calculateCombatPower().toLocaleString()}</div>
            </div>
          </div>

          {/* 士气和疲劳 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-200/80">士气</span>
              <span className="text-amber-100 font-semibold">{army.morale}</span>
            </div>
            <div className="w-full bg-stone-800/50 rounded-full h-1.5 border border-amber-700/30">
              <div 
                className="h-1.5 rounded-full transition-all"
                style={{ 
                  width: `${army.morale}%`,
                  background: `linear-gradient(to right, ${army.morale < 30 ? '#ef4444' : army.morale < 70 ? '#f59e0b' : '#10b981'}, ${army.morale < 30 ? '#dc2626' : army.morale < 70 ? '#d97706' : '#059669'})`
                }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-200/80">疲劳度</span>
              <span className="text-amber-100 font-semibold">{army.fatigue}</span>
            </div>
            <div className="w-full bg-stone-800/50 rounded-full h-1.5 border border-amber-700/30">
              <div 
                className="h-1.5 rounded-full transition-all"
                style={{ 
                  width: `${army.fatigue}%`,
                  background: `linear-gradient(to right, ${army.fatigue > 70 ? '#ef4444' : army.fatigue > 30 ? '#f59e0b' : '#10b981'}, ${army.fatigue > 70 ? '#dc2626' : army.fatigue > 30 ? '#d97706' : '#059669'})`
                }}
              />
            </div>
          </div>

          {/* 兵种构成 */}
          <div>
            <div className="text-amber-200/80 mb-1.5 text-sm font-semibold">兵种构成</div>
            <div className="space-y-1">
              {army.units.map((unit, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">
                      {unit.type === 'infantry' ? '🚶' : unit.type === 'cavalry' ? '🐎' : unit.type === 'archer' ? '🏹' : '⛵'}
                    </span>
                    <span className="text-amber-100">{unitTypeNames[unit.type] || unit.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-300/70 text-xs">经验:{unit.experience}</span>
                    <span className="text-amber-100 font-semibold">{unit.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 将领 */}
          {armyGenerals.length > 0 && (
            <div>
              <div className="text-amber-200/80 mb-1.5 text-sm font-semibold">将领</div>
              <div className="space-y-1">
                {armyGenerals.map((general, index) => (
                  <div key={general.id} className="flex items-center justify-between text-xs bg-stone-800/30 rounded p-1.5 border border-amber-700/20">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">
                        {index === 0 ? '👑' : '⚔️'}
                      </span>
                      <span className="text-amber-100">{general.name}</span>
                    </div>
                    <div className="text-xs text-amber-300/70">
                      统{general.attributes.command} 武{general.attributes.force}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 粮草 */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-700/20">
            <span className="text-amber-200/80">粮草储备</span>
            <span className="text-amber-100 font-semibold">
              {army.supplies.food.toLocaleString()} / {army.supplies.maxFood.toLocaleString()}
            </span>
          </div>

          {/* 移动信息 */}
          {army.status === 'moving' && army.movement && (
            <div className="bg-blue-900/20 rounded p-2 border border-blue-600/30">
              <div className="text-blue-200/80 text-sm mb-1">移动中</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200/60">目标: {cities[army.movement.targetCity]?.name || '未知'}</span>
                <span className="text-blue-300">剩余 {army.movement.turnsRemaining} 回合</span>
              </div>
              <div className="w-full bg-stone-800/50 rounded-full h-1.5 mt-2">
                <div 
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${army.movement.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
