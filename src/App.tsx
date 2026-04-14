import { useState } from 'react';
import { MainMenu } from './components/UI/MainMenu';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');

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
        <div className="min-h-screen bg-gray-900 text-white">
          <header className="bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-center">
                三国志3 - 网页版
              </h1>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="border-4 border-dashed border-gray-700 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4">游戏主界面</h2>
                  <p className="text-gray-400 mb-6">正在开发中...</p>
                  <button
                    onClick={() => setGameState('menu')}
                    className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    返回主菜单
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default App
