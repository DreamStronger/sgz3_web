import { useState, useEffect } from 'react';
import { MainMenu } from './components/UI/MainMenu';
import { CityInfo } from './components/UI/CityInfo';
import { GameMap } from './components/Map/GameMap';
import { useGameStore } from './store';
import type { City, Faction, General } from './types';
import citiesData from './data/cities/yellow_turban.json';
import generalsData from './data/generals/yellow_turban.json';
import factionsData from './data/factions.json';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [showGeneralsModal, setShowGeneralsModal] = useState(false);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const { 
    turn, 
    season, 
    factions, 
    cities, 
    generals,
    currentPlayer,
    loadGame,
    nextTurn 
  } = useGameStore();

  // 加载游戏数据
  useEffect(() => {
    if (gameState === 'playing') {
      // 初始化游戏数据
      const citiesRecord: Record<string, City> = {};
      (citiesData as City[]).forEach(city => {
        citiesRecord[city.id] = { ...city, faction: '', generals: [] };
      });

      const generalsRecord: Record<string, General> = {};
      (generalsData as General[]).forEach(general => {
        generalsRecord[general.id] = general;
      });

      const factionsRecord: Record<string, Faction> = {};
      (factionsData as Faction[]).forEach(faction => {
        factionsRecord[faction.id] = faction;
        // 设置城市的所属势力
        faction.cities.forEach(cityId => {
          if (citiesRecord[cityId]) {
            citiesRecord[cityId].faction = faction.id;
          }
        });
        // 设置武将所在城市
        faction.generals.forEach(generalId => {
          const general = generalsRecord[generalId];
          if (general && citiesRecord[general.location]) {
            citiesRecord[general.location].generals.push(generalId);
          }
        });
      });

      loadGame({
        turn: 1,
        season: 'spring',
        scenario: 'yellow_turban',
        factions: factionsRecord,
        cities: citiesRecord,
        generals: generalsRecord,
        items: {},
        armies: {},
        currentPlayer: 'han'
      });
    }
  }, [gameState, loadGame]);

  const handleStartGame = () => {
    console.log('开始游戏');
    setGameState('playing');
  };

  const handleLoadGame = () => {
    console.log('加载存档');
    // TODO: 实现存档加载逻辑
  };

  const handleSettings = () => {
    console.log('游戏设置');
    // TODO: 实现设置界面
  };

  const handleNextTurn = () => {
    nextTurn();
    console.log(`回合 ${turn} -> ${turn + 1}`);
  };

  const getSeasonText = (season: string) => {
    const seasonMap = {
      spring: '春',
      summer: '夏',
      autumn: '秋',
      winter: '冬'
    };
    return seasonMap[season as keyof typeof seasonMap] || '春';
  };

  const currentPlayerFaction = factions[currentPlayer];
  const playerGenerals = currentPlayerFaction?.generals.map(id => generals[id]).filter(Boolean) || [];
  const playerCities = currentPlayerFaction?.cities.map(id => cities[id]).filter(Boolean) || [];

  return (
    <>
      {gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onLoadGame={handleLoadGame}
          onSettings={handleSettings}
        />
      )}
      
      {gameState === 'playing' && (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white flex flex-col">
          {/* 顶部状态栏 */}
          <header className="bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-amber-950/80 shadow-2xl border-b-2 border-amber-800/50 backdrop-blur-sm">
            <div className="py-3 px-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>三国志3 - 网页版</h1>
                <span className="text-amber-600/60">|</span>
                <span className="text-sm text-amber-200/80">剧本: 黄巾之乱</span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-sm bg-stone-800/80 px-3 py-1 rounded border border-amber-700/30">
                  回合: {turn}
                </span>
                <span className="text-sm bg-stone-800/80 px-3 py-1 rounded border border-amber-700/30">
                  季节: {getSeasonText(season)}
                </span>
                <button
                  onClick={handleNextTurn}
                  className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 px-4 py-1 rounded text-sm font-medium transition-all shadow-lg border border-amber-500/30"
                >
                  下一回合
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-stone-800/80 hover:bg-stone-700/80 px-3 py-1 rounded text-sm transition-colors border border-amber-700/30"
                >
                  返回
                </button>
              </div>
            </div>
          </header>
          
          {/* 主游戏区域 */}
          <main className="flex py-4 px-6 gap-4" style={{ height: 'calc(100vh - 56px - 60px)' }}>
            {/* 左侧信息面板 - 整体可滚动，隐藏滚动条 */}
            <div className="w-80 flex flex-col gap-3 flex-shrink-0 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* 势力信息 */}
              <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg p-3 border-2 border-amber-800/40 shadow-xl backdrop-blur-sm">
                <h2 className="text-base font-semibold mb-2 flex items-center" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                  <span 
                    className="w-3 h-3 rounded-full mr-2 shadow-lg"
                    style={{ backgroundColor: currentPlayerFaction?.color || '#DAA520' }}
                  />
                  {currentPlayerFaction?.name || '汉室'}
                </h2>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-200/60">君主:</span>
                    <span className="text-amber-100">{generals[currentPlayerFaction?.ruler || '']?.name || '何进'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/60">金钱:</span>
                    <span className="text-yellow-400 font-medium">{currentPlayerFaction?.resources.money || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/60">粮草:</span>
                    <span className="text-green-400 font-medium">{currentPlayerFaction?.resources.food || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/60">兵力:</span>
                    <span className="text-red-400 font-medium">{currentPlayerFaction?.resources.soldiers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/60">城市:</span>
                    <span className="text-amber-100">{playerCities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200/60">武将:</span>
                    <span className="text-amber-100">{playerGenerals.length}</span>
                  </div>
                </div>
              </div>

              {/* 城市详情 */}
              <CityInfo />

              {/* 武将列表 */}
              <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg p-3 border-2 border-amber-800/40 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-base font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>武将列表</h2>
                  {playerGenerals.length > 3 && (
                    <button 
                      onClick={() => setShowGeneralsModal(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      查看全部 ({playerGenerals.length})
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {playerGenerals.slice(0, 3).map(general => (
                    <div 
                      key={general.id}
                      className="bg-stone-800/60 rounded p-2 flex items-center justify-between hover:bg-stone-700/60 transition-colors cursor-pointer border border-amber-900/20"
                    >
                      <div>
                        <span className="font-medium text-amber-100 text-sm">{general.name}</span>
                        <span className="text-xs text-amber-200/50 ml-2">
                          {general.location && cities[general.location]?.name}
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/60">
                        统{general.attributes.command} 武{general.attributes.force}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 城市列表 */}
              <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg p-3 border-2 border-amber-800/40 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-base font-semibold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>城市列表</h2>
                  {playerCities.length > 3 && (
                    <button 
                      onClick={() => setShowCitiesModal(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      查看全部 ({playerCities.length})
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {playerCities.slice(0, 3).map(city => (
                    <div 
                      key={city.id}
                      className="bg-stone-800/60 rounded p-2 hover:bg-stone-700/60 transition-colors cursor-pointer border border-amber-900/20"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-amber-100 text-sm">{city.name}</span>
                        <span className="text-xs text-amber-200/50">
                          {city.terrain === 'plain' ? '平原' : 
                           city.terrain === 'mountain' ? '山地' : 
                           city.terrain === 'water' ? '水域' : '关隘'}
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/60 mt-1">
                        兵{city.resources.soldiers} | 防{city.stats.defense}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧地图区域 */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg p-2 border-2 border-amber-800/40 shadow-xl backdrop-blur-sm h-full flex flex-col">
                <h2 className="text-lg font-semibold mb-2 px-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>地图</h2>
                <div className="flex-1 flex items-center justify-center">
                  <GameMap 
                    cities={Object.values(cities)}
                  />
                </div>
              </div>
            </div>
          </main>

          {/* 底部悬浮导航栏 */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-amber-950/95 border-t-2 border-amber-800/50 backdrop-blur-md shadow-2xl z-50">
            <div className="py-3 px-6 flex items-center justify-center space-x-3">
              <button className="bg-gradient-to-br from-blue-900/80 to-blue-800/80 hover:from-blue-800/90 hover:to-blue-700/90 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg border border-blue-600/40 flex items-center space-x-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                <span>🏛️</span>
                <span>内政</span>
              </button>
              <button className="bg-gradient-to-br from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg border border-red-600/40 flex items-center space-x-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                <span>⚔️</span>
                <span>军事</span>
              </button>
              <button className="bg-gradient-to-br from-green-900/80 to-green-800/80 hover:from-green-800/90 hover:to-green-700/90 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg border border-green-600/40 flex items-center space-x-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                <span>🤝</span>
                <span>外交</span>
              </button>
              <button className="bg-gradient-to-br from-purple-900/80 to-purple-800/80 hover:from-purple-800/90 hover:to-purple-700/90 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg border border-purple-600/40 flex items-center space-x-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                <span>👤</span>
                <span>武将</span>
              </button>
              <button className="bg-gradient-to-br from-stone-800/80 to-stone-700/80 hover:from-stone-700/90 hover:to-stone-600/90 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg border border-stone-600/40 flex items-center space-x-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
                <span>⚙️</span>
                <span>系统</span>
              </button>
            </div>
          </div>

          {/* 武将列表对话框 */}
          {showGeneralsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/80"></div>
              <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
                  <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>武将列表</h2>
                  <button 
                    onClick={() => setShowGeneralsModal(false)}
                    className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {playerGenerals.map(general => (
                      <div 
                        key={general.id}
                        className="bg-stone-800/60 rounded p-3 hover:bg-stone-700/60 transition-colors cursor-pointer border border-amber-900/20"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-amber-100">{general.name}</span>
                          <span className="text-xs text-amber-200/50">
                            {general.location && cities[general.location]?.name}
                          </span>
                        </div>
                        <div className="text-xs text-amber-200/60 space-y-1">
                          <div>统{general.attributes.command} 武{general.attributes.force} 智{general.attributes.intelligence} 政{general.attributes.politics}</div>
                          <div className="text-amber-300/80">{general.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 城市列表对话框 */}
          {showCitiesModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/80"></div>
              <div className="relative bg-gradient-to-br from-stone-900 to-stone-950 rounded-lg border-2 border-amber-800/50 shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-amber-800/30">
                  <h2 className="text-xl font-bold" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>城市列表</h2>
                  <button 
                    onClick={() => setShowCitiesModal(false)}
                    className="text-amber-400 hover:text-amber-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-amber-900/30 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {playerCities.map(city => (
                      <div 
                        key={city.id}
                        className="bg-stone-800/60 rounded p-3 hover:bg-stone-700/60 transition-colors cursor-pointer border border-amber-900/20"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-amber-100">{city.name}</span>
                          <span className="text-xs text-amber-200/50">
                            {city.terrain === 'plain' ? '平原' : 
                             city.terrain === 'mountain' ? '山地' : 
                             city.terrain === 'water' ? '水域' : '关隘'}
                          </span>
                        </div>
                        <div className="text-xs text-amber-200/60 space-y-1">
                          <div>兵{city.resources.soldiers} | 防{city.stats.defense}</div>
                          <div>金{city.resources.money} | 粮{city.resources.food}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App