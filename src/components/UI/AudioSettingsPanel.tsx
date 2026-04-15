import { useState, useEffect } from 'react';
import { AudioSystem, AudioConfig, SoundType } from '@/systems/audio/AudioSystem';

interface AudioSettingsPanelProps {
  onClose: () => void;
}

export function AudioSettingsPanel({ onClose }: AudioSettingsPanelProps) {
  const [config, setConfig] = useState<AudioConfig>(AudioSystem.getConfig());

  useEffect(() => {
    // 恢复音频上下文
    AudioSystem.resumeContext();
  }, []);

  const handleMasterVolumeChange = (value: number) => {
    AudioSystem.setMasterVolume(value);
    setConfig(AudioSystem.getConfig());
  };

  const handleMusicVolumeChange = (value: number) => {
    AudioSystem.setMusicVolume(value);
    setConfig(AudioSystem.getConfig());
  };

  const handleSoundVolumeChange = (value: number) => {
    AudioSystem.setSoundVolume(value);
    setConfig(AudioSystem.getConfig());
  };

  const handleMusicToggle = () => {
    AudioSystem.toggleMusic();
    setConfig(AudioSystem.getConfig());
  };

  const handleSoundToggle = () => {
    AudioSystem.toggleSound();
    setConfig(AudioSystem.getConfig());
  };

  const playTestSound = () => {
    AudioSystem.resumeContext();
    if (config.soundEnabled) {
      AudioSystem.playSound(SoundType.UI_CLICK);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div 
        className="bg-gradient-to-br from-amber-950/95 to-stone-900/95 rounded-lg border-2 border-amber-600/50 shadow-2xl w-[500px]"
        style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
      >
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/80 px-6 py-3 border-b border-amber-600/40 flex justify-between items-center">
          <h2 className="text-xl text-amber-100 font-bold flex items-center space-x-2">
            <span>🎵</span>
            <span>音频设置</span>
          </h2>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 设置内容 */}
        <div className="p-6 space-y-6">
          {/* 主音量 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-amber-200 font-medium">主音量</label>
              <span className="text-amber-100">{Math.round(config.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.masterVolume}
              onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* 音乐音量 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-amber-200 font-medium flex items-center space-x-2">
                <span>背景音乐</span>
                <button
                  onClick={handleMusicToggle}
                  className={`text-xs px-2 py-1 rounded ${
                    config.musicEnabled
                      ? 'bg-green-900/50 text-green-300 border border-green-600/40'
                      : 'bg-red-900/50 text-red-300 border border-red-600/40'
                  }`}
                >
                  {config.musicEnabled ? '开启' : '关闭'}
                </button>
              </label>
              <span className="text-amber-100">{Math.round(config.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.musicVolume}
              onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
              disabled={!config.musicEnabled}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                config.musicEnabled ? 'bg-stone-700' : 'bg-stone-800 opacity-50'
              }`}
            />
          </div>

          {/* 音效音量 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-amber-200 font-medium flex items-center space-x-2">
                <span>游戏音效</span>
                <button
                  onClick={handleSoundToggle}
                  className={`text-xs px-2 py-1 rounded ${
                    config.soundEnabled
                      ? 'bg-green-900/50 text-green-300 border border-green-600/40'
                      : 'bg-red-900/50 text-red-300 border border-red-600/40'
                  }`}
                >
                  {config.soundEnabled ? '开启' : '关闭'}
                </button>
              </label>
              <span className="text-amber-100">{Math.round(config.soundVolume * 100)}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.soundVolume}
                onChange={(e) => handleSoundVolumeChange(parseFloat(e.target.value))}
                disabled={!config.soundEnabled}
                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                  config.soundEnabled ? 'bg-stone-700' : 'bg-stone-800 opacity-50'
                }`}
              />
              <button
                onClick={playTestSound}
                disabled={!config.soundEnabled}
                className={`px-3 py-1 rounded text-xs ${
                  config.soundEnabled
                    ? 'bg-amber-900/50 hover:bg-amber-800/60 text-amber-200 border border-amber-600/40'
                    : 'bg-stone-800/50 text-stone-500 border border-stone-600/30 cursor-not-allowed'
                }`}
              >
                🔊 测试
              </button>
            </div>
          </div>

          {/* 音效说明 */}
          <div className="bg-stone-900/50 rounded-lg p-4 border border-amber-600/20">
            <h3 className="text-amber-300 font-medium mb-2">音效说明</h3>
            <ul className="text-xs text-amber-400/70 space-y-1">
              <li>• UI交互：按钮点击、悬停、成功/失败提示</li>
              <li>• 游戏流程：回合切换、季节变化</li>
              <li>• 内政：城市发展、征兵、收税</li>
              <li>• 战争：战斗开始、攻击、胜利、失败</li>
              <li>• 武将：招募、升级、阵亡</li>
              <li>• 外交：结盟、宣战、和谈</li>
              <li>• 事件：灾害、吉祥、历史事件</li>
            </ul>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-amber-600/30 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gradient-to-br from-amber-900/80 to-amber-800/80 hover:from-amber-800/90 hover:to-amber-700/90 px-6 py-2 rounded-lg text-sm font-medium transition-all border border-amber-600/40"
          >
            确定
          </button>
        </div>
      </div>

      {/* 自定义滑块样式 */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d97706, #b45309);
          cursor: pointer;
          border: 2px solid #fbbf24;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d97706, #b45309);
          cursor: pointer;
          border: 2px solid #fbbf24;
        }
      `}</style>
    </div>
  );
}
