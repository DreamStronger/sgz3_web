import { useState, useEffect } from 'react';
import { EventLogSystem, GameEvent } from '@/systems/eventLog/EventLogSystem';

interface EventLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventLogPanel({ isOpen, onClose }: EventLogPanelProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    // 初始化加载事件
    setEvents(EventLogSystem.getRecentEvents(50));

    // 添加监听器
    const unsubscribe = EventLogSystem.addListener((newEvents) => {
      setEvents(newEvents.slice(0, 50));
    });

    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div 
        className="bg-gradient-to-br from-amber-950/95 to-stone-900/95 rounded-lg border-2 border-amber-600/50 shadow-2xl w-[600px] max-h-[80vh] overflow-hidden"
        style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}
      >
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/80 px-6 py-3 border-b border-amber-600/40 flex justify-between items-center">
          <h2 className="text-xl text-amber-100 font-bold flex items-center space-x-2">
            <span>📜 事件日志</span>
          </h2>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 事件列表 */}
        <div className="p-4 overflow-y-auto max-h-[65vh]">
          {events.length === 0 ? (
            <div className="text-center py-8 text-amber-400/60">
              <div className="text-4xl mb-2">📜</div>
              <div>暂无事件记录</div>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`bg-stone-900/50 border rounded-lg p-3 transition-all hover:bg-stone-800/50 ${
                    event.type === 'error' ? 'border-red-600/40' :
                    event.type === 'warning' ? 'border-yellow-600/40' :
                    event.type === 'success' ? 'border-green-600/40' :
                    event.type === 'battle' ? 'border-orange-600/40' :
                    event.type === 'diplomacy' ? 'border-purple-600/40' :
                    event.type === 'economy' ? 'border-amber-600/40' :
                    'border-amber-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{EventLogSystem.getEventIcon(event.type)}</span>
                      <span className={`font-semibold ${EventLogSystem.getEventColor(event.type)}`}>
                        {event.message}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-amber-400/60">
                      <span>回合 {event.turn}</span>
                      <span>{formatTime(event.timestamp)}</span>
                    </div>
                  </div>
                  {event.details && (
                    <div className="text-sm text-amber-300/70 mt-1 pl-7">
                      {event.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-3 border-t border-amber-600/30 flex justify-between items-center">
          <div className="text-amber-400/60 text-sm">
            共 {events.length} 条事件记录
          </div>
          <button
            onClick={() => {
              EventLogSystem.clearEvents();
              setEvents([]);
            }}
            className="bg-gradient-to-br from-red-900/80 to-red-800/80 hover:from-red-800/90 hover:to-red-700/90 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-red-600/40"
          >
            🗑️ 清空日志
          </button>
        </div>
      </div>
    </div>
  );
}

// 迷你事件日志组件（显示在主界面）
export function MiniEventLog() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setEvents(EventLogSystem.getRecentEvents(5));
    const unsubscribe = EventLogSystem.addListener((newEvents) => {
      setEvents(newEvents.slice(0, 5));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg border-2 border-amber-800/40 shadow-xl backdrop-blur-sm">
      <div className="px-3 py-2 border-b border-amber-800/30 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-amber-100" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
          📜 最近事件
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          {isExpanded ? '收起' : '展开'}
        </button>
      </div>
      <div className={`p-2 space-y-1 overflow-y-auto ${isExpanded ? 'max-h-40' : 'max-h-20'}`}>
        {events.length === 0 ? (
          <div className="text-xs text-amber-400/50 text-center py-2">暂无事件</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center space-x-2 text-xs">
              <span>{EventLogSystem.getEventIcon(event.type)}</span>
              <span className={`${EventLogSystem.getEventColor(event.type)} truncate`}>
                {event.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}