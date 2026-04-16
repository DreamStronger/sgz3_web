import { useState } from 'react';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
}

export function MainMenu({ onStartGame, onLoadGame, onSettings }: MainMenuProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const scenarios = [
    { id: 'yellow_turban', name: '黄巾之乱', year: 184, description: '黄巾军起义，群雄并起', difficulty: '初级' },
    { id: 'warlords', name: '群雄割据', year: 190, description: '董卓乱政，诸侯讨伐', difficulty: '中级' },
    { id: 'guandu', name: '官渡之战', year: 200, description: '曹操vs袁绍，北方争霸', difficulty: '高级' },
    { id: 'three_kingdoms', name: '三足鼎立', year: 220, description: '魏蜀吴三国鼎立', difficulty: '专家' },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-stone-950 via-amber-950/30 to-stone-950 flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-9xl text-amber-500/20">魏</div>
        <div className="absolute top-1/3 right-20 text-8xl text-red-500/20">蜀</div>
        <div className="absolute bottom-20 left-1/4 text-9xl text-blue-500/20">吴</div>
        <div className="absolute bottom-1/3 right-1/3 text-7xl text-amber-500/20">汉</div>
      </div>

      <div className="max-w-5xl w-full mx-4 relative z-10">
        {/* 标题 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 mb-4 tracking-widest">
              三国志
            </h1>
            <div className="absolute -top-2 -right-2 text-3xl text-amber-500/60">三</div>
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
            <p className="text-xl text-amber-400/80 tracking-widest">网页复刻版</p>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
          </div>
          <p className="text-sm text-amber-500/50 mt-2">SANGUOZHI 3 REMAKE</p>
        </div>

        {/* 剧本选择 */}
        {selectedScenario === null ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-amber-200 text-center mb-8 tracking-wider">
              ⚔️ 选择剧本 ⚔️
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className="group relative bg-gradient-to-br from-stone-900/80 to-stone-800/80 hover:from-amber-950/80 hover:to-amber-900/60 border-2 border-amber-700/30 hover:border-amber-500/60 rounded-lg p-6 text-left transition-all duration-300 shadow-xl hover:shadow-amber-900/50"
                >
                  {/* 装饰角标 */}
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-600/20 to-transparent transform rotate-45 translate-x-8 -translate-y-8"></div>
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl font-bold text-amber-100 group-hover:text-amber-50 transition-colors">
                      {scenario.name}
                    </h3>
                    <span className="text-amber-400/70 text-sm bg-amber-900/30 px-2 py-1 rounded">
                      {scenario.year}年
                    </span>
                  </div>
                  
                  <p className="text-amber-300/60 mb-3">{scenario.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-amber-500/50">难度：{scenario.difficulty}</span>
                    <span className="text-amber-400/50 group-hover:text-amber-300 transition-colors text-sm">
                      点击选择 →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-stone-900/90 to-stone-800/90 border-2 border-amber-700/40 rounded-lg p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold text-amber-100">
                  {scenarios.find(s => s.id === selectedScenario)?.name}
                </h3>
                <span className="text-amber-400/70 bg-amber-900/30 px-3 py-1 rounded">
                  {scenarios.find(s => s.id === selectedScenario)?.year}年
                </span>
              </div>
              
              <p className="text-amber-300/70 mb-6 text-lg">
                {scenarios.find(s => s.id === selectedScenario)?.description}
              </p>

              <div className="bg-stone-900/50 border border-amber-700/20 rounded p-4 mb-6">
                <h4 className="text-amber-200 font-semibold mb-2">剧本说明</h4>
                <ul className="text-sm text-amber-300/60 space-y-1">
                  <li>• 选择势力开始游戏</li>
                  <li>• 发展内政，招募武将</li>
                  <li>• 扩张领土，统一天下</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={onStartGame}
                  className="w-full bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-600/30 text-lg tracking-wider"
                >
                  ⚔️ 开始游戏
                </button>
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="w-full bg-gradient-to-br from-stone-800/80 to-stone-700/80 hover:from-stone-700/90 hover:to-stone-600/90 text-amber-200 font-semibold py-3 px-6 rounded-lg transition-all border border-amber-700/30"
                >
                  返回选择剧本
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="mt-10 flex justify-center space-x-6">
          <button
            onClick={onLoadGame}
            className="bg-gradient-to-br from-stone-800/80 to-stone-700/80 hover:from-amber-900/80 hover:to-amber-800/80 text-amber-200 hover:text-amber-100 font-semibold py-3 px-8 rounded-lg transition-all border border-amber-700/30 hover:border-amber-500/50 shadow-lg"
          >
            📂 加载存档
          </button>
          <button
            onClick={onSettings}
            className="bg-gradient-to-br from-stone-800/80 to-stone-700/80 hover:from-amber-900/80 hover:to-amber-800/80 text-amber-200 hover:text-amber-100 font-semibold py-3 px-8 rounded-lg transition-all border border-amber-700/30 hover:border-amber-500/50 shadow-lg"
          >
            ⚙️ 游戏设置
          </button>
        </div>

        {/* 版本信息 */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-700/30"></div>
            <p className="text-amber-600/40 text-sm">Version 1.0.0</p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-700/30"></div>
          </div>
          <p className="text-amber-500/30 text-xs">基于经典游戏《三国志3》完整复刻</p>
        </div>
      </div>

      {/* 装饰边框 */}
      <div className="absolute inset-0 pointer-events-none border-4 border-amber-900/10 m-4 rounded-lg"></div>
    </div>
  );
}
