import { useState, useMemo } from 'react';
import { useGameStore } from '@/store';
import type { Army, City } from '@/types';

interface ArmyMovementPanelProps {
  army: Army;
  onClose: () => void;
}

export function ArmyMovementPanel({ army, onClose }: ArmyMovementPanelProps) {
  const { cities, moveArmy, cancelArmyMovement } = useGameStore();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  const currentCity = cities[army.location];
  
  // 获取可移动的相邻城市
  const movableCities = useMemo(() => {
    if (!currentCity) return [];
    
    return currentCity.neighbors
      .map(cityId => cities[cityId])
      .filter((city): city is City => city !== undefined);
  }, [currentCity, cities]);
  
  // 计算移动信息
  const getMovementInfo = (targetCity: City) => {
    const terrainMoveCost: Record<string, number> = {
      plain: 1,
      mountain: 2,
      water: 1.5,
      pass: 2,
    };
    
    const baseTurns = terrainMoveCost[targetCity.terrain] || 1;
    const turns = Math.ceil(baseTurns);
    
    const totalSoldiers = army.units.reduce((sum, u) => sum + u.count, 0);
    const foodCost = Math.ceil(totalSoldiers * 0.1 * turns);
    
    return { turns, foodCost };
  };
  
  const handleMove = () => {
    if (!selectedCity) return;
    
    const success = moveArmy(army.id, selectedCity);
    if (success) {
      onClose();
    }
  };
  
  const handleCancelMovement = () => {
    cancelArmyMovement(army.id);
    onClose();
  };
  
  // 如果军队正在移动，显示移动状态
  if (army.status === 'moving' && army.movement) {
    const targetCity = cities[army.movement.targetCity];
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#1a2332] to-[#0d1620] border border-[#a09070]/40 rounded-xl p-6 w-[500px] shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#f0e6d2]" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
              军队移动中
            </h2>
            <button onClick={onClose} className="text-[#a09070] hover:text-[#f0e6d2] transition-colors text-2xl">
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[#0d1620]/50 rounded-lg p-4 border border-[#a09070]/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#a09070]">当前位置</span>
                <span className="text-[#f0e6d2] font-medium">{currentCity?.name}</span>
              </div>
              
              <div className="flex items-center justify-center my-4">
                <div className="text-[#a09070]">→</div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[#a09070]">目标城市</span>
                <span className="text-[#f0e6d2] font-medium">{targetCity?.name}</span>
              </div>
            </div>
            
            <div className="bg-[#0d1620]/50 rounded-lg p-4 border border-[#a09070]/20">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#a09070]">移动进度</span>
                  <span className="text-[#f0e6d2]">{Math.round(army.movement.progress)}%</span>
                </div>
                <div className="h-2 bg-[#0d1620] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ffd700] to-[#ff8c00] transition-all duration-300"
                    style={{ width: `${army.movement.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#a09070]">剩余回合</span>
                <span className="text-[#ffd700]">{army.movement.turnsRemaining} 回合</span>
              </div>
            </div>
            
            <button
              onClick={handleCancelMovement}
              className="w-full py-3 bg-gradient-to-br from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 text-[#f0e6d2] rounded-lg transition-all border border-red-600/40"
              style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
            >
              取消移动
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // 军队空闲，显示移动选择界面
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1a2332] to-[#0d1620] border border-[#a09070]/40 rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#f0e6d2]" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
            军队移动
          </h2>
          <button onClick={onClose} className="text-[#a09070] hover:text-[#f0e6d2] transition-colors text-2xl">
            ×
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-[#0d1620]/50 rounded-lg border border-[#a09070]/20">
          <div className="flex justify-between items-center">
            <span className="text-[#a09070]">当前位置</span>
            <span className="text-[#f0e6d2] font-medium">{currentCity?.name}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[#a09070]">携带粮草</span>
            <span className="text-[#ffd700]">{army.supplies.food}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-[#f0e6d2] mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
            选择目标城市
          </h3>
          
          {movableCities.length === 0 ? (
            <div className="text-center py-8 text-[#a09070]">
              没有可移动的相邻城市
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {movableCities.map(city => {
                const info = getMovementInfo(city);
                const isSelected = selectedCity === city.id;
                const canAfford = army.supplies.food >= info.foodCost;
                
                return (
                  <button
                    key={city.id}
                    onClick={() => canAfford && setSelectedCity(city.id)}
                    disabled={!canAfford}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      isSelected 
                        ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#f0e6d2]' 
                        : canAfford
                          ? 'bg-[#0d1620]/50 border-[#a09070]/30 hover:border-[#a09070] text-[#f0e6d2]'
                          : 'bg-[#0d1620]/30 border-[#a09070]/20 text-[#a09070]/50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                        {city.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        city.terrain === 'plain' ? 'bg-green-900/50 text-green-300' :
                        city.terrain === 'mountain' ? 'bg-gray-700/50 text-gray-300' :
                        city.terrain === 'water' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {city.terrain === 'plain' ? '平原' :
                         city.terrain === 'mountain' ? '山地' :
                         city.terrain === 'water' ? '水域' : '关隘'}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#a09070]">移动时间</span>
                        <span className={canAfford ? 'text-[#f0e6d2]' : 'text-red-400'}>
                          {info.turns} 回合
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a09070]">粮草消耗</span>
                        <span className={canAfford ? 'text-[#ffd700]' : 'text-red-400'}>
                          {info.foodCost}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {selectedCity && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#0d1620] hover:bg-[#1a2332] text-[#a09070] rounded-lg transition-all border border-[#a09070]/30"
              style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
            >
              取消
            </button>
            <button
              onClick={handleMove}
              className="flex-1 py-3 bg-gradient-to-br from-[#ffd700]/80 to-[#ff8c00]/80 hover:from-[#ffd700] hover:to-[#ff8c00] text-[#1a2332] font-bold rounded-lg transition-all"
              style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
            >
              开始移动
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
