import { useGameStore, useMapStore } from '@/store';
import type { City, General } from '@/types';

export function CityInfo() {
  const { selectedCity, setSelectedCity } = useMapStore();
  const { cities, generals, factions } = useGameStore();

  if (!selectedCity) {
    return (
      <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg p-3 border-2 border-amber-800/40 shadow-xl backdrop-blur-sm">
        <h2 className="text-base font-semibold mb-2" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>城市详情</h2>
        <p className="text-amber-200/50 text-sm">点击地图上的城市查看详情</p>
      </div>
    );
  }

  const city = cities[selectedCity] as City | undefined;
  if (!city) return null;

  const faction = factions[city.faction];
  const cityGenerals = city.generals.map(id => generals[id]).filter(Boolean) as General[];

  return (
    <div className="bg-gradient-to-br from-stone-900/90 to-stone-950/90 rounded-lg p-3 border-2 border-amber-800/40 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-amber-100" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>{city.name}</h2>
        <div className="flex items-center space-x-2">
          {faction && (
            <span 
              className="px-2 py-1 rounded text-xs border border-amber-700/30"
              style={{ backgroundColor: faction.color }}
            >
              {faction.name}
            </span>
          )}
          <button
            onClick={() => setSelectedCity(null)}
            className="text-amber-200/60 hover:text-amber-100 transition-colors text-xl leading-none"
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-stone-800/60 rounded p-2 border border-amber-900/20">
            <div className="text-amber-200/50 text-xs">人口</div>
            <div className="font-medium text-amber-100">{city.stats.population.toLocaleString()}</div>
          </div>
          <div className="bg-stone-800/60 rounded p-2 border border-amber-900/20">
            <div className="text-amber-200/50 text-xs">地形</div>
            <div className="font-medium text-amber-100">
              {city.terrain === 'plain' ? '平原' : 
               city.terrain === 'mountain' ? '山地' : 
               city.terrain === 'water' ? '水域' : '关隘'}
            </div>
          </div>
        </div>

        {/* 属性 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-amber-200/60">开发度</span>
            <div className="flex items-center">
              <div className="w-20 bg-stone-800/60 rounded-full h-2 mr-2 border border-amber-900/20">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full"
                  style={{ width: `${city.stats.development}%` }}
                />
              </div>
              <span className="text-amber-100">{city.stats.development}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-200/60">商业度</span>
            <div className="flex items-center">
              <div className="w-20 bg-stone-800/60 rounded-full h-2 mr-2 border border-amber-900/20">
                <div 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 h-2 rounded-full"
                  style={{ width: `${city.stats.commerce}%` }}
                />
              </div>
              <span className="text-amber-100">{city.stats.commerce}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-200/60">城防</span>
            <div className="flex items-center">
              <div className="w-20 bg-stone-800/60 rounded-full h-2 mr-2 border border-amber-900/20">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full"
                  style={{ width: `${city.stats.defense}%` }}
                />
              </div>
              <span className="text-amber-100">{city.stats.defense}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-amber-200/60">民心</span>
            <div className="flex items-center">
              <div className="w-20 bg-stone-800/60 rounded-full h-2 mr-2 border border-amber-900/20">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full"
                  style={{ width: `${city.stats.morale}%` }}
                />
              </div>
              <span className="text-amber-100">{city.stats.morale}</span>
            </div>
          </div>
        </div>

        {/* 资源 */}
        <div className="border-t border-amber-800/30 pt-3">
          <h3 className="text-sm font-medium mb-2 text-amber-100" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>资源</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center bg-stone-800/40 rounded p-2 border border-amber-900/20">
              <div className="text-yellow-400 font-medium">{city.resources.money}</div>
              <div className="text-xs text-amber-200/50">金钱</div>
            </div>
            <div className="text-center bg-stone-800/40 rounded p-2 border border-amber-900/20">
              <div className="text-green-400 font-medium">{city.resources.food}</div>
              <div className="text-xs text-amber-200/50">粮草</div>
            </div>
            <div className="text-center bg-stone-800/40 rounded p-2 border border-amber-900/20">
              <div className="text-red-400 font-medium">{city.resources.soldiers}</div>
              <div className="text-xs text-amber-200/50">士兵</div>
            </div>
          </div>
        </div>

        {/* 设施 */}
        <div className="border-t border-amber-800/30 pt-3">
          <h3 className="text-sm font-medium mb-2 text-amber-100" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>设施</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between bg-stone-800/40 rounded p-1.5 border border-amber-900/20">
              <span className="text-amber-200/60">市场 Lv.</span>
              <span className="text-amber-100">{city.facilities.market}</span>
            </div>
            <div className="flex justify-between bg-stone-800/40 rounded p-1.5 border border-amber-900/20">
              <span className="text-amber-200/60">农场 Lv.</span>
              <span className="text-amber-100">{city.facilities.farm}</span>
            </div>
            <div className="flex justify-between bg-stone-800/40 rounded p-1.5 border border-amber-900/20">
              <span className="text-amber-200/60">兵营 Lv.</span>
              <span className="text-amber-100">{city.facilities.barracks}</span>
            </div>
            <div className="flex justify-between bg-stone-800/40 rounded p-1.5 border border-amber-900/20">
              <span className="text-amber-200/60">城墙 Lv.</span>
              <span className="text-amber-100">{city.facilities.wall}</span>
            </div>
          </div>
        </div>

        {/* 武将 */}
        {cityGenerals.length > 0 && (
          <div className="border-t border-amber-800/30 pt-3">
            <h3 className="text-sm font-medium mb-2 text-amber-100" style={{ fontFamily: '"STKaiti", "KaiTi", serif' }}>驻守武将</h3>
            <div className="space-y-1">
              {cityGenerals.map(general => (
                <div 
                  key={general.id}
                  className="bg-stone-800/60 rounded p-2 text-sm flex justify-between items-center border border-amber-900/20"
                >
                  <span className="text-amber-100">{general.name}</span>
                  <span className="text-xs text-amber-200/60">
                    统{general.attributes.command} 武{general.attributes.force}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
