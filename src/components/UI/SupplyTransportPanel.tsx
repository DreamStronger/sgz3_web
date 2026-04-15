import { useState } from 'react';
import { useGameStore } from '@/store';
import { useDialogStore } from '@/store/dialogStore';
import { SupplySystem } from '@/systems/supply/SupplySystem';
import { SupplyStatusPanel } from './SupplyStatusPanel';

interface SupplyTransportPanelProps {
  onClose: () => void;
}

export function SupplyTransportPanel({ onClose }: SupplyTransportPanelProps) {
  const { cities, factions, currentPlayer, updateCity } = useGameStore();
  const { showAlert, showConfirm } = useDialogStore();
  
  const [fromCityId, setFromCityId] = useState<string>('');
  const [toCityId, setToCityId] = useState<string>('');
  const [foodAmount, setFoodAmount] = useState<number>(1000);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  
  const playerFaction = factions[currentPlayer];
  const playerCities = playerFaction?.cities.map(id => cities[id]).filter(Boolean) || [];
  
  const fromCity = fromCityId ? cities[fromCityId] : null;
  const toCity = toCityId ? cities[toCityId] : null;
  
  // 计算运输消耗
  const calculateTransportInfo = () => {
    if (!fromCity || !toCity) return null;
    
    // 简化距离计算（实际应该基于地图路径）
    const distance = Math.sqrt(
      Math.pow(toCity.position.x - fromCity.position.x, 2) +
      Math.pow(toCity.position.y - fromCity.position.y, 2)
    );
    
    const turns = SupplySystem.calculateTransportTime(fromCity, toCity, distance);
    const cost = SupplySystem.calculateTransportCost(foodAmount, distance);
    const requiredSoldiers = Math.ceil(foodAmount / 100);
    
    return { turns, cost, requiredSoldiers, distance: Math.floor(distance) };
  };
  
  const transportInfo = calculateTransportInfo();
  
  // 执行运输
  const handleTransport = async () => {
    if (!fromCity || !toCity || !transportInfo) {
      showAlert('请选择出发城市和目标城市', '提示');
      return;
    }
    
    if (fromCityId === toCityId) {
      showAlert('出发城市和目标城市不能相同', '提示');
      return;
    }
    
    if (fromCity.resources.food < foodAmount) {
      showAlert('粮草不足', '提示');
      return;
    }
    
    if (fromCity.resources.soldiers < transportInfo.requiredSoldiers) {
      showAlert(`士兵不足，需要${transportInfo.requiredSoldiers}士兵护送`, '提示');
      return;
    }
    
    const confirmed = await showConfirm(
      `确定从${fromCity.name}运输${foodAmount}粮草到${toCity.name}？\n\n` +
      `运输消耗：${transportInfo.cost}粮草\n` +
      `运输时间：${transportInfo.turns}回合\n` +
      `护送士兵：${transportInfo.requiredSoldiers}人`,
      '确认运输'
    );
    
    if (!confirmed) return;
    
    // 扣除粮草和士兵
    const actualFood = foodAmount - transportInfo.cost;
    
    updateCity(fromCityId, {
      resources: {
        ...fromCity.resources,
        food: fromCity.resources.food - foodAmount,
        soldiers: fromCity.resources.soldiers - transportInfo.requiredSoldiers
      }
    });
    
    // TODO: 创建运输队记录，在指定回合后到达
    // 这里简化处理，直接在目标城市增加粮草
    updateCity(toCityId, {
      resources: {
        ...toCity.resources,
        food: toCity.resources.food + actualFood,
        soldiers: toCity.resources.soldiers + transportInfo.requiredSoldiers
      }
    });
    
    showAlert(
      `运输成功！\n${actualFood}粮草已送达${toCity.name}`,
      '运输完成'
    );
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>🌾 粮草运输</h2>
          <button 
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* 出发城市 */}
          <div>
            <label className="block text-sm font-semibold text-amber-200/80 mb-2">出发城市</label>
            <select
              value={fromCityId}
              onChange={(e) => setFromCityId(e.target.value)}
              className="w-full bg-stone-800/60 border border-amber-900/30 rounded px-3 py-2 text-amber-100"
            >
              <option value="">选择城市</option>
              {playerCities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name} (粮草: {city.resources.food})
                </option>
              ))}
            </select>
          </div>
          
          {/* 目标城市 */}
          <div>
            <label className="block text-sm font-semibold text-amber-200/80 mb-2">目标城市</label>
            <select
              value={toCityId}
              onChange={(e) => setToCityId(e.target.value)}
              className="w-full bg-stone-800/60 border border-amber-900/30 rounded px-3 py-2 text-amber-100"
            >
              <option value="">选择城市</option>
              {playerCities.filter(c => c.id !== fromCityId).map(city => (
                <option key={city.id} value={city.id}>
                  {city.name} (粮草: {city.resources.food})
                </option>
              ))}
            </select>
          </div>
          
          {/* 运输数量 */}
          <div>
            <label className="block text-sm font-semibold text-amber-200/80 mb-2">
              运输数量
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="100"
                max={fromCity?.resources.food || 1000}
                step="100"
                value={foodAmount}
                onChange={(e) => setFoodAmount(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={foodAmount}
                onChange={(e) => setFoodAmount(Number(e.target.value))}
                className="w-24 bg-stone-800/60 border border-amber-900/30 rounded px-2 py-1 text-amber-100 text-center"
              />
            </div>
            {fromCity && (
              <p className="text-xs text-amber-200/50 mt-1">
                可用粮草: {fromCity.resources.food}
              </p>
            )}
          </div>
          
          {/* 运输信息 */}
          {transportInfo && (
            <div className="bg-stone-800/40 rounded p-3 border border-amber-900/20">
              <h3 className="text-sm font-semibold text-amber-100 mb-2">运输信息</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-200/60">运输距离</span>
                  <span className="text-amber-100">{transportInfo.distance} 里</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-200/60">运输时间</span>
                  <span className="text-amber-100">{transportInfo.turns} 回合</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-200/60">运输消耗</span>
                  <span className="text-red-400">-{transportInfo.cost} 粮草</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-200/60">实际到达</span>
                  <span className="text-green-400">+{foodAmount - transportInfo.cost} 粮草</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-200/60">护送士兵</span>
                  <span className="text-amber-100">{transportInfo.requiredSoldiers} 人</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 提示信息 */}
          <div className="text-xs text-amber-200/50 space-y-1">
            <p>• 运输粮草需要士兵护送，每100粮草需要1名士兵</p>
            <p>• 运输过程中会消耗部分粮草</p>
            <p>• 距离越远，消耗越大，时间越长</p>
            <p>• 运输队可能被敌军截击（待实现）</p>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-3 p-4 border-t border-amber-800/30">
          <button
            onClick={() => setShowStatusPanel(true)}
            className="px-4 py-2 bg-blue-700/60 hover:bg-blue-600/60 rounded text-sm font-medium transition-colors border border-blue-500/30"
          >
            查看状态
          </button>
          <button
            onClick={handleTransport}
            disabled={!fromCityId || !toCityId || foodAmount <= 0}
            className="flex-1 px-4 py-2 bg-green-700/60 hover:bg-green-600/60 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/30"
          >
            执行运输
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-stone-700/60 hover:bg-stone-600/60 rounded text-sm font-medium transition-colors border border-stone-500/30"
          >
            取消
          </button>
        </div>
      </div>
      
      {/* 后勤补给状态面板 */}
      {showStatusPanel && (
        <SupplyStatusPanel onClose={() => setShowStatusPanel(false)} />
      )}
    </div>
  );
}
