import { create } from 'zustand';
import { GameState, Faction, City, General, Item, Army, Weather } from '@/types';

interface GameStore extends GameState {
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
  
  // 游戏状态
  loadGame: (gameState) => set(gameState),
  
  resetGame: () => set(initialGameState),
}));
