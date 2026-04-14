import { create } from 'zustand';
import { GameState, Faction, City, General, Item, Army } from '@/types';

interface GameStore extends GameState {
  // 游戏流程
  nextTurn: () => void;
  setSeason: (season: GameState['season']) => void;
  
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
  
  // 游戏状态
  loadGame: (gameState: GameState) => void;
  resetGame: () => void;
}

const initialGameState: GameState = {
  turn: 1,
  season: 'spring',
  scenario: 'yellow_turban',
  factions: {},
  cities: {},
  generals: {},
  items: {},
  armies: {},
  currentPlayer: '',
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialGameState,
  
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
    
    return { turn: newTurn, season: newSeason };
  }),
  
  setSeason: (season) => set({ season }),
  
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
  
  // 游戏状态
  loadGame: (gameState) => set(gameState),
  
  resetGame: () => set(initialGameState),
}));
