import { create } from 'zustand';

export interface MapState {
  // 视野范围
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  
  // 选中的城市
  selectedCity: string | null;
  
  // 选中的武将
  selectedGeneral: string | null;
  
  // 地图显示选项
  showTerrain: boolean;
  showCities: boolean;
  showGenerals: boolean;
  showArmies: boolean;
  
  // Actions
  setViewport: (viewport: Partial<MapState['viewport']>) => void;
  setSelectedCity: (cityId: string | null) => void;
  setSelectedGeneral: (generalId: string | null) => void;
  toggleTerrain: () => void;
  toggleCities: () => void;
  toggleGenerals: () => void;
  toggleArmies: () => void;
  resetSelection: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  
  selectedCity: null,
  selectedGeneral: null,
  
  showTerrain: true,
  showCities: true,
  showGenerals: true,
  showArmies: true,
  
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport },
  })),
  
  setSelectedCity: (cityId) => set({ selectedCity: cityId }),
  setSelectedGeneral: (generalId) => set({ selectedGeneral: generalId }),
  
  toggleTerrain: () => set((state) => ({ showTerrain: !state.showTerrain })),
  toggleCities: () => set((state) => ({ showCities: !state.showCities })),
  toggleGenerals: () => set((state) => ({ showGenerals: !state.showGenerals })),
  toggleArmies: () => set((state) => ({ showArmies: !state.showArmies })),
  
  resetSelection: () => set({
    selectedCity: null,
    selectedGeneral: null,
  }),
}));
