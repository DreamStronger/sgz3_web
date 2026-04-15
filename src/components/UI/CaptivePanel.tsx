import { useState } from 'react';
import { useGameStore } from '@/store';
import { useDialogStore } from '@/store/dialogStore';
import { RelationSystem } from '@/systems/relation/RelationSystem';
import type { Captive } from '@/types';

interface CaptivePanelProps {
  onClose: () => void;
}

export function CaptivePanel({ onClose }: CaptivePanelProps) {
  const { 
    captives, 
    generals, 
    factions, 
    currentPlayer,
    cities,
    titles,
    relations,
    updateGeneral,
    updateFaction,
    removeCaptive,
    updateCaptive
  } = useGameStore();
  const { showAlert, showConfirm } = useDialogStore();
  
  const [selectedCaptive, setSelectedCaptive] = useState<Captive | null>(null);
  const [persuading, setPersuading] = useState(false);
  
  // 获取玩家势力的俘虏
  const playerCaptives = captives.filter(c => c.capturedBy === currentPlayer);
  
  // 获取俘虏武将详情
  const getCaptiveGeneral = (captive: Captive) => generals[captive.generalId];
  
  // 获取关押城市
  const getCaptiveCity = (captive: Captive) => cities[captive.capturedAt];
  
  // 计算招降成功率
  const calculatePersuasionRate = (captive: Captive) => {
    const general = generals[captive.generalId];
    if (!general) return 0;
    
    // 基础成功率
    let rate = (100 - general.loyalty) / 100 * 0.5;
    
    // 关押时间影响
    rate += captive.loyaltyDrop / 100 * 0.2;
    
    // 招降尝试次数影响
    rate -= captive.persuasionAttempts * 0.1;
    
    return Math.max(0, Math.min(1, rate));
  };
  
  // 招降俘虏
  const handlePersuade = async (captive: Captive) => {
    const general = generals[captive.generalId];
    if (!general) return;
    
    // 选择劝说武将
    const persuaders = Object.values(generals).filter(
      g => g.faction === currentPlayer && g.status === 'active'
    );
    
    if (persuaders.length === 0) {
      showAlert('没有可用武将执行招降', '提示');
      return;
    }
    
    // 简化：使用魅力最高的武将
    const persuader = persuaders.sort((a, b) => b.attributes.charm - a.attributes.charm)[0];
    
    const confirmed = await showConfirm(
      `确定由${persuader.name}劝降${general.name}吗？\n预计成功率: ${Math.round(calculatePersuasionRate(captive) * 100)}%`,
      '确认招降'
    );
    
    if (!confirmed) return;
    
    setPersuading(true);
    
    // 计算招降成功率
    const successRate = RelationSystem.calculatePersuasionSuccess(general, persuader, relations);
    
    if (Math.random() < successRate) {
      // 招降成功
      updateGeneral(general.id, {
        faction: currentPlayer,
        loyalty: 50,
        location: captive.capturedAt
      });
      
      const faction = factions[currentPlayer];
      if (faction) {
        updateFaction(currentPlayer, {
          generals: [...faction.generals, general.id]
        });
      }
      
      // 更新城市武将列表
      const city = cities[captive.capturedAt];
      if (city && !city.generals.includes(general.id)) {
        city.generals.push(general.id);
      }
      
      removeCaptive(general.id);
      
      showAlert(`${general.name}已归降！`, '招降成功');
    } else {
      // 招降失败
      updateCaptive(general.id, {
        persuasionAttempts: captive.persuasionAttempts + 1,
        loyaltyDrop: captive.loyaltyDrop + 5
      });
      
      updateGeneral(general.id, {
        loyalty: Math.max(0, general.loyalty - 5)
      });
      
      showAlert(`${general.name}拒绝投降`, '招降失败');
    }
    
    setPersuading(false);
  };
  
  // 释放俘虏
  const handleRelease = async (captive: Captive) => {
    const general = generals[captive.generalId];
    if (!general) return;
    
    const confirmed = await showConfirm(
      `确定释放${general.name}吗？`,
      '确认释放'
    );
    
    if (!confirmed) return;
    
    // 释放俘虏
    updateGeneral(general.id, {
      faction: '',
      location: captive.capturedAt,
      loyalty: Math.min(100, general.loyalty + 20)
    });
    
    removeCaptive(general.id);
    
    showAlert(`${general.name}已被释放`, '释放成功');
  };
  
  // 处决俘虏
  const handleExecute = async (captive: Captive) => {
    const general = generals[captive.generalId];
    if (!general) return;
    
    const confirmed = await showConfirm(
      `确定处决${general.name}吗？\n\n警告：处决俘虏会降低名声，并可能引起其他武将的不满！`,
      '确认处决'
    );
    
    if (!confirmed) return;
    
    // 处决俘虏
    updateGeneral(general.id, {
      status: 'dead'
    });
    
    removeCaptive(general.id);
    
    showAlert(`${general.name}已被处决`, '处决完成');
  };
  
  // 获取官职名称
  const getTitleName = (titleId?: string) => {
    if (!titleId) return '';
    return titles[titleId]?.name || '';
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[900px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>俘虏管理</h2>
          <button 
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：俘虏列表 */}
          <div className="w-1/2 p-4 border-r border-amber-800/30 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
              俘虏列表 ({playerCaptives.length})
            </h3>
            
            {playerCaptives.length === 0 ? (
              <div className="text-center text-amber-200/60 py-8">
                暂无俘虏
              </div>
            ) : (
              <div className="space-y-2">
                {playerCaptives.map(captive => {
                  const general = getCaptiveGeneral(captive);
                  const city = getCaptiveCity(captive);
                  if (!general) return null;
                  
                  return (
                    <div
                      key={captive.generalId}
                      onClick={() => setSelectedCaptive(captive)}
                      className={`p-3 rounded cursor-pointer transition-colors border ${
                        selectedCaptive?.generalId === captive.generalId 
                          ? 'bg-amber-900/40 border-amber-600/50' 
                          : 'bg-stone-800/60 border-amber-900/20 hover:bg-stone-700/60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-amber-100">{general.name}</h4>
                          <p className="text-xs text-amber-200/60 mt-1">
                            关押于: {city?.name} | 回合: {captive.capturedTurn}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-amber-200/80">
                            忠诚度: <span className={general.loyalty < 30 ? 'text-red-400' : 'text-amber-100'}>
                              {general.loyalty}
                            </span>
                          </div>
                          <div className="text-xs text-amber-200/60 mt-1">
                            招降尝试: {captive.persuasionAttempts}次
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* 右侧：俘虏详情 */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {!selectedCaptive ? (
              <div className="flex items-center justify-center h-full text-amber-200/40">
                请选择一位俘虏
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const general = getCaptiveGeneral(selectedCaptive);
                  const city = getCaptiveCity(selectedCaptive);
                  if (!general) return null;
                  
                  return (
                    <>
                      {/* 基本信息 */}
                      <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-amber-100">{general.name}</h3>
                          <span className="text-xs text-amber-200/60">
                            {getTitleName(general.title)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-amber-200/60">武力: </span>
                            <span className="text-amber-100">{general.attributes.force}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/60">统率: </span>
                            <span className="text-amber-100">{general.attributes.command}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/60">智力: </span>
                            <span className="text-amber-100">{general.attributes.intelligence}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/60">魅力: </span>
                            <span className="text-amber-100">{general.attributes.charm}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-amber-200/60">忠诚度: </span>
                            <span className={`font-bold ${general.loyalty < 30 ? 'text-green-400' : general.loyalty < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {general.loyalty}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 关押信息 */}
                      <div className="bg-stone-800/40 rounded p-4 border border-amber-900/20">
                        <h4 className="text-sm font-semibold text-amber-100 mb-3">关押信息</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-amber-200/60">关押城市</span>
                            <span className="text-amber-100">{city?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-200/60">被俘回合</span>
                            <span className="text-amber-100">{selectedCaptive.capturedTurn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-200/60">关押时长</span>
                            <span className="text-amber-100">{selectedCaptive.loyaltyDrop}回合</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-200/60">招降尝试</span>
                            <span className="text-amber-100">{selectedCaptive.persuasionAttempts}次</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-200/60">招降成功率</span>
                            <span className="text-green-400 font-bold">
                              {Math.round(calculatePersuasionRate(selectedCaptive) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handlePersuade(selectedCaptive)}
                          disabled={persuading}
                          className={`w-full py-2 rounded font-medium transition-all ${
                            persuading
                              ? 'bg-stone-700/50 text-stone-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-900/80 to-green-800/80 hover:from-green-800/90 hover:to-green-700/90 text-white border border-green-600/40'
                          }`}
                          style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
                        >
                          {persuading ? '招降中...' : '招降'}
                        </button>
                        
                        <button
                          onClick={() => handleRelease(selectedCaptive)}
                          className="w-full py-2 rounded font-medium bg-gradient-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800/90 hover:to-blue-700/90 text-white border border-blue-600/40 transition-all"
                          style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
                        >
                          释放
                        </button>
                        
                        <button
                          onClick={() => handleExecute(selectedCaptive)}
                          className="w-full py-2 rounded font-medium bg-gradient-to-r from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 text-white border border-red-600/40 transition-all"
                          style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
                        >
                          处决
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
