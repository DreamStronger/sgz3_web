import { useState } from 'react';

interface MainMenuProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
}

export function MainMenu({ onStartGame, onLoadGame, onSettings }: MainMenuProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const scenarios = [
    { id: 'yellow_turban', name: '黄巾之乱', year: 184, description: '黄巾军起义，群雄并起' },
    { id: 'warlords', name: '群雄割据', year: 190, description: '董卓乱政，诸侯讨伐' },
    { id: 'guandu', name: '官渡之战', year: 200, description: '曹操vs袁绍，北方争霸' },
    { id: 'three_kingdoms', name: '三足鼎立', year: 220, description: '魏蜀吴三国鼎立' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-4">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 font-pixel">
            三国志3
          </h1>
          <p className="text-2xl text-gray-400 font-pixel">网页版</p>
        </div>

        {/* 剧本选择 */}
        {selectedScenario === null ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              选择剧本
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 rounded-lg p-6 text-left transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-white">
                      {scenario.name}
                    </h3>
                    <span className="text-gray-400 text-sm">
                      {scenario.year}年
                    </span>
                  </div>
                  <p className="text-gray-400">{scenario.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {scenarios.find(s => s.id === selectedScenario)?.name}
              </h3>
              <p className="text-gray-400 mb-4">
                {scenarios.find(s => s.id === selectedScenario)?.description}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={onStartGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  开始游戏
                </button>
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  返回选择剧本
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={onLoadGame}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            加载存档
          </button>
          <button
            onClick={onSettings}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            游戏设置
          </button>
        </div>

        {/* 版本信息 */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>版本: v1.0.0</p>
          <p>基于三国志3完整复刻</p>
        </div>
      </div>
    </div>
  );
}
