import type { General, City, Item, Weather } from '@/types';

/**
 * 搜索结果类型
 */
export interface SearchResult {
  type: 'item' | 'general' | 'intel' | 'nothing';
  itemId?: string;
  generalId?: string;
  intel?: {
    targetCity: string;
    info: string;
  };
  message: string;
}

/**
 * 宝物搜索系统
 * 管理城市搜索、宝物发现、人才发现等
 */
export class SearchSystem {
  /**
   * 执行搜索
   */
  static executeSearch(
    general: General,
    city: City,
    items: Record<string, Item>,
    generals: Record<string, General>,
    weather: Weather
  ): SearchResult {
    // 计算搜索成功率
    const successRate = this.calculateSearchSuccessRate(general, city, weather);

    // 随机判定是否成功
    if (Math.random() > successRate) {
      return {
        type: 'nothing',
        message: `${general.name}在城市${city.name}搜索，但一无所获。`
      };
    }

    // 决定发现类型
    const discoveryType = this.determineDiscoveryType(city);

    switch (discoveryType) {
      case 'item':
        return this.discoverItem(general, city, items);

      case 'general':
        return this.discoverGeneral(general, city, generals);

      case 'intel':
        return this.discoverIntel(general, city);

      default:
        return {
          type: 'nothing',
          message: `${general.name}在城市${city.name}搜索，但一无所获。`
        };
    }
  }

  /**
   * 计算搜索成功率
   */
  private static calculateSearchSuccessRate(
    general: General,
    city: City,
    weather: Weather
  ): number {
    let successRate = 0.3; // 基础成功率30%

    // 武将智力影响
    successRate += general.attributes.intelligence / 200; // 最高+50%

    // 城市开发度影响
    successRate += city.stats.development / 200; // 最高+50%

    // 天气影响
    switch (weather) {
      case 'sunny':
        successRate += 0.1;
        break;
      case 'cloudy':
        successRate += 0.05;
        break;
      case 'rain':
        successRate -= 0.1;
        break;
      case 'snow':
        successRate -= 0.2;
        break;
    }

    // 季节影响（通过回合数判断）
    // TODO: 添加季节参数

    return Math.min(0.8, successRate); // 最高80%
  }

  /**
   * 决定发现类型
   */
  private static determineDiscoveryType(city: City): 'item' | 'general' | 'intel' | 'nothing' {
    const rand = Math.random();

    // 根据城市属性决定概率
    let itemChance = 0.4;
    let generalChance = 0.2;
    let intelChance = 0.3;

    // 开发度高的城市更容易发现宝物
    if (city.stats.development > 70) {
      itemChance += 0.1;
    }

    // 商业度高的城市更容易发现情报
    if (city.stats.commerce > 70) {
      intelChance += 0.1;
    }

    if (rand < itemChance) {
      return 'item';
    } else if (rand < itemChance + generalChance) {
      return 'general';
    } else if (rand < itemChance + generalChance + intelChance) {
      return 'intel';
    } else {
      return 'nothing';
    }
  }

  /**
   * 发现宝物
   */
  private static discoverItem(
    general: General,
    city: City,
    items: Record<string, Item>
  ): SearchResult {
    // 查找该城市未装备的宝物
    const availableItems = Object.values(items).filter(
      item => item.location === city.id && !item.owner
    );

    if (availableItems.length === 0) {
      return {
        type: 'nothing',
        message: `${general.name}在城市${city.name}搜索，但未发现宝物。`
      };
    }

    // 随机选择一个宝物
    const item = availableItems[Math.floor(Math.random() * availableItems.length)];

    return {
      type: 'item',
      itemId: item.id,
      message: `${general.name}在城市${city.name}发现了${item.name}！`
    };
  }

  /**
   * 发现人才
   */
  private static discoverGeneral(
    general: General,
    city: City,
    generals: Record<string, General>
  ): SearchResult {
    // 查找该城市的在野武将
    const availableGenerals = Object.values(generals).filter(
      g => g.location === city.id && g.faction === ''
    );

    if (availableGenerals.length === 0) {
      return {
        type: 'nothing',
        message: `${general.name}在城市${city.name}搜索，但未发现人才。`
      };
    }

    // 随机选择一个武将
    const discoveredGeneral = availableGenerals[Math.floor(Math.random() * availableGenerals.length)];

    return {
      type: 'general',
      generalId: discoveredGeneral.id,
      message: `${general.name}在城市${city.name}发现了${discoveredGeneral.name}！`
    };
  }

  /**
   * 发现情报
   */
  private static discoverIntel(
    general: General,
    city: City
  ): SearchResult {
    // 生成随机情报
    const intelTypes = [
      { type: 'military', weight: 0.3 },
      { type: 'resource', weight: 0.3 },
      { type: 'diplomacy', weight: 0.2 },
      { type: 'general', weight: 0.2 }
    ];

    const rand = Math.random();
    let intelType = 'military';
    let cumulative = 0;

    for (const type of intelTypes) {
      cumulative += type.weight;
      if (rand < cumulative) {
        intelType = type.type;
        break;
      }
    }

    // 生成情报内容
    let info = '';
    switch (intelType) {
      case 'military':
        info = '发现敌军正在集结，可能有进攻意图。';
        break;
      case 'resource':
        info = '发现敌方粮草储备不足，士气低落。';
        break;
      case 'diplomacy':
        info = '发现敌方正在与其他势力进行外交接触。';
        break;
      case 'general':
        info = '发现敌方武将忠诚度不高，可能有机可乘。';
        break;
    }

    return {
      type: 'intel',
      intel: {
        targetCity: city.id,
        info
      },
      message: `${general.name}在城市${city.name}获得了重要情报：${info}`
    };
  }

  /**
   * 计算搜索消耗
   */
  static calculateSearchCost(_general: General, city: City): { // general预留参数
    money: number;
    actionPoints: number;
  } {
    return {
      money: 50 + Math.floor(city.stats.development / 2), // 基础50金 + 开发度/2
      actionPoints: 1 // 消耗1点行动力
    };
  }

  /**
   * 检查是否可以搜索
   */
  static canSearch(general: General, city: City, factionMoney: number): {
    canSearch: boolean;
    reason?: string;
  } {
    const cost = this.calculateSearchCost(general, city);

    // 检查金钱
    if (factionMoney < cost.money) {
      return {
        canSearch: false,
        reason: `金钱不足，需要${cost.money}金`
      };
    }

    // 检查武将状态
    if (general.status !== 'active') {
      return {
        canSearch: false,
        reason: '武将状态异常，无法执行搜索'
      };
    }

    // 检查武将位置
    if (general.location !== city.id) {
      return {
        canSearch: false,
        reason: '武将不在该城市'
      };
    }

    return { canSearch: true };
  }
}
