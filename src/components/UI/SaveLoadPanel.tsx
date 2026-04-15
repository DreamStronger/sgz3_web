import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store';
import { SaveSystem, SaveSlot, SaveMetadata } from '@/systems/save/SaveSystem';

interface SaveLoadPanelProps {
  mode: 'save' | 'load';
  onClose: () => void;
}

export function SaveLoadPanel({ mode, onClose }: SaveLoadPanelProps) {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    currentPlayer,
    turn,
    season,
    weather,
    scenario,
    factions,
    cities,
    generals,
    items,
    armies,
    battles,
    captives,
    loadGame
  } = useGameStore();

  // 加载存档槽位
  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = () => {
    const saveSlots = SaveSystem.getSaveSlots();
    setSlots(saveSlots);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 保存游戏
  const handleSave = () => {
    if (!selectedSlot) {
      setMessage({ type: 'error', text: '请选择存档槽位' });
      return;
    }

    if (!saveName.trim()) {
      setMessage({ type: 'error', text: '请输入存档名称' });
      return;
    }

    const gameState = {
      turn,
      season,
      weather,
      scenario,
      factions,
      cities,
      generals,
      items,
      armies,
      battles,
      captives,
      currentPlayer: currentPlayer || ''
    };

    const success = SaveSystem.saveGame(selectedSlot, saveName, gameState, currentPlayer || '');

    if (success) {
      setMessage({ type: 'success', text: '存档成功！' });
      loadSlots();
      setSaveName('');
      setSelectedSlot(null);
    } else {
      setMessage({ type: 'error', text: '存档失败，请重试' });
    }
  };

  // 读取游戏
  const handleLoad = () => {
    if (!selectedSlot) {
      setMessage({ type: 'error', text: '请选择要读取的存档' });
      return;
    }

    const gameState = SaveSystem.loadGame(selectedSlot);

    if (gameState) {
      loadGame(gameState);
      setMessage({ type: 'success', text: '读取成功！' });
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setMessage({ type: 'error', text: '读取失败，存档可能已损坏' });
    }
  };

  // 删除存档
  const handleDelete = (slotId: string) => {
    if (confirm('确定要删除这个存档吗？')) {
      const success = SaveSystem.deleteSave(slotId);
      if (success) {
        setMessage({ type: 'success', text: '删除成功' });
        loadSlots();
        if (selectedSlot === slotId) {
          setSelectedSlot(null);
        }
      } else {
        setMessage({ type: 'error', text: '删除失败' });
      }
    }
  };

  // 导出存档
  const handleExport = (slotId: string) => {
    const success = SaveSystem.downloadSave(slotId);
    if (success) {
      setMessage({ type: 'success', text: '导出成功' });
    } else {
      setMessage({ type: 'error', text: '导出失败' });
    }
  };

  // 导入存档
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await SaveSystem.loadSaveFromFile(file);
    if (success) {
      setMessage({ type: 'success', text: '导入成功' });
      loadSlots();
    } else {
      setMessage({ type: 'error', text: '导入失败，文件格式可能不正确' });
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 渲染存档信息
  const renderSlotInfo = (metadata: SaveMetadata) => (
    <div className="text-xs space-y-1">
      <div className="flex justify-between">
        <span className="text-amber-200">回合:</span>
        <span>{metadata.turn}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-amber-200">势力:</span>
        <span>{metadata.factionCount} 个</span>
      </div>
      <div className="flex justify-between">
        <span className="text-amber-200">城市:</span>
        <span>{metadata.cityCount} 座</span>
      </div>
      <div className="flex justify-between">
        <span className="text-amber-200">武将:</span>
        <span>{metadata.generalCount} 名</span>
      </div>
      <div className="text-amber-400/60 text-[10px] mt-2">
        {formatTime(metadata.timestamp)}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div 
        className="bg-gradient-to-br from-amber-950/95 to-stone-900/95 rounded-lg border-2 border-amber-600/50 shadow-2xl w-[800px] max-h-[85vh] overflow-hidden"
        style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
      >
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/80 px-6 py-3 border-b border-amber-600/40 flex justify-between items-center">
          <h2 className="text-xl text-amber-100 font-bold flex items-center space-x-2">
            <span>{mode === 'save' ? '💾 保存游戏' : '📂 读取游戏'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`px-6 py-2 text-center ${
            message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* 存档名称输入（保存模式） */}
        {mode === 'save' && (
          <div className="px-6 py-4 border-b border-amber-600/30">
            <div className="flex items-center space-x-4">
              <label className="text-amber-200">存档名称:</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="输入存档名称..."
                className="flex-1 bg-stone-900/50 border border-amber-600/40 rounded px-3 py-2 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-500"
                maxLength={20}
              />
            </div>
          </div>
        )}

        {/* 存档槽位列表 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => !slot.isEmpty || mode === 'save' ? setSelectedSlot(slot.id) : null}
                className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  selectedSlot === slot.id
                    ? 'border-amber-500 bg-amber-900/30 shadow-lg shadow-amber-500/20'
                    : slot.isEmpty && mode === 'load'
                    ? 'border-stone-700/50 bg-stone-900/30 opacity-50 cursor-not-allowed'
                    : 'border-amber-600/30 bg-stone-900/50 hover:border-amber-500/60 hover:bg-stone-800/50'
                }`}
              >
                {slot.isEmpty ? (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2 opacity-50">📂</div>
                    <div className="text-amber-400/60">空槽位</div>
                    {mode === 'save' && (
                      <div className="text-xs text-amber-400/40 mt-1">点击选择</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-amber-100 font-bold text-lg">
                        {slot.data!.metadata.name}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(slot.id);
                          }}
                          className="text-amber-400 hover:text-amber-300 text-xs px-2 py-1 rounded bg-amber-900/30 hover:bg-amber-800/40"
                        >
                          导出
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(slot.id);
                          }}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-800/40"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    {renderSlotInfo(slot.data!.metadata)}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-amber-600/30 flex justify-between items-center">
          <div className="flex space-x-3">
            {/* 导入按钮 */}
            <label className="cursor-pointer bg-gradient-to-br from-blue-900/80 to-blue-800/80 hover:from-blue-800/90 hover:to-blue-700/90 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-blue-600/40 flex items-center space-x-2">
              <span>📥</span>
              <span>导入存档</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {/* 存档大小 */}
            <div className="text-amber-400/60 text-sm flex items-center">
              总大小: {SaveSystem.formatSize(SaveSystem.getTotalSaveSize())}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="bg-gradient-to-br from-stone-700/80 to-stone-600/80 hover:from-stone-600/90 hover:to-stone-500/90 px-6 py-2 rounded-lg text-sm font-medium transition-all border border-stone-500/40"
            >
              取消
            </button>
            <button
              onClick={mode === 'save' ? handleSave : handleLoad}
              disabled={!selectedSlot || (mode === 'save' && !saveName.trim()) || (mode === 'load' && slots.find(s => s.id === selectedSlot)?.isEmpty)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all border flex items-center space-x-2 ${
                !selectedSlot || (mode === 'save' && !saveName.trim()) || (mode === 'load' && slots.find(s => s.id === selectedSlot)?.isEmpty)
                  ? 'bg-stone-800/50 border-stone-600/30 text-stone-500 cursor-not-allowed'
                  : mode === 'save'
                  ? 'bg-gradient-to-br from-green-900/80 to-green-800/80 hover:from-green-800/90 hover:to-green-700/90 border-green-600/40'
                  : 'bg-gradient-to-br from-blue-900/80 to-blue-800/80 hover:from-blue-800/90 hover:to-blue-700/90 border-blue-600/40'
              }`}
            >
              <span>{mode === 'save' ? '💾' : '📂'}</span>
              <span>{mode === 'save' ? '保存' : '读取'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
