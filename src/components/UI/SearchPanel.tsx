import { useState } from 'react';
import { useGameStore } from '@/store';
import { useDialogStore } from '@/store/dialogStore';
import { SearchSystem } from '@/systems/search/SearchSystem';

interface SearchPanelProps {
  cityId: string;
  onClose: () => void;
}

export function SearchPanel({ cityId, onClose }: SearchPanelProps) {
  const { generals, cities, factions, currentPlayer, executeSearch } = useGameStore();
  const { showAlert, showConfirm } = useDialogStore();
  
  const [selectedGeneral, setSelectedGeneral] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  
  const city = cities[cityId];
  const faction = factions[currentPlayer];
  
  if (!city || !faction) return null;
  
  // 获取该城市的武将
  const cityGenerals = city.generals
    .map(id => generals[id])
    .filter(g => g && g.status === 'active');
  
  // 处理搜索
  const handleSearch = async () => {
    if (!selectedGeneral) {
      showAlert('请选择执行搜索的武将', '提示');
      return;
    }
    
    const general = generals[selectedGeneral];
    if (!general) return;
    
    // 计算搜索消耗
    const cost = SearchSystem.calculateSearchCost(general, city);
    
    // 确认搜索
    const confirmed = await showConfirm(
      `确定要在${city.name}执行搜索吗？\n\n消耗：${cost.money}金`,
      '确认搜索'
    );
    
    if (!confirmed) return;
    
    setSearching(true);
    
    // 执行搜索
    const result = executeSearch(selectedGeneral, cityId);
    
    setLastResult(result.message);
    setSearching(false);
    
    // 显示结果
    if (result.type === 'item') {
      showAlert(result.message, '发现宝物！');
    } else if (result.type === 'general') {
      showAlert(result.message, '发现人才！');
    } else if (result.type === 'intel') {
      showAlert(result.message, '获得情报');
    } else {
      showAlert(result.message, '搜索结果');
    }
  };
  
  // 计算搜索成功率
  const calculateSuccessRate = () => {
    if (!selectedGeneral) return null;
    
    const general = generals[selectedGeneral];
    if (!general) return null;
    
    // 简化的成功率计算（实际在SearchSystem中）
    let rate = 30;
    rate += general.attributes.intelligence / 2;
    rate += city.stats.development / 2;
    
    return Math.min(80, rate);
  };
  
  const successRate = calculateSuccessRate();
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
      <div className="bg-gradient-to-br from-amber-950/95 to-stone-900/95 rounded-lg shadow-2xl border-2 border-amber-600/50 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/80 px-6 py-4 border-b border-amber-600/40 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-100">
            在 {city.name} 搜索
          </h2>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-amber-100 text-2xl"
          >
            ✕
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 城市信息 */}
          <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-600/30">
            <h3 className="text-lg font-bold text-amber-100 mb-3">城市信息</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-200/70">开发度</span>
                <span className="text-amber-100">{city.stats.development}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/70">商业度</span>
                <span className="text-amber-100">{city.stats.commerce}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/70">民心</span>
                <span className="text-amber-100">{city.stats.morale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-200/70">驻守武将</span>
                <span className="text-amber-100">{city.generals.length}人</span>
              </div>
            </div>
          </div>
          
          {/* 选择武将 */}
          <div>
            <h3 className="text-lg font-bold text-amber-100 mb-3">选择执行武将</h3>
            {cityGenerals.length === 0 ? (
              <p className="text-amber-200/60 text-center py-4">该城市没有可用武将</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {cityGenerals.map(general => (
                  <button
                    key={general.id}
                    onClick={() => setSelectedGeneral(general.id)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedGeneral === general.id
                        ? 'bg-amber-700/50 border-amber-500'
                        : 'bg-amber-900/20 border-amber-600/30 hover:bg-amber-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-amber-100">{general.name}</h4>
                        <p className="text-sm text-amber-200/70">
                          智力: {general.attributes.intelligence} · 
                          政治: {general.attributes.politics}
                        </p>
                      </div>
                      {selectedGeneral === general.id && (
                        <span className="text-amber-400 text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 搜索信息 */}
          {selectedGeneral && (
            <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-600/30">
              <h3 className="text-lg font-bold text-amber-100 mb-3">搜索信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-200/70">预计成功率</span>
                  <span className={`font-bold ${successRate && successRate >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {successRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-200/70">消耗金钱</span>
                  <span className="text-amber-100">
                    {SearchSystem.calculateSearchCost(generals[selectedGeneral], city).money}金
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-200/70">当前金钱</span>
                  <span className={`font-bold ${faction.resources.money >= SearchSystem.calculateSearchCost(generals[selectedGeneral], city).money ? 'text-green-400' : 'text-red-400'}`}>
                    {faction.resources.money}金
                  </span>
                </div>
              </div>
              
              {/* 成功率进度条 */}
              <div className="mt-3">
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      successRate && successRate >= 50 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 上次搜索结果 */}
          {lastResult && (
            <div className="bg-amber-900/30 rounded-lg p-4 border border-amber-600/30">
              <h3 className="text-lg font-bold text-amber-100 mb-2">上次搜索结果</h3>
              <p className="text-amber-200/80">{lastResult}</p>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              disabled={!selectedGeneral || searching}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${
                !selectedGeneral || searching
                  ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 border border-amber-500'
              }`}
            >
              {searching ? '搜索中...' : '执行搜索'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-bold text-lg bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
            >
              关闭
            </button>
          </div>
          
          {/* 提示信息 */}
          <div className="text-xs text-amber-200/50 space-y-1">
            <p>• 武将智力越高，搜索成功率越高</p>
            <p>• 城市开发度越高，发现宝物的概率越高</p>
            <p>• 搜索可能发现：宝物、人才、情报</p>
          </div>
        </div>
      </div>
    </div>
  );
}
