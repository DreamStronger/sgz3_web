import { useGameStore } from '@/store';
import { SupplySystem, FoodShortageLevel } from '@/systems/supply/SupplySystem';

interface SupplyStatusPanelProps {
  onClose: () => void;
}

export function SupplyStatusPanel({ onClose }: SupplyStatusPanelProps) {
  const { cities, armies, factions, currentPlayer } = useGameStore();
  
  const playerFaction = factions[currentPlayer];
  const playerCities = playerFaction?.cities.map(id => cities[id]).filter(Boolean) || [];
  const playerArmies = Object.values(armies).filter(a => a.faction === currentPlayer) || [];
  
  // 计算每个城市的粮草状态
  const citySupplyStatus = playerCities.map(city => {
    const consumption = SupplySystem.calculateCityFoodConsumption(city);
    const shortageLevel = SupplySystem.checkFoodShortage(city.resources.food, consumption);
    const priority = SupplySystem.calculateSupplyPriority(city, playerArmies);
    
    return {
      city,
      consumption,
      shortageLevel,
      priority,
      daysRemaining: Math.floor(city.resources.food / Math.max(1, consumption))
    };
  });
  
  // 按优先级排序
  citySupplyStatus.sort((a, b) => b.priority - a.priority);
  
  // 获取粮草不足等级的颜色
  const getShortageColor = (level: FoodShortageLevel) => {
    switch (level) {
      case FoodShortageLevel.NONE:
        return 'text-green-400';
      case FoodShortageLevel.LIGHT:
        return 'text-yellow-400';
      case FoodShortageLevel.MODERATE:
        return 'text-orange-400';
      case FoodShortageLevel.SEVERE:
        return 'text-red-400';
      case FoodShortageLevel.CRITICAL:
        return 'text-red-600 font-bold';
      default:
        return 'text-amber-200/60';
    }
  };
  
  // 获取粮草不足等级的文本
  const getShortageText = (level: FoodShortageLevel) => {
    switch (level) {
      case FoodShortageLevel.NONE:
        return '充足';
      case FoodShortageLevel.LIGHT:
        return '轻度不足';
      case FoodShortageLevel.MODERATE:
        return '中度不足';
      case FoodShortageLevel.SEVERE:
        return '严重不足';
      case FoodShortageLevel.CRITICAL:
        return '完全断粮';
      default:
        return '未知';
    }
  };
  
  // 计算总览
  const totalConsumption = citySupplyStatus.reduce((sum, s) => sum + s.consumption, 0);
  const totalFood = playerCities.reduce((sum, c) => sum + c.resources.food, 0);
  const criticalCities = citySupplyStatus.filter(s => 
    s.shortageLevel === FoodShortageLevel.SEVERE || s.shortageLevel === FoodShortageLevel.CRITICAL
  ).length;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[800px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>📊 后勤补给状态</h2>
          <button 
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 总览 */}
          <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
            <h3 className="text-base font-semibold text-amber-100 mb-3">粮草总览</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-amber-200/60 mb-1">总储备</div>
                <div className="text-2xl font-bold text-green-400">{totalFood}</div>
                <div className="text-xs text-amber-200/40">粮草</div>
              </div>
              <div className="text-center">
                <div className="text-amber-200/60 mb-1">每回合消耗</div>
                <div className="text-2xl font-bold text-yellow-400">{totalConsumption}</div>
                <div className="text-xs text-amber-200/40">粮草</div>
              </div>
              <div className="text-center">
                <div className="text-amber-200/60 mb-1">可维持回合</div>
                <div className="text-2xl font-bold text-blue-400">
                  {totalConsumption > 0 ? Math.floor(totalFood / totalConsumption) : '∞'}
                </div>
                <div className="text-xs text-amber-200/40">回合</div>
              </div>
              <div className="text-center">
                <div className="text-amber-200/60 mb-1">危急城市</div>
                <div className={`text-2xl font-bold ${criticalCities > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {criticalCities}
                </div>
                <div className="text-xs text-amber-200/40">座</div>
              </div>
            </div>
          </div>
          
          {/* 城市粮草状态 */}
          <div>
            <h3 className="text-base font-semibold text-amber-100 mb-3">城市粮草状态</h3>
            <div className="space-y-2">
              {citySupplyStatus.map(status => (
                <div 
                  key={status.city.id}
                  className="bg-stone-800/40 rounded p-3 border border-amber-900/20 hover:bg-stone-700/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-amber-100">{status.city.name}</span>
                      <span className="text-xs text-amber-200/40 ml-2">
                        {status.city.terrain === 'plain' ? '平原' : 
                         status.city.terrain === 'mountain' ? '山地' : 
                         status.city.terrain === 'water' ? '水域' : '关隘'}
                      </span>
                    </div>
                    <span className={`text-sm ${getShortageColor(status.shortageLevel)}`}>
                      {getShortageText(status.shortageLevel)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-amber-200/60">储备: </span>
                      <span className="text-amber-100">{status.city.resources.food}</span>
                    </div>
                    <div>
                      <span className="text-amber-200/60">消耗: </span>
                      <span className="text-yellow-400">{status.consumption}/回合</span>
                    </div>
                    <div>
                      <span className="text-amber-200/60">维持: </span>
                      <span className="text-blue-400">{status.daysRemaining}回合</span>
                    </div>
                    <div>
                      <span className="text-amber-200/60">优先级: </span>
                      <span className="text-purple-400">{status.priority}</span>
                    </div>
                  </div>
                  
                  {/* 粮草进度条 */}
                  <div className="mt-2">
                    <div className="h-1.5 bg-stone-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          status.shortageLevel === FoodShortageLevel.NONE ? 'bg-green-500' :
                          status.shortageLevel === FoodShortageLevel.LIGHT ? 'bg-yellow-500' :
                          status.shortageLevel === FoodShortageLevel.MODERATE ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (status.city.resources.food / (status.consumption * 10)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 军队粮草状态 */}
          {playerArmies.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-amber-100 mb-3">军队粮草状态</h3>
              <div className="space-y-2">
                {playerArmies.map(army => {
                  const consumption = SupplySystem.calculateArmyFoodConsumption(army);
                  const daysRemaining = Math.floor(army.supplies.food / Math.max(1, consumption));
                  const location = cities[army.location];
                  
                  return (
                    <div 
                      key={army.id}
                      className="bg-stone-800/40 rounded p-3 border border-amber-900/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-amber-100">
                            军队 #{army.id.slice(-4)}
                          </span>
                          <span className="text-xs text-amber-200/40 ml-2">
                            {location?.name || '未知位置'}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          army.status === 'idle' ? 'bg-gray-700/50 text-gray-300' :
                          army.status === 'moving' ? 'bg-blue-700/50 text-blue-300' :
                          army.status === 'fighting' ? 'bg-red-700/50 text-red-300' :
                          'bg-green-700/50 text-green-300'
                        }`}>
                          {army.status === 'idle' ? '待命' :
                           army.status === 'moving' ? '移动中' :
                           army.status === 'fighting' ? '战斗中' : '休整'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-amber-200/60">携带: </span>
                          <span className="text-amber-100">{army.supplies.food}/{army.supplies.maxFood}</span>
                        </div>
                        <div>
                          <span className="text-amber-200/60">消耗: </span>
                          <span className="text-yellow-400">{consumption}/回合</span>
                        </div>
                        <div>
                          <span className="text-amber-200/60">维持: </span>
                          <span className="text-blue-400">{daysRemaining}回合</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* 提示信息 */}
          <div className="text-xs text-amber-200/50 space-y-1">
            <p>• 粮草消耗：城市每100士兵消耗1粮草/回合，军队移动/战斗时消耗增加</p>
            <p>• 粮草不足会导致士气下降、士兵逃亡，严重时军队哗变</p>
            <p>• 优先级高的城市应优先补给（粮草少、有驻军、边境要地）</p>
            <p>• 可通过粮草运输功能在城市间调配粮草</p>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-3 p-4 border-t border-amber-800/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-stone-700/60 hover:bg-stone-600/60 rounded text-sm font-medium transition-colors border border-stone-500/30"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
