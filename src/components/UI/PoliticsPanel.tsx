import { useState } from 'react';
import { useGameStore, useMapStore } from '@/store';
import type { City } from '@/types';

interface PoliticsPanelProps {
  onClose: () => void;
}

type ActionType = 'develop' | 'commerce' | 'defense';
type FacilityType = 'market' | 'farm' | 'barracks' | 'wall';

export function PoliticsPanel({ onClose }: PoliticsPanelProps) {
  const { cities, generals, currentPlayer, factions, updateCity, updateFaction } = useGameStore();
  const { selectedCity, setSelectedCity } = useMapStore();
  
  const [actionType, setActionType] = useState<ActionType>('develop');
  const [facilityType, setFacilityType] = useState<FacilityType>('market');
  
  // 获取玩家城市
  const playerFaction = factions[currentPlayer];
  const playerCities = playerFaction?.cities.map(id => cities[id]).filter(Boolean) || [];
  
  // 当前选中的城市
  const currentCity = selectedCity ? cities[selectedCity] : playerCities[0];
  
  // 获取城市可用武将
  const cityGenerals = currentCity?.generals?.map(id => generals[id]).filter(Boolean) || [];
  
  // 内政操作消耗
  const actionCosts: Record<ActionType, number> = {
    develop: 100,
    commerce: 100,
    defense: 150
  };
  
  // 设施建设消耗
  const facilityCosts: Record<FacilityType, number> = {
    market: 200,
    farm: 200,
    barracks: 300,
    wall: 400
  };
  
  // 执行内政操作
  const handleAction = () => {
    if (!currentCity) return;
    
    const cost = actionCosts[actionType];
    if (currentCity.resources.money < cost) {
      alert('金钱不足！');
      return;
    }
    
    let updates: Partial<City> = {
      resources: {
        ...currentCity.resources,
        money: currentCity.resources.money - cost
      }
    };
    
    switch (actionType) {
      case 'develop':
        updates.stats = {
          ...currentCity.stats,
          development: Math.min(100, currentCity.stats.development + 5)
        };
        break;
      case 'commerce':
        updates.stats = {
          ...currentCity.stats,
          commerce: Math.min(100, currentCity.stats.commerce + 5)
        };
        break;
      case 'defense':
        updates.stats = {
          ...currentCity.stats,
          defense: Math.min(100, currentCity.stats.defense + 5)
        };
        break;
    }
    
    updateCity(currentCity.id, updates);
    
    // 更新势力资源
    const newTotalMoney = playerCities.reduce((sum, c) => 
      c.id === currentCity.id ? sum + (updates.resources?.money || c.resources.money) : sum + c.resources.money, 0
    );
    updateFaction(currentPlayer, {
      resources: {
        ...playerFaction?.resources!,
        money: newTotalMoney
      }
    });
  };
  
  // 执行设施建设
  const handleBuildFacility = () => {
    if (!currentCity) return;
    
    const cost = facilityCosts[facilityType];
    if (currentCity.resources.money < cost) {
      alert('金钱不足！');
      return;
    }
    
    const currentLevel = currentCity.facilities[facilityType];
    if (currentLevel >= 5) {
      alert('设施已达最高等级！');
      return;
    }
    
    const updates: Partial<City> = {
      resources: {
        ...currentCity.resources,
        money: currentCity.resources.money - cost
      },
      facilities: {
        ...currentCity.facilities,
        [facilityType]: currentLevel + 1
      }
    };
    
    updateCity(currentCity.id, updates);
  };
  
  // 计算产出预览
  const calculateIncome = () => {
    if (!currentCity) return { money: 0, food: 0, soldiers: 0 };
    
    const seasonMultiplier = 1.0; // 简化计算
    
    const moneyIncome = Math.floor(
      currentCity.stats.population * 0.001 * 
      (currentCity.stats.commerce / 100) * 
      (1 + currentCity.facilities.market * 0.1) * 
      seasonMultiplier
    );
    
    const foodIncome = Math.floor(
      currentCity.stats.population * 0.002 * 
      (currentCity.stats.development / 100) * 
      (1 + currentCity.facilities.farm * 0.1) * 
      seasonMultiplier
    );
    
    const soldierIncome = Math.floor(
      currentCity.stats.population * 0.0001 * 
      (1 + currentCity.facilities.barracks * 0.1)
    );
    
    return { money: moneyIncome, food: foodIncome, soldiers: soldierIncome };
  };
  
  const income = calculateIncome();
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[800px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>🏛️ 内政管理</h2>
          <button 
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧城市列表 */}
          <div className="w-1/3 border-r border-amber-800/30 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-amber-200/80 mb-2">选择城市</h3>
            <div className="space-y-2">
              {playerCities.map(city => (
                <div
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={`p-3 rounded cursor-pointer transition-colors border ${
                    currentCity?.id === city.id 
                      ? 'bg-amber-900/40 border-amber-600/50' 
                      : 'bg-stone-800/40 border-amber-900/20 hover:bg-stone-700/40'
                  }`}
                >
                  <div className="font-medium text-amber-100">{city.name}</div>
                  <div className="text-xs text-amber-200/50 mt-1">
                    开发{city.stats.development} 商业{city.stats.commerce} 防御{city.stats.defense}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 右侧操作面板 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {currentCity ? (
              <div className="space-y-4">
                {/* 城市信息 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-lg font-semibold text-amber-100 mb-3">{currentCity.name}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-amber-200/60">人口</div>
                      <div className="text-amber-100 font-medium">{currentCity.stats.population.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-amber-200/60">金钱</div>
                      <div className="text-yellow-400 font-medium">{currentCity.resources.money}</div>
                    </div>
                    <div>
                      <div className="text-amber-200/60">粮草</div>
                      <div className="text-green-400 font-medium">{currentCity.resources.food}</div>
                    </div>
                  </div>
                  
                  {/* 产出预览 */}
                  <div className="mt-3 pt-3 border-t border-amber-900/20">
                    <div className="text-xs text-amber-200/60 mb-2">每回合产出</div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-yellow-400">+{income.money} 金</span>
                      <span className="text-green-400">+{income.food} 粮</span>
                      <span className="text-red-400">+{income.soldiers} 兵</span>
                    </div>
                  </div>
                </div>
                
                {/* 内政操作 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-base font-semibold text-amber-100 mb-3">内政操作</h3>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {(['develop', 'commerce', 'defense'] as ActionType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setActionType(type)}
                        className={`px-3 py-2 rounded text-sm transition-colors ${
                          actionType === type 
                            ? 'bg-blue-700/60 border-blue-500/50' 
                            : 'bg-stone-700/40 border-stone-600/30 hover:bg-stone-600/40'
                        } border`}
                      >
                        {type === 'develop' ? '开发' : type === 'commerce' ? '商业' : '防御'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-amber-200/60">
                      消耗: <span className="text-yellow-400">{actionCosts[actionType]} 金</span>
                    </div>
                    <button
                      onClick={handleAction}
                      disabled={currentCity.resources.money < actionCosts[actionType]}
                      className="px-4 py-2 bg-blue-700/60 hover:bg-blue-600/60 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
                    >
                      执行
                    </button>
                  </div>
                </div>
                
                {/* 设施建设 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-base font-semibold text-amber-100 mb-3">设施建设</h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(['market', 'farm', 'barracks', 'wall'] as FacilityType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setFacilityType(type)}
                        className={`px-3 py-2 rounded text-sm transition-colors ${
                          facilityType === type 
                            ? 'bg-green-700/60 border-green-500/50' 
                            : 'bg-stone-700/40 border-stone-600/30 hover:bg-stone-600/40'
                        } border`}
                      >
                        {type === 'market' ? `市场 Lv.${currentCity.facilities.market}` :
                         type === 'farm' ? `农场 Lv.${currentCity.facilities.farm}` :
                         type === 'barracks' ? `兵营 Lv.${currentCity.facilities.barracks}` :
                         `城墙 Lv.${currentCity.facilities.wall}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-amber-200/60">
                      消耗: <span className="text-yellow-400">{facilityCosts[facilityType]} 金</span>
                    </div>
                    <button
                      onClick={handleBuildFacility}
                      disabled={currentCity.resources.money < facilityCosts[facilityType] || currentCity.facilities[facilityType] >= 5}
                      className="px-4 py-2 bg-green-700/60 hover:bg-green-600/60 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/30"
                    >
                      建设
                    </button>
                  </div>
                </div>
                
                {/* 城市武将 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-base font-semibold text-amber-100 mb-3">驻守武将</h3>
                  {cityGenerals.length > 0 ? (
                    <div className="space-y-2">
                      {cityGenerals.map(general => (
                        <div key={general.id} className="flex justify-between items-center bg-stone-700/40 p-2 rounded">
                          <span className="text-amber-100">{general.name}</span>
                          <span className="text-xs text-amber-200/60">
                            统{general.attributes.command} 武{general.attributes.force} 智{general.attributes.intelligence}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-amber-200/40">暂无武将驻守</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-amber-200/40">
                请选择一个城市
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
