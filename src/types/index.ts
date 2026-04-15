// 武将数据模型
export interface General {
  id: string;
  name: string;
  faction: string;          // 所属势力
  attributes: {
    command: number;        // 统率 (1-100)
    force: number;           // 武力 (1-100)
    intelligence: number;    // 智力 (1-100)
    politics: number;        // 政治 (1-100)
    charm: number;           // 魅力 (1-100)
  };
  skills: string[];          // 技能列表
  loyalty: number;           // 忠诚度 (0-100)
  location: string;           // 所在城市ID
  items: string[];           // 装备的宝物ID
  status: 'active' | 'captured' | 'dead';
  personality: 'brave' | 'timid' | 'righteous' | 'calm' | 'rash' | 'normal'; // 性格
  title?: string;             // 官职ID
  merit: number;              // 功勋值
  experience: number;         // 经验值
  history: {
    formerLords: string[];   // 前主公
    battles: number;         // 参战次数
    victories: number;       // 胜利次数
  };
}

// 官职数据模型
export interface Title {
  id: string;
  name: string;
  level: number;              // 官职等级 (1-10)
  effects: {
    command?: number;         // 统率加成
    force?: number;           // 武力加成
    intelligence?: number;    // 智力加成
    politics?: number;        // 政治加成
    charm?: number;           // 魅力加成
    loyaltyBonus: number;     // 忠诚度加成
    maxSoldiers: number;      // 带兵上限
  };
  requirements: {
    minMerit: number;         // 最低功勋
    minCommand?: number;      // 最低统率
    minForce?: number;        // 最低武力
    minIntelligence?: number; // 最低智力
  };
  cost: number;               // 封官花费
  salary: number;             // 俸禄（每回合消耗）
}

// 武将关系数据模型
export interface GeneralRelation {
  general1: string;         // 武将1 ID
  general2: string;         // 武将2 ID
  type: 'father' | 'son' | 'brother' | 'friend' | 'enemy' | 'former_lord';
  intimacy: number;         // 亲密值 (-100 to 100)
  history?: string;         // 关系历史描述
}

// 城市数据模型
export interface City {
  id: string;
  name: string;
  faction: string;          // 所属势力
  state: string;            // 所属州
  position: { x: number; y: number };
  terrain: 'plain' | 'mountain' | 'water' | 'pass';
  stats: {
    population: number;      // 人口
    development: number;     // 开发度 (0-100)
    commerce: number;        // 商业度 (0-100)
    defense: number;         // 城防 (0-100)
    morale: number;          // 民心 (0-100)
  };
  resources: {
    money: number;           // 金钱
    food: number;            // 粮草
    soldiers: number;        // 士兵
  };
  facilities: {
    market: number;          // 市场等级
    farm: number;            // 农场等级
    barracks: number;        // 兵营等级
    wall: number;            // 城墙等级
  };
  generals: string[];        // 驻守武将ID
  neighbors: string[];       // 相邻城市ID
}

// 势力数据模型
export interface Faction {
  id: string;
  name: string;
  ruler: string;             // 君主武将ID
  color: string;             // 势力颜色（地图显示）
  cities: string[];          // 控制的城市ID
  generals: string[];        // 所属武将ID
  resources: {
    money: number;           // 总金钱
    food: number;            // 总粮草
    soldiers: number;        // 总兵力
  };
  diplomacy: {
    [factionId: string]: {
      relation: number;      // 关系值 (-100 to 100)
      status: 'ally' | 'neutral' | 'enemy' | 'truce';
      treatyEnd?: number;    // 条约结束回合
    };
  };
  isPlayer: boolean;         // 是否玩家势力
}

// 军队单位
export interface Unit {
  type: 'infantry' | 'cavalry' | 'archer' | 'navy';
  count: number;
  morale: number;
  fatigue: number;          // 疲劳度 (0-100)
  experience: number;       // 经验值，影响战斗力
  general?: string;
}

// 军队移动状态
export interface ArmyMovement {
  targetCity: string;        // 目标城市ID
  progress: number;          // 移动进度 (0-100)
  turnsRemaining: number;    // 剩余回合数
  path: string[];            // 移动路径（城市ID数组）
  startedTurn: number;       // 开始移动的回合
}

// 军队
export interface Army {
  id: string;
  faction: string;
  location: string;         // 所在城市或位置
  units: Unit[];
  generals: string[];        // 主将和副将
  formation: string;         // 当前阵型
  status: 'idle' | 'moving' | 'fighting' | 'resting';
  supplies: {
    food: number;            // 携带的粮草
    maxFood: number;         // 最大携带量
  };
  movement?: ArmyMovement;    // 移动状态
  morale: number;            // 军队士气 (0-100)
  fatigue: number;           // 军队疲劳度 (0-100)
}

// 宝物数据模型
export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'book' | 'horse' | 'special';
  effects: {
    command?: number;
    force?: number;
    intelligence?: number;
    politics?: number;
    charm?: number;
    special?: string;        // 特殊效果
  };
  location?: string;         // 所在城市ID或武将ID
  owner?: string;            // 持有武将ID
  description: string;
}

// 天气类型
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'snow';

// 阵型类型
export type FormationType = 'fish_scale' | 'arrow' | 'goose' | 'circle' | 'snake' | 'crane';

// 阵型数据模型
export interface Formation {
  id: FormationType;
  name: string;
  attackBonus: number;       // 攻击加成（百分比）
  defenseBonus: number;      // 防御加成（百分比）
  mobilityBonus: number;     // 移动加成（百分比）
  description: string;
}

// 战斗类型
export type BattleType = 'field' | 'siege' | 'water';

// 战斗数据模型
export interface Battle {
  id: string;
  type: BattleType;
  attacker: {
    faction: string;
    generals: string[];
    units: Unit[];
    formation: FormationType;
  };
  defender: {
    faction: string;
    generals: string[];
    units: Unit[];
    formation: FormationType;
  };
  location: string;           // 战斗地点（城市ID或位置）
  terrain: string;
  weather: Weather;
  tactics: string[];          // 使用的战术
  stratagems: string[];       // 使用的计谋
  turn: number;               // 战斗回合数
  status: 'ongoing' | 'attacker_win' | 'defender_win' | 'draw';
  result?: {
    winner: string;
    casualties: { attacker: number; defender: number };
    captives: string[];       // 俘虏武将
    items: string[];          // 缴获宝物
    experience: { attacker: number; defender: number };
  };
}

// 单挑数据模型
export interface Duel {
  id: string;
  battle: string;             // 所属战斗ID
  attacker: string;           // 发起方武将ID
  defender: string;           // 应战方武将ID
  turn: number;               // 单挑回合数
  attackerHP: number;         // 发起方生命值
  defenderHP: number;         // 应战方生命值
  status: 'ongoing' | 'attacker_win' | 'defender_win' | 'draw' | 'rejected';
  result?: {
    winner: string;
    loser: string;
    loserCaptured: boolean;   // 失败方是否被俘
    moraleEffect: { attacker: number; defender: number };
  };
}

// 俘虏数据模型
export interface Captive {
  generalId: string;          // 被俘武将ID
  capturedBy: string;         // 俘虏方势力ID
  capturedAt: string;         // 被俘城市ID
  capturedTurn: number;       // 被俘回合
  status: 'imprisoned' | 'persuading' | 'ransom' | 'released' | 'executed';
  persuasionAttempts: number; // 招降尝试次数
  loyaltyDrop: number;        // 忠诚度下降值
}

// 战术类型
export type TacticsType = 'ambush' | 'fire_attack' | 'water_attack' | 'surprise_attack' | 'raid';

// 战术数据模型
export interface Tactics {
  id: TacticsType;
  name: string;
  type: 'offensive' | 'defensive';
  damageBonus: number;       // 伤害加成
  successRate: number;       // 基础成功率
  requirements: {
    terrain?: string[];      // 需要的地形
    weather?: Weather[];    // 需要的天气
    minIntelligence?: number; // 最低智力要求
  };
  cooldown: number;          // 冷却回合数
  description: string;
}

// 计谋类型
export type StratagemType = 'alienate' | 'false_report' | 'confuse' | 'persuade' | 'incite';

// 计谋数据模型
export interface Stratagem {
  id: StratagemType;
  name: string;
  target: 'general' | 'army' | 'city';
  effect: {
    loyaltyChange?: number;   // 忠诚度变化
    moraleChange?: number;    // 士气变化
    confuse?: boolean;        // 是否造成混乱
    retreat?: boolean;        // 是否强制撤退
  };
  successRate: number;       // 基础成功率
  requirements: {
    minIntelligence: number;  // 最低智力要求
    targetLoyalty?: number;   // 目标忠诚度要求
  };
  description: string;
}

// 游戏状态
export interface GameState {
  turn: number;              // 当前回合
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: Weather;          // 当前天气
  scenario: string;         // 剧本ID
  factions: Record<string, Faction>;
  cities: Record<string, City>;
  generals: Record<string, General>;
  items: Record<string, Item>;
  armies: Record<string, Army>;
  battles: Record<string, Battle>;      // 战斗记录
  captives: Captive[];                   // 俘虏列表
  currentPlayer: string;     // 当前玩家势力ID
}
