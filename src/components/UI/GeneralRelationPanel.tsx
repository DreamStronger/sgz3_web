import { useState } from 'react';
import { useGameStore } from '@/store';
import type { General, GeneralRelation } from '@/types';

interface GeneralRelationPanelProps {
  generalId: string;
  onClose: () => void;
}

export function GeneralRelationPanel({ generalId, onClose }: GeneralRelationPanelProps) {
  const { generals, relations, factions } = useGameStore();
  const [selectedRelation, setSelectedRelation] = useState<GeneralRelation | null>(null);
  
  const general = generals[generalId];
  if (!general) return null;
  
  // 获取该武将的所有关系
  const generalRelations = relations.filter(
    r => r.general1 === generalId || r.general2 === generalId
  );
  
  // 获取关系类型的中文名称
  const getRelationTypeName = (type: GeneralRelation['type']) => {
    const names = {
      father: '父子',
      son: '父子',
      brother: '兄弟',
      friend: '朋友',
      enemy: '仇敌',
      former_lord: '旧主',
    };
    return names[type];
  };
  
  // 获取关系类型的颜色
  const getRelationTypeColor = (type: GeneralRelation['type']) => {
    const colors = {
      father: 'text-blue-400',
      son: 'text-blue-400',
      brother: 'text-green-400',
      friend: 'text-cyan-400',
      enemy: 'text-red-400',
      former_lord: 'text-yellow-400',
    };
    return colors[type];
  };
  
  // 获取亲密值对应的颜色
  const getIntimacyColor = (intimacy: number) => {
    if (intimacy >= 80) return 'text-green-400';
    if (intimacy >= 50) return 'text-cyan-400';
    if (intimacy >= 20) return 'text-yellow-400';
    if (intimacy >= 0) return 'text-gray-400';
    if (intimacy >= -50) return 'text-orange-400';
    return 'text-red-400';
  };
  
  // 获取另一个武将
  const getOtherGeneral = (relation: GeneralRelation) => {
    const otherId = relation.general1 === generalId ? relation.general2 : relation.general1;
    return generals[otherId];
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>
      <div className="bg-gradient-to-br from-amber-950/95 to-stone-900/95 rounded-lg shadow-2xl border-2 border-amber-600/50 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 标题 */}
        <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/80 px-6 py-4 border-b border-amber-600/40 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-100">
            {general.name} 的关系图谱
          </h2>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-amber-100 text-2xl"
          >
            ✕
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 武将信息 */}
          <div className="mb-6 bg-amber-900/30 rounded-lg p-4 border border-amber-600/30">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center text-3xl border-2 border-amber-500">
                {general.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-100">{general.name}</h3>
                <p className="text-amber-200/80">
                  {factions[general.faction]?.name || '在野'} · 
                  忠诚度: <span className={general.loyalty >= 70 ? 'text-green-400' : general.loyalty >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                    {general.loyalty}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* 关系列表 */}
          {generalRelations.length === 0 ? (
            <div className="text-center text-amber-200/60 py-12">
              <p className="text-lg">暂无关系数据</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generalRelations.map((relation, index) => {
                const otherGeneral = getOtherGeneral(relation);
                if (!otherGeneral) return null;
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedRelation(relation)}
                    className="bg-amber-900/20 hover:bg-amber-900/40 rounded-lg p-4 border border-amber-600/30 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-stone-700 to-stone-900 rounded-full flex items-center justify-center text-xl border border-stone-500">
                          {otherGeneral.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-amber-100">{otherGeneral.name}</h4>
                          <p className="text-sm text-amber-200/70">
                            {factions[otherGeneral.faction]?.name || '在野'}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${getRelationTypeColor(relation.type)}`}>
                        {getRelationTypeName(relation.type)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-200/60">亲密值</span>
                      <span className={`font-bold ${getIntimacyColor(relation.intimacy)}`}>
                        {relation.intimacy > 0 ? '+' : ''}{relation.intimacy}
                      </span>
                    </div>
                    
                    {/* 亲密值进度条 */}
                    <div className="mt-2 h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          relation.intimacy >= 50 ? 'bg-green-500' :
                          relation.intimacy >= 0 ? 'bg-cyan-500' :
                          relation.intimacy >= -50 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.abs(relation.intimacy)}%` }}
                      />
                    </div>
                    
                    {relation.history && (
                      <p className="mt-2 text-xs text-amber-200/50 italic">
                        {relation.history}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 关系详情 */}
          {selectedRelation && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60" onClick={() => setSelectedRelation(null)}>
              <div 
                className="bg-gradient-to-br from-amber-950/95 to-stone-900/95 rounded-lg shadow-2xl border-2 border-amber-600/50 max-w-md w-full mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-amber-100 mb-4">关系详情</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-amber-200/70">关系类型</span>
                    <span className={`font-bold ${getRelationTypeColor(selectedRelation.type)}`}>
                      {getRelationTypeName(selectedRelation.type)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-amber-200/70">亲密值</span>
                    <span className={`font-bold ${getIntimacyColor(selectedRelation.intimacy)}`}>
                      {selectedRelation.intimacy > 0 ? '+' : ''}{selectedRelation.intimacy}
                    </span>
                  </div>
                  
                  {selectedRelation.history && (
                    <div className="mt-4 pt-4 border-t border-amber-600/30">
                      <p className="text-amber-200/80">{selectedRelation.history}</p>
                    </div>
                  )}
                  
                  {/* 关系影响说明 */}
                  <div className="mt-4 pt-4 border-t border-amber-600/30">
                    <h4 className="text-sm font-bold text-amber-100 mb-2">关系影响</h4>
                    <ul className="text-sm text-amber-200/70 space-y-1">
                      {selectedRelation.type === 'father' || selectedRelation.type === 'son' ? (
                        <>
                          <li>• 同阵营时忠诚度 +10</li>
                          <li>• 敌对阵营时忠诚度 -20</li>
                          <li>• 战斗配合加成 +20%</li>
                        </>
                      ) : selectedRelation.type === 'brother' ? (
                        <>
                          <li>• 同阵营时忠诚度 +8</li>
                          <li>• 敌对阵营时忠诚度 -15</li>
                          <li>• 战斗配合加成 +15%</li>
                        </>
                      ) : selectedRelation.type === 'friend' ? (
                        <>
                          <li>• 同阵营时忠诚度 +5</li>
                          <li>• 敌对阵营时忠诚度 -10</li>
                          <li>• 战斗配合加成 +10%</li>
                        </>
                      ) : selectedRelation.type === 'enemy' ? (
                        <>
                          <li>• 同阵营时忠诚度 -5</li>
                          <li>• 战斗配合降低 -10%</li>
                          <li>• 更容易接受单挑</li>
                        </>
                      ) : selectedRelation.type === 'former_lord' ? (
                        <>
                          <li>• 旧主在敌对阵营时忠诚度 -25</li>
                          <li>• 叛变概率大幅增加</li>
                        </>
                      ) : null}
                    </ul>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedRelation(null)}
                  className="mt-6 w-full bg-amber-700 hover:bg-amber-600 text-amber-100 py-2 rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
