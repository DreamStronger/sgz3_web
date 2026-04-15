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
  currentPlayer: string;     // 当前玩家势力ID
}
