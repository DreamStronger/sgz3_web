/**
 * 音效音乐系统
 * 负责游戏音效和背景音乐的播放管理
 */

// 音效类型
export enum SoundType {
  // UI音效
  UI_CLICK = 'ui_click',
  UI_HOVER = 'ui_hover',
  UI_CLOSE = 'ui_close',
  UI_SUCCESS = 'ui_success',
  UI_ERROR = 'ui_error',
  
  // 游戏音效
  TURN_CHANGE = 'turn_change',
  SEASON_CHANGE = 'season_change',
  
  // 内政音效
  DEVELOP_CITY = 'develop_city',
  RECRUIT = 'recruit',
  COLLECT_TAX = 'collect_tax',
  
  // 战争音效
  BATTLE_START = 'battle_start',
  BATTLE_ATTACK = 'battle_attack',
  BATTLE_DEFEND = 'battle_defend',
  BATTLE_VICTORY = 'battle_victory',
  BATTLE_DEFEAT = 'battle_defeat',
  BATTLE_DUEL = 'battle_duel',
  BATTLE_STRATAGEM = 'battle_stratagem',
  
  // 武将音效
  GENERAL_RECRUIT = 'general_recruit',
  GENERAL_LEVEL_UP = 'general_level_up',
  GENERAL_DEATH = 'general_death',
  
  // 外交音效
  DIPLOMACY_ALLIANCE = 'diplomacy_alliance',
  DIPLOMACY_WAR = 'diplomacy_war',
  DIPLOMACY_PEACE = 'diplomacy_peace',
  
  // 事件音效
  EVENT_DISASTER = 'event_disaster',
  EVENT_BLESSING = 'event_blessing',
  EVENT_HISTORICAL = 'event_historical'
}

// 背景音乐类型
export enum MusicType {
  MAIN_MENU = 'main_menu',
  GAME_SPRING = 'game_spring',
  GAME_SUMMER = 'game_summer',
  GAME_AUTUMN = 'game_autumn',
  GAME_WINTER = 'game_winter',
  BATTLE_FIELD = 'battle_field',
  BATTLE_SIEGE = 'battle_siege',
  VICTORY = 'victory',
  DEFEAT = 'defeat'
}

// 音频配置
export interface AudioConfig {
  masterVolume: number;      // 主音量 (0-1)
  musicVolume: number;       // 音乐音量 (0-1)
  soundVolume: number;       // 音效音量 (0-1)
  musicEnabled: boolean;     // 音乐开关
  soundEnabled: boolean;     // 音效开关
}

// 音频状态
interface AudioState {
  currentMusic: MusicType | null;
  isPlaying: boolean;
  config: AudioConfig;
}

class AudioSystemClass {
  private state: AudioState = {
    currentMusic: null,
    isPlaying: false,
    config: {
      masterVolume: 0.7,
      musicVolume: 0.5,
      soundVolume: 0.8,
      musicEnabled: true,
      soundEnabled: true
    }
  };

  private audioContext: AudioContext | null = null;
  private musicElement: HTMLAudioElement | null = null;

  /**
   * 初始化音频系统
   */
  async initialize(): Promise<void> {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // 创建背景音乐元素
      this.musicElement = document.createElement('audio');
      this.musicElement.loop = true;
      this.musicElement.volume = this.state.config.masterVolume * this.state.config.musicVolume;

      // 加载配置
      this.loadConfig();

      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  /**
   * 加载音频配置
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('sgz3_audio_config');
      if (savedConfig) {
        this.state.config = { ...this.state.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load audio config:', error);
    }
  }

  /**
   * 保存音频配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('sgz3_audio_config', JSON.stringify(this.state.config));
    } catch (error) {
      console.error('Failed to save audio config:', error);
    }
  }

  /**
   * 播放音效
   */
  playSound(type: SoundType): void {
    if (!this.state.config.soundEnabled || !this.audioContext) {
      return;
    }

    // 简化版：使用Web Audio API生成简单音效
    this.playGeneratedSound(type);
  }

  /**
   * 使用Web Audio API生成简单音效
   */
  private playGeneratedSound(type: SoundType): void {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const volume = this.state.config.masterVolume * this.state.config.soundVolume;

    // 根据类型生成不同的音效
    switch (type) {
      case SoundType.UI_CLICK:
        this.playTone(ctx, 800, 0.1, 'sine', volume * 0.3);
        break;
      
      case SoundType.UI_HOVER:
        this.playTone(ctx, 600, 0.05, 'sine', volume * 0.1);
        break;
      
      case SoundType.UI_SUCCESS:
        this.playMelody(ctx, [523, 659, 784], 0.15, volume * 0.4);
        break;
      
      case SoundType.UI_ERROR:
        this.playTone(ctx, 200, 0.2, 'sawtooth', volume * 0.3);
        break;
      
      case SoundType.TURN_CHANGE:
        this.playMelody(ctx, [440, 554, 659], 0.2, volume * 0.5);
        break;
      
      case SoundType.BATTLE_START:
        this.playDrumRoll(ctx, volume * 0.6);
        break;
      
      case SoundType.BATTLE_ATTACK:
        this.playTone(ctx, 150, 0.1, 'sawtooth', volume * 0.5);
        break;
      
      case SoundType.BATTLE_VICTORY:
        this.playMelody(ctx, [523, 659, 784, 1047], 0.2, volume * 0.6);
        break;
      
      case SoundType.BATTLE_DEFEAT:
        this.playMelody(ctx, [392, 349, 330, 294], 0.3, volume * 0.5);
        break;
      
      case SoundType.BATTLE_DUEL:
        this.playTone(ctx, 300, 0.15, 'square', volume * 0.4);
        this.playTone(ctx, 400, 0.15, 'square', volume * 0.4, 0.15);
        break;
      
      case SoundType.GENERAL_RECRUIT:
        this.playMelody(ctx, [659, 784, 880], 0.15, volume * 0.4);
        break;
      
      case SoundType.DIPLOMACY_ALLIANCE:
        this.playMelody(ctx, [523, 659, 784], 0.2, volume * 0.4);
        break;
      
      case SoundType.DIPLOMACY_WAR:
        this.playTone(ctx, 200, 0.3, 'sawtooth', volume * 0.5);
        this.playTone(ctx, 150, 0.3, 'sawtooth', volume * 0.5, 0.3);
        break;
      
      case SoundType.EVENT_DISASTER:
        this.playTone(ctx, 100, 0.5, 'sawtooth', volume * 0.4);
        break;
      
      case SoundType.EVENT_BLESSING:
        this.playMelody(ctx, [784, 880, 988, 1047], 0.2, volume * 0.5);
        break;
      
      default:
        this.playTone(ctx, 440, 0.1, 'sine', volume * 0.2);
    }
  }

  /**
   * 播放单个音调
   */
  private playTone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay: number = 0
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  }

  /**
   * 播放旋律
   */
  private playMelody(
    ctx: AudioContext,
    frequencies: number[],
    noteDuration: number,
    volume: number
  ): void {
    frequencies.forEach((freq, index) => {
      this.playTone(ctx, freq, noteDuration, 'sine', volume, index * noteDuration);
    });
  }

  /**
   * 播放鼓点
   */
  private playDrumRoll(ctx: AudioContext, volume: number): void {
    for (let i = 0; i < 4; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(100, ctx.currentTime + i * 0.1);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + i * 0.1);
      oscillator.stop(ctx.currentTime + i * 0.1 + 0.1);
    }
  }

  /**
   * 播放背景音乐
   */
  playMusic(type: MusicType): void {
    if (!this.state.config.musicEnabled || !this.musicElement) {
      return;
    }

    // 如果正在播放相同的音乐，不重复播放
    if (this.state.currentMusic === type && this.state.isPlaying) {
      return;
    }

    // 停止当前音乐
    this.stopMusic();

    // 设置新音乐
    this.state.currentMusic = type;
    this.state.isPlaying = true;

    // 注意：实际项目中需要加载真实的音频文件
    // 这里只是演示接口
    console.log(`Playing music: ${type}`);
  }

  /**
   * 停止背景音乐
   */
  stopMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause();
      this.musicElement.currentTime = 0;
    }
    this.state.isPlaying = false;
  }

  /**
   * 暂停背景音乐
   */
  pauseMusic(): void {
    if (this.musicElement) {
      this.musicElement.pause();
    }
    this.state.isPlaying = false;
  }

  /**
   * 恢复背景音乐
   */
  resumeMusic(): void {
    if (this.musicElement && this.state.currentMusic) {
      this.musicElement.play();
      this.state.isPlaying = true;
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number): void {
    this.state.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
    this.saveConfig();
  }

  /**
   * 设置音乐音量
   */
  setMusicVolume(volume: number): void {
    this.state.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
    this.saveConfig();
  }

  /**
   * 设置音效音量
   */
  setSoundVolume(volume: number): void {
    this.state.config.soundVolume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  /**
   * 更新音乐音量
   */
  private updateMusicVolume(): void {
    if (this.musicElement) {
      this.musicElement.volume = this.state.config.masterVolume * this.state.config.musicVolume;
    }
  }

  /**
   * 切换音乐开关
   */
  toggleMusic(): boolean {
    this.state.config.musicEnabled = !this.state.config.musicEnabled;
    
    if (!this.state.config.musicEnabled) {
      this.pauseMusic();
    } else if (this.state.currentMusic) {
      this.resumeMusic();
    }
    
    this.saveConfig();
    return this.state.config.musicEnabled;
  }

  /**
   * 切换音效开关
   */
  toggleSound(): boolean {
    this.state.config.soundEnabled = !this.state.config.soundEnabled;
    this.saveConfig();
    return this.state.config.soundEnabled;
  }

  /**
   * 获取音频配置
   */
  getConfig(): AudioConfig {
    return { ...this.state.config };
  }

  /**
   * 获取当前播放的音乐
   */
  getCurrentMusic(): MusicType | null {
    return this.state.currentMusic;
  }

  /**
   * 音乐是否正在播放
   */
  isMusicPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * 恢复音频上下文（用户交互后调用）
   */
  async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export const AudioSystem = new AudioSystemClass();
