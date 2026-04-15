import { create } from 'zustand';
import { GameState, Faction, City, General, Item, Army, Weather, Title, GeneralRelation, Battle, Captive, Formation, Tactics, Stratagem, ArmyMovement } from '@/types';
import { RelationSystem } from '@/systems/relation/RelationSystem';
import { SearchSystem, SearchResult } from '@/systems/search/SearchSystem';

interface GameStore extends GameState {
  // 官职和关系数据
  titles: Record<string, Title>;
  relations: GeneralRelation[];
  
  // 阵型、战术、计谋数据
  formations: Record<string, Formation>;
  tactics: Record<string, Tactics>;
  stratagems: Record<string, Stratagem>;
  
  // 游戏流程
  nextTurn: () => void;
  setSeason: (season: GameState['season']) => void;
  setWeather: (weather: Weather) => void;
  randomWeather: () => void;
  
  // 势力操作
  updateFaction: (factionId: string, updates: Partial<Faction>) => void;
  
  // 城市操作
  updateCity: (cityId: string, updates: Partial<City>) => void;
  
  // 武将操作
  updateGeneral: (generalId: string, updates: Partial<General>) => void;
  
  // 宝物操作
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  
  // 军队操作
  updateArmy: (armyId: string, updates: Partial<Army>) => void;
  createArmy: (army: Army) => void;
  deleteArmy: (armyId: string) => void;
  moveArmy: (armyId: string, targetCityId: string) => boolean;
  cancelArmyMovement: (armyId: string) => void;
  processArmyMovements: () => void;
  
  // 官职操作
  setTitles: (titles: Record<string, Title>) => void;
  
  // 关系操作
  setRelations: (relations: GeneralRelation[]) => void;
  getGeneralRelations: (generalId: string) => GeneralRelation[];
  
  // 战斗操作
  setFormations: (formations: Record<string, Formation>) => void;
  setTactics: (tactics: Record<string, Tactics>) => void;
  setStratagems: (stratagems: Record<string, Stratagem>) => void;
  createBattle: (battle: Battle) => void;
  updateBattle: (battleId: string, updates: Partial<Battle>) => void;
  
  // 俘虏操作
  addCaptive: (captive: Captive) => void;
  updateCaptive: (generalId: string, updates: Partial<Captive>) => void;
  removeCaptive: (generalId: string) => void;
  getFactionCaptives: (factionId: string) => Captive[];

  // 搜索操作
  executeSearch: (generalId: string, cityId: string) => SearchResult;

  // 游戏状态
  loadGame: (gameState: GameState) => void;
  resetGame: () => void;
}

const initialGameState: GameState = {
  turn: 1,
  season: 'spring',
  weather: 'sunny',
  scenario: 'yellow_turban',
  factions: {},
  cities: {},
  generals: {},
  items: {},
  armies: {},
  battles: {},
  captives: [],
  currentPlayer: '',
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialGameState,
  titles: {},
  relations: [],
  formations: {},
  tactics: {},
  stratagems: {},
  
  // 游戏流程
  nextTurn: () => set((state) => {
    let newTurn = state.turn + 1;
    let newSeason = state.season;
    
    // 每4回合换季
    if (newTurn % 4 === 1) {
      const seasons: GameState['season'][] = ['spring', 'summer', 'autumn', 'winter'];
      const currentIndex = seasons.indexOf(state.season);
      newSeason = seasons[(currentIndex + 1) % 4];
    }
    
    // 处理军队移动
    const updatedArmies = { ...state.armies };
    Object.entries(updatedArmies).forEach(([armyId, army]) => {
      if (army.status !== 'moving' || !army.movement) return;
      
      const movement = army.movement;
      const newProgress = movement.progress + (100 / movement.turnsRemaining);
      
      if (newProgress >= 100) {
        // 移动完成
        updatedArmies[armyId] = {
          ...army,
          location: movement.targetCity,
          status: 'idle',
          movement: undefined,
          fatigue: Math.min(100, army.fatigue + 10),
        };
        
        // 更新武将位置
        army.generals.forEach(generalId => {
          const general = state.generals[generalId];
          if (general) {
            state.generals[generalId] = {
              ...general,
              location: movement.targetCity,
            };
          }
        });
      } else {
        // 移动中
        updatedArmies[armyId] = {
          ...army,
          movement: {
            ...movement,
            progress: newProgress,
            turnsRemaining: Math.max(1, movement.turnsRemaining - 1),
          },
        };
      }
    });
    
    // 处理武将忠诚度变化和叛变判定
    const updatedGenerals = { ...state.generals };
    const updatedFactions = { ...state.factions };
    const defectedGenerals: Array<{ general: General; targetFaction?: string; reason: string }> = [];
    
    Object.entries(updatedGenerals).forEach(([generalId, general]) => {
      if (general.faction === '' || general.status !== 'active') return;
      
      const faction = updatedFactions[general.faction];
      if (!faction) return;
      
      // 计算忠诚度变化
      const loyaltyChange = RelationSystem.calculateLoyaltyChange(
        general,
        updatedGenerals,
        state.relations,
        faction,
        state.cities
      );
      
      const newLoyalty = Math.max(0, Math.min(100, general.loyalty + loyaltyChange));
      updatedGenerals[generalId] = {
        ...general,
        loyalty: newLoyalty,
      };
      
      // 判定叛变
      const defectResult = RelationSystem.shouldDefect(
        updatedGenerals[generalId],
        updatedGenerals,
        state.relations,
        updatedFactions
      );
      
      if (defectResult.shouldDefect) {
        defectedGenerals.push({
          general: updatedGenerals[generalId],
          targetFaction: defectResult.targetFaction,
          reason: defectResult.reason,
        });
      }
    });
    
    // 处理叛变
    defectedGenerals.forEach(({ general, targetFaction, reason }) => {
      // 从原势力移除
      const oldFaction = updatedFactions[general.faction];
      if (oldFaction) {
        updatedFactions[general.faction] = {
          ...oldFaction,
          generals: oldFaction.generals.filter(id => id !== general.id),
        };
      }
      
      // 加入新势力
      if (targetFaction && updatedFactions[targetFaction]) {
        updatedFactions[targetFaction] = {
          ...updatedFactions[targetFaction],
          generals: [...updatedFactions[targetFaction].generals, general.id],
        };
        updatedGenerals[general.id] = {
          ...general,
          faction: targetFaction,
          loyalty: 50, // 叛变后忠诚度重置为50
        };
      } else {
        // 无目标势力，成为在野武将
        updatedGenerals[general.id] = {
          ...general,
          faction: '',
          loyalty: 50,
        };
      }
      
      console.log(`武将${general.name}叛变：${reason}`);
    });
    
    return { 
      turn: newTurn, 
      season: newSeason,
      armies: updatedArmies,
      generals: updatedGenerals,
      factions: updatedFactions,
    };
  }),
  
  setSeason: (season) => set({ season }),
  
  setWeather: (weather) => set({ weather }),
  
  // 随机天气（根据季节调整概率）
  randomWeather: () => set((state) => {
    const seasonWeather: Record<GameState['season'], Weather[]> = {
      spring: ['sunny', 'sunny', 'cloudy', 'cloudy', 'rain', 'rain'],
      summer: ['sunny', 'sunny', 'sunny', 'cloudy', 'rain', 'rain'],
      autumn: ['sunny', 'cloudy', 'cloudy', 'cloudy', 'rain', 'snow'],
      winter: ['sunny', 'cloudy', 'cloudy', 'snow', 'snow', 'snow'],
    };
    const options = seasonWeather[state.season];
    const randomIndex = Math.floor(Math.random() * options.length);
    return { weather: options[randomIndex] };
  }),
  
  // 势力操作
  updateFaction: (factionId, updates) => set((state) => ({
    factions: {
      ...state.factions,
      [factionId]: { ...state.factions[factionId], ...updates },
    },
  })),
  
  // 城市操作
  updateCity: (cityId, updates) => set((state) => ({
    cities: {
      ...state.cities,
      [cityId]: { ...state.cities[cityId], ...updates },
    },
  })),
  
  // 武将操作
  updateGeneral: (generalId, updates) => set((state) => ({
    generals: {
      ...state.generals,
      [generalId]: { ...state.generals[generalId], ...updates },
    },
  })),
  
  // 宝物操作
  updateItem: (itemId, updates) => set((state) => ({
    items: {
      ...state.items,
      [itemId]: { ...state.items[itemId], ...updates },
    },
  })),
  
  // 军队操作
  updateArmy: (armyId, updates) => set((state) => ({
    armies: {
      ...state.armies,
      [armyId]: { ...state.armies[armyId], ...updates },
    },
  })),
  
  createArmy: (army) => set((state) => ({
    armies: {
      ...state.armies,
      [army.id]: army,
    },
  })),
  
  deleteArmy: (armyId) => set((state) => {
    const { [armyId]: _, ...remaining } = state.armies;
    return { armies: remaining };
  }),
  
  // 军队移动
  moveArmy: (armyId, targetCityId) => {
    const state = get();
    const army = state.armies[armyId];
    if (!army) return false;
    
    const currentCity = state.cities[army.location];
    const targetCity = state.cities[targetCityId];
    if (!currentCity || !targetCity) return false;
    
    // 检查是否相邻
    if (!currentCity.neighbors.includes(targetCityId)) {
      return false;
    }
    
    // 检查军队状态
    if (army.status !== 'idle') {
      return false;
    }
    
    // 计算移动时间（基础1回合，地形影响）
    const terrainMoveCost: Record<string, number> = {
      plain: 1,
      mountain: 2,
      water: 1.5,
      pass: 2,
    };
    
    const baseTurns = terrainMoveCost[targetCity.terrain] || 1;
    const turns = Math.ceil(baseTurns);
    
    // 计算粮草消耗
    const totalSoldiers = army.units.reduce((sum, u) => sum + u.count, 0);
    const foodCost = Math.ceil(totalSoldiers * 0.1 * turns);
    
    if (army.supplies.food < foodCost) {
      return false;
    }
    
    // 开始移动
    const movement: ArmyMovement = {
      targetCity: targetCityId,
      progress: 0,
      turnsRemaining: turns,
      path: [army.location, targetCityId],
      startedTurn: state.turn,
    };
    
    set((state) => ({
      armies: {
        ...state.armies,
        [armyId]: {
          ...army,
          status: 'moving',
          movement,
          supplies: {
            ...army.supplies,
            food: army.supplies.food - foodCost,
          },
        },
      },
    }));
    
    return true;
  },
  
  // 取消军队移动
  cancelArmyMovement: (armyId) => set((state) => {
    const army = state.armies[armyId];
    if (!army || army.status !== 'moving' || !army.movement) {
      return state;
    }
    
    return {
      armies: {
        ...state.armies,
        [armyId]: {
          ...army,
          status: 'idle',
          movement: undefined,
        },
      },
    };
  }),
  
  // 处理军队移动进度
  processArmyMovements: () => set((state) => {
    const updatedArmies = { ...state.armies };
    
    Object.entries(updatedArmies).forEach(([armyId, army]) => {
      if (army.status !== 'moving' || !army.movement) return;
      
      const movement = army.movement;
      const newProgress = movement.progress + (100 / movement.turnsRemaining);
      
      if (newProgress >= 100) {
        // 移动完成
        // const targetCity = state.cities[movement.targetCity]; // 预留变量
        
        updatedArmies[armyId] = {
          ...army,
          location: movement.targetCity,
          status: 'idle',
          movement: undefined,
          fatigue: Math.min(100, army.fatigue + 10), // 增加疲劳
        };
        
        // 更新武将位置
        army.generals.forEach(generalId => {
          const general = state.generals[generalId];
          if (general) {
            state.generals[generalId] = {
              ...general,
              location: movement.targetCity,
            };
          }
        });
      } else {
        // 移动中
        updatedArmies[armyId] = {
          ...army,
          movement: {
            ...movement,
            progress: newProgress,
            turnsRemaining: Math.max(1, movement.turnsRemaining - 1),
          },
        };
      }
    });
    
    return { armies: updatedArmies };
  }),
  
  // 官职操作
  setTitles: (titles) => set({ titles }),
  
  // 关系操作
  setRelations: (relations) => set({ relations }),
  
  getGeneralRelations: (generalId) => {
    const state = get();
    return state.relations.filter(
      r => r.general1 === generalId || r.general2 === generalId
    );
  },
  
  // 战斗操作
  setFormations: (formations) => set({ formations }),
  setTactics: (tactics) => set({ tactics }),
  setStratagems: (stratagems) => set({ stratagems }),
  
  createBattle: (battle) => set((state) => ({
    battles: {
      ...state.battles,
      [battle.id]: battle,
    },
  })),
  
  updateBattle: (battleId, updates) => set((state) => ({
    battles: {
      ...state.battles,
      [battleId]: { ...state.battles[battleId], ...updates },
    },
  })),
  
  // 俘虏操作
  addCaptive: (captive) => set((state) => ({
    captives: [...state.captives, captive],
  })),
  
  updateCaptive: (generalId, updates) => set((state) => ({
    captives: state.captives.map(c => 
      c.generalId === generalId ? { ...c, ...updates } : c
    ),
  })),
  
  removeCaptive: (generalId) => set((state) => ({
    captives: state.captives.filter(c => c.generalId !== generalId),
  })),
  
  getFactionCaptives: (factionId) => {
    const state = get();
    return state.captives.filter(c => c.capturedBy === factionId);
  },

  // 搜索操作
  executeSearch: (generalId, cityId) => {
    const state = get();
    const general = state.generals[generalId];
    const city = state.cities[cityId];
    
    if (!general || !city) {
      return {
        type: 'nothing' as const,
        message: '武将或城市不存在'
      };
    }
    
    // 检查是否可以搜索
    const faction = state.factions[general.faction];
    if (!faction) {
      return {
        type: 'nothing' as const,
        message: '武将不属于任何势力'
      };
    }
    
    const canSearch = SearchSystem.canSearch(general, city, faction.resources.money);
    if (!canSearch.canSearch) {
      return {
        type: 'nothing' as const,
        message: canSearch.reason || '无法执行搜索'
      };
    }
    
    // 执行搜索
    const result = SearchSystem.executeSearch(
      general,
      city,
      state.items,
      state.generals,
      state.weather
    );
    
    // 扣除金钱
    const cost = SearchSystem.calculateSearchCost(general, city);
    set((state) => ({
      factions: {
        ...state.factions,
        [faction.id]: {
          ...faction,
          resources: {
            ...faction.resources,
            money: faction.resources.money - cost.money,
          },
        },
      },
    }));
    
    // 处理搜索结果
    if (result.type === 'item' && result.itemId) {
      // 发现宝物，更新宝物位置
      set((state) => ({
        items: {
          ...state.items,
          [result.itemId!]: {
            ...state.items[result.itemId!],
            location: cityId,
          },
        },
      }));
    } else if (result.type === 'general' && result.generalId) {
      // 发现人才，设置忠诚度较低
      set((state) => ({
        generals: {
          ...state.generals,
          [result.generalId!]: {
            ...state.generals[result.generalId!],
            loyalty: 30, // 新发现的人才忠诚度较低
          },
        },
      }));
    }
    
    return result;
  },

  // 游戏状态
  loadGame: (gameState) => set(gameState),
  
  resetGame: () => set(initialGameState),
}));
