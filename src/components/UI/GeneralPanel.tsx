import { useState } from 'react';
import { useGameStore } from '@/store';
import type { General } from '@/types';

interface GeneralPanelProps {
  onClose: () => void;
}

type SortType = 'name' | 'command' | 'force' | 'intelligence' | 'politics' | 'charm' | 'loyalty';

export function GeneralPanel({ onClose }: GeneralPanelProps) {
  const { generals, cities, currentPlayer, factions, updateGeneral } = useGameStore();
  
  const [sortType, setSortType] = useState<SortType>('command');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedGeneral, setSelectedGeneral] = useState<General | null>(null);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  
  // 获取玩家武将
  const playerFaction = factions[currentPlayer];
  const playerGenerals = playerFaction?.generals.map(id => generals[id]).filter(Boolean) || [];
  
  // 获取玩家城市
  const playerCities = playerFaction?.cities.map(id => cities[id]).filter(Boolean) || [];
  
  // 筛选武将
  let filteredGenerals = playerGenerals;
  if (filterLocation !== 'all') {
    filteredGenerals = playerGenerals.filter(g => g.location === filterLocation);
  }
  
  // 排序武将
  const sortedGenerals = [...filteredGenerals].sort((a, b) => {
    let valueA: number;
    let valueB: number;
    
    switch (sortType) {
      case 'name':
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      case 'command':
        valueA = a.attributes.command;
        valueB = b.attributes.command;
        break;
      case 'force':
        valueA = a.attributes.force;
        valueB = b.attributes.force;
        break;
      case 'intelligence':
        valueA = a.attributes.intelligence;
        valueB = b.attributes.intelligence;
        break;
      case 'politics':
        valueA = a.attributes.politics;
        valueB = b.attributes.politics;
        break;
      case 'charm':
        valueA = a.attributes.charm;
        valueB = b.attributes.charm;
        break;
      case 'loyalty':
        valueA = a.loyalty;
        valueB = b.loyalty;
        break;
      default:
        valueA = a.attributes.command;
        valueB = b.attributes.command;
    }
    
    return sortAsc ? valueA - valueB : valueB - valueA;
  });
  
  // 排序切换
  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortAsc(!sortAsc);
    } else {
      setSortType(type);
      setSortAsc(false);
    }
  };
  
  // 调整忠诚度（示例功能）
  const handleReward = (general: General) => {
    if (playerFaction && playerFaction.resources.money >= 100) {
      updateGeneral(general.id, {
        loyalty: Math.min(100, general.loyalty + 5)
      });
      // 扣除金钱需要通过updateFaction
    }
  };
  
  // 获取属性颜色
  const getAttrColor = (value: number) => {
    if (value >= 90) return 'text-yellow-400';
    if (value >= 70) return 'text-green-400';
    if (value >= 50) return 'text-blue-400';
    return 'text-amber-200/80';
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[900px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>👤 武将管理</h2>
          <button 
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧武将列表 */}
          <div className="w-2/3 border-r border-amber-800/30 p-4 flex flex-col">
            {/* 筛选和排序 */}
            <div className="flex items-center gap-4 mb-3">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-stone-800/60 border border-amber-900/30 rounded px-2 py-1 text-sm text-amber-100"
              >
                <option value="all">全部城市</option>
                {playerCities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              
              <span className="text-sm text-amber-200/60">共 {sortedGenerals.length} 名武将</span>
            </div>
            
            {/* 表头 */}
            <div className="grid grid-cols-8 gap-2 px-2 py-2 text-xs text-amber-200/60 border-b border-amber-900/20">
              <button onClick={() => handleSort('name')} className="text-left hover:text-amber-100">
                姓名 {sortType === 'name' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('command')} className="text-center hover:text-amber-100">
                统率 {sortType === 'command' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('force')} className="text-center hover:text-amber-100">
                武力 {sortType === 'force' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('intelligence')} className="text-center hover:text-amber-100">
                智力 {sortType === 'intelligence' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('politics')} className="text-center hover:text-amber-100">
                政治 {sortType === 'politics' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('charm')} className="text-center hover:text-amber-100">
                魅力 {sortType === 'charm' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('loyalty')} className="text-center hover:text-amber-100">
                忠诚 {sortType === 'loyalty' && (sortAsc ? '↑' : '↓')}
              </button>
              <div className="text-center">位置</div>
            </div>
            
            {/* 武将列表 */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {sortedGenerals.map(general => (
                  <div
                    key={general.id}
                    onClick={() => setSelectedGeneral(general)}
                    className={`grid grid-cols-8 gap-2 px-2 py-2 rounded cursor-pointer transition-colors text-sm ${
                      selectedGeneral?.id === general.id 
                        ? 'bg-purple-900/40 border border-purple-600/30' 
                        : 'bg-stone-800/30 hover:bg-stone-700/40 border border-transparent'
                    }`}
                  >
                    <span className="text-amber-100 font-medium">{general.name}</span>
                    <span className={`text-center ${getAttrColor(general.attributes.command)}`}>
                      {general.attributes.command}
                    </span>
                    <span className={`text-center ${getAttrColor(general.attributes.force)}`}>
                      {general.attributes.force}
                    </span>
                    <span className={`text-center ${getAttrColor(general.attributes.intelligence)}`}>
                      {general.attributes.intelligence}
                    </span>
                    <span className={`text-center ${getAttrColor(general.attributes.politics)}`}>
                      {general.attributes.politics}
                    </span>
                    <span className={`text-center ${getAttrColor(general.attributes.charm)}`}>
                      {general.attributes.charm}
                    </span>
                    <span className={`text-center ${general.loyalty >= 80 ? 'text-green-400' : general.loyalty >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {general.loyalty}
                    </span>
                    <span className="text-center text-amber-200/60 text-xs">
                      {cities[general.location]?.name || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 右侧武将详情 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedGeneral ? (
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-lg font-semibold text-amber-100 mb-3">{selectedGeneral.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">状态</span>
                      <span className={`${
                        selectedGeneral.status === 'active' ? 'text-green-400' :
                        selectedGeneral.status === 'captured' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {selectedGeneral.status === 'active' ? '活跃' :
                         selectedGeneral.status === 'captured' ? '被俘' : '阵亡'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">位置</span>
                      <span className="text-amber-100">{cities[selectedGeneral.location]?.name || '未知'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">忠诚度</span>
                      <span className={`${
                        selectedGeneral.loyalty >= 80 ? 'text-green-400' :
                        selectedGeneral.loyalty >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {selectedGeneral.loyalty}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 属性详情 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-base font-semibold text-amber-100 mb-3">属性</h3>
                  <div className="space-y-3">
                    {[
                      { label: '统率', value: selectedGeneral.attributes.command, color: 'bg-blue-500' },
                      { label: '武力', value: selectedGeneral.attributes.force, color: 'bg-red-500' },
                      { label: '智力', value: selectedGeneral.attributes.intelligence, color: 'bg-purple-500' },
                      { label: '政治', value: selectedGeneral.attributes.politics, color: 'bg-green-500' },
                      { label: '魅力', value: selectedGeneral.attributes.charm, color: 'bg-yellow-500' }
                    ].map(attr => (
                      <div key={attr.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-amber-200/60">{attr.label}</span>
                          <span className={getAttrColor(attr.value)}>{attr.value}</span>
                        </div>
                        <div className="h-2 bg-stone-700/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${attr.color} rounded-full transition-all`}
                            style={{ width: `${attr.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 技能 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <h3 className="text-base font-semibold text-amber-100 mb-3">技能</h3>
                  {selectedGeneral.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedGeneral.skills.map(skill => (
                        <span 
                          key={skill}
                          className="px-2 py-1 bg-purple-900/40 border border-purple-600/30 rounded text-sm text-purple-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-amber-200/40">暂无技能</div>
                  )}
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReward(selectedGeneral)}
                    disabled={playerFaction?.resources.money < 100}
                    className="flex-1 px-4 py-2 bg-yellow-700/60 hover:bg-yellow-600/60 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-500/30"
                  >
                    赏赐 (100金)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-amber-200/40">
                请选择一位武将
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
