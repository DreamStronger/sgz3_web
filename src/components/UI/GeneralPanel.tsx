import { useState } from 'react';
import { useGameStore } from '@/store';
import { useDialogStore } from '@/store/dialogStore';
import type { General, Title, Item } from '@/types';

interface GeneralPanelProps {
  onClose: () => void;
}

type SortType = 'name' | 'command' | 'force' | 'intelligence' | 'politics' | 'charm' | 'loyalty' | 'merit';

export function GeneralPanel({ onClose }: GeneralPanelProps) {
  const { 
    generals, 
    cities, 
    currentPlayer, 
    factions, 
    items,
    titles,
    relations,
    updateGeneral, 
    updateFaction,
    updateItem,
    getGeneralRelations 
  } = useGameStore();
  const { showAlert } = useDialogStore();
  
  const [sortType, setSortType] = useState<SortType>('command');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedGeneral, setSelectedGeneral] = useState<General | null>(null);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // 获取玩家武将
  const playerFaction = factions[currentPlayer];
  const playerGenerals = playerFaction?.generals.map(id => generals[id]).filter(Boolean) || [];
  
  // 获取玩家城市
  const playerCities = playerFaction?.cities.map(id => cities[id]).filter(Boolean) || [];
  
  // 获取玩家宝物（未装备的）
  const availableItems = Object.values(items).filter(
    item => !item.owner && playerCities.some(city => city.id === item.location)
  );
  
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
      case 'merit':
        valueA = a.merit;
        valueB = b.merit;
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
  
  // 赏赐（提升忠诚度）
  const handleReward = (general: General) => {
    if (playerFaction && playerFaction.resources.money >= 100) {
      updateGeneral(general.id, {
        loyalty: Math.min(100, general.loyalty + 5)
      });
      updateFaction(playerFaction.id, {
        resources: {
          ...playerFaction.resources,
          money: playerFaction.resources.money - 100
        }
      });
    }
  };
  
  // 封官
  const handleAppointTitle = (titleId: string) => {
    if (!selectedGeneral || !playerFaction) return;
    
    const title = titles[titleId];
    if (!title) return;
    
    // 检查条件
    if (selectedGeneral.merit < title.requirements.minMerit) {
      showAlert(`功勋不足，需要 ${title.requirements.minMerit} 功勋`, '提示');
      return;
    }
    if (title.requirements.minCommand && selectedGeneral.attributes.command < title.requirements.minCommand) {
      showAlert(`统率不足，需要 ${title.requirements.minCommand} 统率`, '提示');
      return;
    }
    if (title.requirements.minForce && selectedGeneral.attributes.force < title.requirements.minForce) {
      showAlert(`武力不足，需要 ${title.requirements.minForce} 武力`, '提示');
      return;
    }
    if (playerFaction.resources.money < title.cost) {
      showAlert(`金钱不足，需要 ${title.cost} 金`, '提示');
      return;
    }
    
    // 更新武将
    updateGeneral(selectedGeneral.id, {
      title: titleId,
      loyalty: Math.min(100, selectedGeneral.loyalty + title.effects.loyaltyBonus)
    });
    
    // 扣除金钱
    updateFaction(playerFaction.id, {
      resources: {
        ...playerFaction.resources,
        money: playerFaction.resources.money - title.cost
      }
    });
    
    setShowTitleModal(false);
    setSelectedGeneral({ ...selectedGeneral, title: titleId });
  };
  
  // 装备宝物
  const handleEquipItem = (item: Item) => {
    if (!selectedGeneral) return;
    
    // 更新宝物
    updateItem(item.id, {
      owner: selectedGeneral.id
    });
    
    // 更新武将
    updateGeneral(selectedGeneral.id, {
      items: [...selectedGeneral.items, item.id],
      loyalty: Math.min(100, selectedGeneral.loyalty + 10)
    });
    
    setShowItemModal(false);
    setSelectedGeneral({ 
      ...selectedGeneral, 
      items: [...selectedGeneral.items, item.id] 
    });
  };
  
  // 卸下宝物
  const handleUnequipItem = (itemId: string) => {
    if (!selectedGeneral) return;
    
    updateItem(itemId, {
      owner: undefined
    });
    
    updateGeneral(selectedGeneral.id, {
      items: selectedGeneral.items.filter(id => id !== itemId)
    });
    
    setSelectedGeneral({ 
      ...selectedGeneral, 
      items: selectedGeneral.items.filter(id => id !== itemId) 
    });
  };
  
  // 获取属性颜色
  const getAttrColor = (value: number) => {
    if (value >= 90) return 'text-yellow-400';
    if (value >= 70) return 'text-green-400';
    if (value >= 50) return 'text-blue-400';
    return 'text-amber-200/80';
  };
  
  // 获取性格文本
  const getPersonalityText = (personality: string) => {
    const map: Record<string, string> = {
      brave: '刚胆',
      timid: '胆小',
      righteous: '仁义',
      calm: '冷静',
      rash: '鲁莽',
      normal: '普通'
    };
    return map[personality] || '普通';
  };
  
  // 获取关系类型文本
  const getRelationTypeText = (type: string) => {
    const map: Record<string, string> = {
      father: '父亲',
      son: '儿子',
      brother: '兄弟',
      friend: '朋友',
      enemy: '仇敌',
      former_lord: '旧主'
    };
    return map[type] || '关系';
  };
  
  // 获取武将的官职
  const getGeneralTitle = (general: General) => {
    if (!general.title) return null;
    return titles[general.title];
  };
  
  // 获取武将的宝物
  const getGeneralItems = (general: General) => {
    return general.items.map(id => items[id]).filter(Boolean);
  };
  
  // 获取武将关系
  const generalRelations = selectedGeneral ? getGeneralRelations(selectedGeneral.id) : [];
  
  // 可封的官职（按等级排序）
  const availableTitles = Object.values(titles)
    .filter(title => {
      if (!selectedGeneral) return false;
      // 已经有更高等级官职的不再显示
      const currentTitle = getGeneralTitle(selectedGeneral);
      if (currentTitle && currentTitle.level >= title.level) return false;
      return true;
    })
    .sort((a, b) => a.level - b.level);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[1000px] max-h-[85vh] flex flex-col">
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
          <div className="w-[55%] border-r border-amber-800/30 p-4 flex flex-col">
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
            <div className="grid grid-cols-9 gap-1 px-2 py-2 text-xs text-amber-200/60 border-b border-amber-900/20">
              <button onClick={() => handleSort('name')} className="text-left hover:text-amber-100">
                姓名 {sortType === 'name' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('command')} className="text-center hover:text-amber-100">
                统 {sortType === 'command' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('force')} className="text-center hover:text-amber-100">
                武 {sortType === 'force' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('intelligence')} className="text-center hover:text-amber-100">
                智 {sortType === 'intelligence' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('politics')} className="text-center hover:text-amber-100">
                政 {sortType === 'politics' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('charm')} className="text-center hover:text-amber-100">
                魅 {sortType === 'charm' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('loyalty')} className="text-center hover:text-amber-100">
                忠 {sortType === 'loyalty' && (sortAsc ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('merit')} className="text-center hover:text-amber-100">
                功 {sortType === 'merit' && (sortAsc ? '↑' : '↓')}
              </button>
              <div className="text-center">官职</div>
            </div>
            
            {/* 武将列表 */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {sortedGenerals.map(general => {
                  const title = getGeneralTitle(general);
                  return (
                    <div
                      key={general.id}
                      onClick={() => setSelectedGeneral(general)}
                      className={`grid grid-cols-9 gap-1 px-2 py-2 rounded cursor-pointer transition-colors text-sm ${
                        selectedGeneral?.id === general.id 
                          ? 'bg-purple-900/40 border border-purple-600/30' 
                          : 'bg-stone-800/30 hover:bg-stone-700/40 border border-transparent'
                      }`}
                    >
                      <span className="text-amber-100 font-medium truncate">{general.name}</span>
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
                      <span className="text-center text-amber-200/60">
                        {general.merit}
                      </span>
                      <span className="text-center text-purple-300 text-xs truncate">
                        {title?.name || '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* 右侧武将详情 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedGeneral ? (
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-amber-100">{selectedGeneral.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedGeneral.status === 'active' ? 'bg-green-900/50 text-green-300' :
                      selectedGeneral.status === 'captured' ? 'bg-red-900/50 text-red-300' : 'bg-gray-900/50 text-gray-300'
                    }`}>
                      {selectedGeneral.status === 'active' ? '活跃' :
                       selectedGeneral.status === 'captured' ? '被俘' : '阵亡'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">位置</span>
                      <span className="text-amber-100">{cities[selectedGeneral.location]?.name || '未知'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">性格</span>
                      <span className="text-amber-100">{getPersonalityText(selectedGeneral.personality)}</span>
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
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">功勋</span>
                      <span className="text-amber-100">{selectedGeneral.merit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">经验</span>
                      <span className="text-amber-100">{selectedGeneral.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-200/60">官职</span>
                      <span className="text-purple-300">{getGeneralTitle(selectedGeneral)?.name || '无'}</span>
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
                
                {/* 宝物 */}
                <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-amber-100">宝物</h3>
                    <button
                      onClick={() => setShowItemModal(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      装备宝物
                    </button>
                  </div>
                  {getGeneralItems(selectedGeneral).length > 0 ? (
                    <div className="space-y-2">
                      {getGeneralItems(selectedGeneral).map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-stone-700/30 rounded p-2">
                          <div>
                            <span className="text-amber-100 text-sm">{item.name}</span>
                            <span className="text-xs text-amber-200/40 ml-2">({item.type === 'weapon' ? '武器' : item.type === 'book' ? '书籍' : item.type === 'horse' ? '马匹' : '特殊'})</span>
                          </div>
                          <button
                            onClick={() => handleUnequipItem(item.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            卸下
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-amber-200/40">暂无宝物</div>
                  )}
                </div>
                
                {/* 关系 */}
                {generalRelations.length > 0 && (
                  <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                    <h3 className="text-base font-semibold text-amber-100 mb-3">关系</h3>
                    <div className="space-y-2">
                      {generalRelations.map((rel, idx) => {
                        const otherId = rel.general1 === selectedGeneral.id ? rel.general2 : rel.general1;
                        const other = generals[otherId];
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-amber-100">{other?.name || '未知'}</span>
                            <div>
                              <span className={`${
                                rel.intimacy >= 50 ? 'text-green-400' :
                                rel.intimacy >= 0 ? 'text-amber-200/60' : 'text-red-400'
                              }`}>
                                {getRelationTypeText(rel.type)}
                              </span>
                              <span className="text-amber-200/40 ml-2">({rel.intimacy})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReward(selectedGeneral)}
                    disabled={playerFaction?.resources.money < 100}
                    className="flex-1 px-4 py-2 bg-yellow-700/60 hover:bg-yellow-600/60 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-500/30"
                  >
                    赏赐 (100金)
                  </button>
                  <button
                    onClick={() => setShowTitleModal(true)}
                    className="flex-1 px-4 py-2 bg-purple-700/60 hover:bg-purple-600/60 rounded text-sm font-medium transition-colors border border-purple-500/30"
                  >
                    封官
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
      
      {/* 封官对话框 */}
      {showTitleModal && selectedGeneral && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowTitleModal(false)}></div>
          <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[500px] max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
              <h2 className="text-lg font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>封官 - {selectedGeneral.name}</h2>
              <button 
                onClick={() => setShowTitleModal(false)}
                className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {availableTitles.map(title => {
                  const canAppoint = selectedGeneral.merit >= title.requirements.minMerit &&
                    (!title.requirements.minCommand || selectedGeneral.attributes.command >= title.requirements.minCommand) &&
                    (!title.requirements.minForce || selectedGeneral.attributes.force >= title.requirements.minForce) &&
                    (playerFaction?.resources.money || 0) >= title.cost;
                  
                  return (
                    <div 
                      key={title.id}
                      className={`bg-stone-800/60 rounded p-3 border ${
                        canAppoint ? 'border-amber-900/20 hover:bg-stone-700/60 cursor-pointer' : 'border-gray-800/20 opacity-50'
                      }`}
                      onClick={() => canAppoint && handleAppointTitle(title.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-amber-100">{title.name}</span>
                        <span className="text-xs text-amber-200/50">Lv.{title.level}</span>
                      </div>
                      <div className="text-xs text-amber-200/60 space-y-1">
                        <div>统率+{title.effects.command || 0} 武力+{title.effects.force || 0} 忠诚+{title.effects.loyaltyBonus}</div>
                        <div>带兵上限: {title.effects.maxSoldiers}</div>
                        <div className="text-amber-400">花费: {title.cost}金 | 俸禄: {title.salary}金/回合</div>
                        {!canAppoint && (
                          <div className="text-red-400">
                            {selectedGeneral.merit < title.requirements.minMerit && `功勋不足(${selectedGeneral.merit}/${title.requirements.minMerit}) `}
                            {title.requirements.minCommand && selectedGeneral.attributes.command < title.requirements.minCommand && `统率不足 `}
                            {title.requirements.minForce && selectedGeneral.attributes.force < title.requirements.minForce && `武力不足 `}
                            {(playerFaction?.resources.money || 0) < title.cost && `金钱不足`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 装备宝物对话框 */}
      {showItemModal && selectedGeneral && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowItemModal(false)}></div>
          <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[500px] max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
              <h2 className="text-lg font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>装备宝物 - {selectedGeneral.name}</h2>
              <button 
                onClick={() => setShowItemModal(false)}
                className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {availableItems.length > 0 ? (
                <div className="space-y-2">
                  {availableItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => handleEquipItem(item)}
                      className="bg-stone-800/60 rounded p-3 hover:bg-stone-700/60 cursor-pointer border border-amber-900/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-amber-100">{item.name}</span>
                        <span className="text-xs text-amber-200/50">
                          {item.type === 'weapon' ? '武器' : item.type === 'book' ? '书籍' : item.type === 'horse' ? '马匹' : '特殊'}
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/60">
                        {item.effects.force && `武力+${item.effects.force} `}
                        {item.effects.intelligence && `智力+${item.effects.intelligence} `}
                        {item.effects.command && `统率+${item.effects.command} `}
                        {item.effects.charm && `魅力+${item.effects.charm} `}
                        {item.effects.special && `特殊: ${item.effects.special}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-amber-200/40 py-8">
                  暂无可装备的宝物
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
