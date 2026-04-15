/**
 * 存档系统
 * 负责游戏的保存、读取、导出导入功能
 */

import type { GameState } from '@/types';

// 存档元数据
export interface SaveMetadata {
  id: string;
  name: string;
  timestamp: number;
  turn: number;
  scenario: string;
  playerFaction: string;
  factionCount: number;
  cityCount: number;
  generalCount: number;
  screenshot?: string;
}

// 存档数据
export interface SaveData {
  metadata: SaveMetadata;
  gameState: GameState;
  version: string;
}

// 存档槽位
export interface SaveSlot {
  id: string;
  data: SaveData | null;
  isEmpty: boolean;
}

// 存档配置
export interface SaveConfig {
  maxSlots: number;
  autoSaveInterval: number; // 分钟
  version: string;
}

class SaveSystemClass {
  private config: SaveConfig = {
    maxSlots: 10,
    autoSaveInterval: 10,
    version: '1.0.0'
  };

  private readonly STORAGE_KEY = 'sgz3_save';
  private readonly AUTO_SAVE_KEY = 'sgz3_autosave';

  /**
   * 获取所有存档槽位
   */
  getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    
    for (let i = 0; i < this.config.maxSlots; i++) {
      const key = `${this.STORAGE_KEY}_${i}`;
      const data = localStorage.getItem(key);
      
      slots.push({
        id: `slot_${i}`,
        data: data ? JSON.parse(data) : null,
        isEmpty: !data
      });
    }
    
    return slots;
  }

  /**
   * 保存游戏到指定槽位
   */
  saveGame(
    slotId: string,
    name: string,
    gameState: GameState,
    playerFaction: string
  ): boolean {
    try {
      const slotIndex = parseInt(slotId.replace('slot_', ''));
      
      if (slotIndex < 0 || slotIndex >= this.config.maxSlots) {
        console.error('Invalid slot index');
        return false;
      }

      const metadata: SaveMetadata = {
        id: slotId,
        name,
        timestamp: Date.now(),
        turn: gameState.turn,
        scenario: gameState.scenario,
        playerFaction,
        factionCount: Object.keys(gameState.factions).length,
        cityCount: Object.keys(gameState.cities).length,
        generalCount: Object.keys(gameState.generals).length
      };

      const saveData: SaveData = {
        metadata,
        gameState,
        version: this.config.version
      };

      const key = `${this.STORAGE_KEY}_${slotIndex}`;
      localStorage.setItem(key, JSON.stringify(saveData));

      console.log(`Game saved to slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * 从指定槽位读取游戏
   */
  loadGame(slotId: string): GameState | null {
    try {
      const slotIndex = parseInt(slotId.replace('slot_', ''));
      const key = `${this.STORAGE_KEY}_${slotIndex}`;
      const data = localStorage.getItem(key);

      if (!data) {
        console.error('No save data found');
        return null;
      }

      const saveData: SaveData = JSON.parse(data);

      // 版本检查
      if (saveData.version !== this.config.version) {
        console.warn(`Save version mismatch: ${saveData.version} vs ${this.config.version}`);
        // 可以在这里添加版本迁移逻辑
      }

      console.log(`Game loaded from slot ${slotId}`);
      return saveData.gameState;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * 删除存档
   */
  deleteSave(slotId: string): boolean {
    try {
      const slotIndex = parseInt(slotId.replace('slot_', ''));
      const key = `${this.STORAGE_KEY}_${slotIndex}`;
      localStorage.removeItem(key);

      console.log(`Save slot ${slotId} deleted`);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * 自动保存
   */
  autoSave(gameState: GameState, playerFaction: string): boolean {
    try {
      const metadata: SaveMetadata = {
        id: 'autosave',
        name: '自动存档',
        timestamp: Date.now(),
        turn: gameState.turn,
        scenario: gameState.scenario,
        playerFaction,
        factionCount: Object.keys(gameState.factions).length,
        cityCount: Object.keys(gameState.cities).length,
        generalCount: Object.keys(gameState.generals).length
      };

      const saveData: SaveData = {
        metadata,
        gameState,
        version: this.config.version
      };

      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(saveData));

      console.log('Auto save completed');
      return true;
    } catch (error) {
      console.error('Failed to auto save:', error);
      return false;
    }
  }

  /**
   * 读取自动存档
   */
  loadAutoSave(): GameState | null {
    try {
      const data = localStorage.getItem(this.AUTO_SAVE_KEY);

      if (!data) {
        return null;
      }

      const saveData: SaveData = JSON.parse(data);
      return saveData.gameState;
    } catch (error) {
      console.error('Failed to load auto save:', error);
      return null;
    }
  }

  /**
   * 检查是否有自动存档
   */
  hasAutoSave(): boolean {
    return localStorage.getItem(this.AUTO_SAVE_KEY) !== null;
  }

  /**
   * 导出存档为JSON文件
   */
  exportSave(slotId: string): string | null {
    try {
      const slotIndex = parseInt(slotId.replace('slot_', ''));
      const key = `${this.STORAGE_KEY}_${slotIndex}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  /**
   * 导入存档
   */
  importSave(jsonData: string, targetSlotId?: string): boolean {
    try {
      const saveData: SaveData = JSON.parse(jsonData);

      // 验证存档数据
      if (!saveData.metadata || !saveData.gameState || !saveData.version) {
        console.error('Invalid save data format');
        return false;
      }

      // 确定目标槽位
      let slotIndex: number;
      if (targetSlotId) {
        slotIndex = parseInt(targetSlotId.replace('slot_', ''));
      } else {
        // 找到第一个空槽位
        const slots = this.getSaveSlots();
        const emptySlot = slots.find(s => s.isEmpty);
        if (!emptySlot) {
          console.error('No empty save slot available');
          return false;
        }
        slotIndex = parseInt(emptySlot.id.replace('slot_', ''));
      }

      // 更新元数据
      saveData.metadata.id = `slot_${slotIndex}`;
      saveData.metadata.timestamp = Date.now();

      // 保存到槽位
      const key = `${this.STORAGE_KEY}_${slotIndex}`;
      localStorage.setItem(key, JSON.stringify(saveData));

      console.log(`Save imported to slot_${slotIndex}`);
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * 下载存档文件
   */
  downloadSave(slotId: string): boolean {
    try {
      const jsonData = this.exportSave(slotId);
      if (!jsonData) {
        return false;
      }

      const saveData: SaveData = JSON.parse(jsonData);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `sgz3_save_${saveData.metadata.name}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Failed to download save:', error);
      return false;
    }
  }

  /**
   * 从文件读取存档
   */
  async loadSaveFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const jsonData = e.target?.result as string;
        const success = this.importSave(jsonData);
        resolve(success);
      };

      reader.onerror = () => {
        console.error('Failed to read file');
        resolve(false);
      };

      reader.readAsText(file);
    });
  }

  /**
   * 获取存档大小（字节）
   */
  getSaveSize(slotId: string): number {
    try {
      const slotIndex = parseInt(slotId.replace('slot_', ''));
      const key = `${this.STORAGE_KEY}_${slotIndex}`;
      const data = localStorage.getItem(key);

      if (!data) {
        return 0;
      }

      return new Blob([data]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取总存档大小
   */
  getTotalSaveSize(): number {
    let totalSize = 0;

    for (let i = 0; i < this.config.maxSlots; i++) {
      totalSize += this.getSaveSize(`slot_${i}`);
    }

    // 加上自动存档
    const autoSaveData = localStorage.getItem(this.AUTO_SAVE_KEY);
    if (autoSaveData) {
      totalSize += new Blob([autoSaveData]).size;
    }

    return totalSize;
  }

  /**
   * 格式化存档大小
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * 清除所有存档
   */
  clearAllSaves(): boolean {
    try {
      for (let i = 0; i < this.config.maxSlots; i++) {
        const key = `${this.STORAGE_KEY}_${i}`;
        localStorage.removeItem(key);
      }
      localStorage.removeItem(this.AUTO_SAVE_KEY);

      console.log('All saves cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear saves:', error);
      return false;
    }
  }
}

export const SaveSystem = new SaveSystemClass();
