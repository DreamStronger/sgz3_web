import { useState } from 'react';
import { useGameStore } from '@/store';
import type { Army, Unit, Formation } from '@/types';

interface ArmyPanelProps {
  onClose: () => void;
}

export function ArmyPanel({ onClose }: ArmyPanelProps) {
  const { 
    cities, 
    generals, 
    armies, 
    formations,
    currentPlayer,
    createArmy,
    deleteArmy,
    updateCity
  } = useGameStore();

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedGeneral, setSelectedGeneral] = useState<string>('');
  const [selectedFormation, setSelectedFormation] = useState<string>('fish_scale');
  const [infantryCount, setInfantryCount] = useState(0);
  const [cavalryCount, setCavalryCount] = useState(0);
  const [archerCount, setArcherCount] = useState(0);
  const [navyCount, setNavyCount] = useState(0);

  // 获取玩家势力的城市
  const playerCities = Object.values(cities).filter(city => city.faction === currentPlayer);
  
  // 获取选中城市的武将
  const cityGenerals = selectedCity 
    ? Object.values(generals).filter(g => g.location === selectedCity && g.status === 'active')
    : [];

  // 获取选中城市的军队
  const cityArmies = selectedCity
    ? Object.values(armies).filter(army => army.location === selectedCity)
    : [];

  // 获取选中城市的士兵数量
  const citySoldiers = selectedCity ? cities[selectedCity]?.resources.soldiers || 0 : 0;

  // 计算总兵力
  const totalSoldiers = infantryCount + cavalryCount + archerCount + navyCount;

  // 获取选中武将的带兵上限
  const generalMaxSoldiers = selectedGeneral 
    ? (() => {
        const general = generals[selectedGeneral];
        if (!general) return 0;
        const baseMax = general.attributes.command * 100;
        // TODO: 考虑官职加成
        return baseMax;
      })()
    : 0;

  // 创建军队
  const handleCreateArmy = () => {
    if (!selectedCity || !selectedGeneral || totalSoldiers === 0) {
      alert('请选择城市、武将和士兵数量');
      return;
    }

    if (totalSoldiers > citySoldiers) {
      alert('士兵数量不足');
      return;
    }

    if (totalSoldiers > generalMaxSoldiers) {
      alert(`武将带兵上限为 ${generalMaxSoldiers}`);
      return;
    }

    const units: Unit[] = [];
    if (infantryCount > 0) {
      units.push({ type: 'infantry', count: infantryCount, morale: 50, fatigue: 0, experience: 0, general: selectedGeneral });
    }
    if (cavalryCount > 0) {
      units.push({ type: 'cavalry', count: cavalryCount, morale: 50, fatigue: 0, experience: 0, general: selectedGeneral });
    }
    if (archerCount > 0) {
      units.push({ type: 'archer', count: archerCount, morale: 50, fatigue: 0, experience: 0, general: selectedGeneral });
    }
    if (navyCount > 0) {
      units.push({ type: 'navy', count: navyCount, morale: 50, fatigue: 0, experience: 0, general: selectedGeneral });
    }

    const newArmy: Army = {
      id: `army_${Date.now()}`,
      faction: currentPlayer,
      location: selectedCity,
      units,
      generals: [selectedGeneral],
      formation: selectedFormation as Formation['id'],
      status: 'idle',
      supplies: {
        food: totalSoldiers * 10,
        maxFood: totalSoldiers * 20
      }
    };

    createArmy(newArmy);

    // 扣除城市士兵
    updateCity(selectedCity, {
      resources: {
        ...cities[selectedCity].resources,
        soldiers: citySoldiers - totalSoldiers
      }
    });

    // 重置表单
    setSelectedGeneral('');
    setInfantryCount(0);
    setCavalryCount(0);
    setArcherCount(0);
    setNavyCount(0);
  };

  // 解散军队
  const handleDeleteArmy = (armyId: string) => {
    const army = armies[armyId];
    if (!army) return;

    // 计算总兵力
    const totalSoldiers = army.units.reduce((sum, unit) => sum + unit.count, 0);

    // 归还士兵到城市
    updateCity(army.location, {
      resources: {
        ...cities[army.location].resources,
        soldiers: cities[army.location].resources.soldiers + totalSoldiers
      }
    });

    deleteArmy(armyId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[900px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>军队编制</h2>
          <button 
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：城市和军队列表 */}
          <div className="w-1/2 p-4 border-r border-amber-800/30 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>选择城市</h3>
            <div className="space-y-2 mb-4">
              {playerCities.map(city => (
                <div
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={`p-3 rounded cursor-pointer transition-colors border ${
                    selectedCity === city.id 
                      ? 'bg-amber-900/40 border-amber-600/50' 
                      : 'bg-stone-800/60 border-amber-900/20 hover:bg-stone-700/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-amber-100">{city.name}</span>
                    <span className="text-sm text-amber-200/60">士兵: {city.resources.soldiers}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedCity && cityArmies.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>已编制军队</h3>
                <div className="space-y-2">
                  {cityArmies.map(army => (
                    <div key={army.id} className="bg-stone-800/60 rounded p-3 border border-amber-900/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-amber-100">
                            {army.generals.map(gId => generals[gId]?.name).join(', ')}
                          </span>
                          <span className="text-xs text-amber-200/50 ml-2">
                            {formations[army.formation]?.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteArmy(army.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/30"
                        >
                          解散
                        </button>
                      </div>
                      <div className="text-xs text-amber-200/60">
                        {army.units.map(u => `${u.type === 'infantry' ? '步兵' : u.type === 'cavalry' ? '骑兵' : u.type === 'archer' ? '弓兵' : '水军'} ${u.count}`).join(' | ')}
                      </div>
                      <div className="text-xs text-amber-200/50 mt-1">
                        总兵力: {army.units.reduce((sum, u) => sum + u.count, 0)} | 
                        粮草: {army.supplies.food}/{army.supplies.maxFood}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 右侧：编制表单 */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>编制新军队</h3>
            
            {!selectedCity ? (
              <div className="text-center text-amber-200/60 py-8">请先选择城市</div>
            ) : (
              <div className="space-y-4">
                {/* 选择武将 */}
                <div>
                  <label className="block text-sm text-amber-200/80 mb-2">选择武将</label>
                  <select
                    value={selectedGeneral}
                    onChange={(e) => setSelectedGeneral(e.target.value)}
                    className="w-full bg-stone-800 border border-amber-800/40 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-600"
                  >
                    <option value="">请选择武将</option>
                    {cityGenerals.map(general => (
                      <option key={general.id} value={general.id}>
                        {general.name} (统{general.attributes.command} 武{general.attributes.force}) - 带兵上限: {general.attributes.command * 100}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 选择阵型 */}
                <div>
                  <label className="block text-sm text-amber-200/80 mb-2">选择阵型</label>
                  <select
                    value={selectedFormation}
                    onChange={(e) => setSelectedFormation(e.target.value)}
                    className="w-full bg-stone-800 border border-amber-800/40 rounded px-3 py-2 text-amber-100 focus:outline-none focus:border-amber-600"
                  >
                    {Object.values(formations).map(formation => (
                      <option key={formation.id} value={formation.id}>
                        {formation.name} - {formation.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 士兵分配 */}
                <div>
                  <label className="block text-sm text-amber-200/80 mb-2">
                    士兵分配 (可用: {citySoldiers}, 上限: {generalMaxSoldiers})
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-sm text-amber-200/60">步兵:</span>
                      <input
                        type="number"
                        min="0"
                        max={citySoldiers}
                        value={infantryCount}
                        onChange={(e) => setInfantryCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 bg-stone-800 border border-amber-800/40 rounded px-3 py-1 text-amber-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-sm text-amber-200/60">骑兵:</span>
                      <input
                        type="number"
                        min="0"
                        max={citySoldiers}
                        value={cavalryCount}
                        onChange={(e) => setCavalryCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 bg-stone-800 border border-amber-800/40 rounded px-3 py-1 text-amber-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-sm text-amber-200/60">弓兵:</span>
                      <input
                        type="number"
                        min="0"
                        max={citySoldiers}
                        value={archerCount}
                        onChange={(e) => setArcherCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 bg-stone-800 border border-amber-800/40 rounded px-3 py-1 text-amber-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-sm text-amber-200/60">水军:</span>
                      <input
                        type="number"
                        min="0"
                        max={citySoldiers}
                        value={navyCount}
                        onChange={(e) => setNavyCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="flex-1 bg-stone-800 border border-amber-800/40 rounded px-3 py-1 text-amber-100 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-amber-200/60">
                    总兵力: {totalSoldiers}
                  </div>
                </div>

                {/* 创建按钮 */}
                <button
                  onClick={handleCreateArmy}
                  disabled={!selectedGeneral || totalSoldiers === 0}
                  className={`w-full py-3 rounded font-medium transition-all ${
                    !selectedGeneral || totalSoldiers === 0
                      ? 'bg-stone-700/50 text-stone-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 text-white border border-red-600/40'
                  }`}
                  style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
                >
                  创建军队
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
