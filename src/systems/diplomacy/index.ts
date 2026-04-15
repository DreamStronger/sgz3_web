/**
 * 外交系统模块导出
 */

export { 
  DiplomacySystem, 
  DiplomacyStatus, 
  DiplomacyAction,
  type DiplomacyResult,
  type DiplomacyProposal
} from './DiplomacySystem';

export { 
  SpySystem, 
  SpyStatus, 
  SpyMission,
  type Spy,
  type IntelligenceReport,
  type SpyActionResult
} from './SpySystem';

export { 
  EventSystem, 
  EventType,
  type HistoricalEvent,
  type EventCondition,
  type EventEffect,
  type EventTriggerResult
} from './EventSystem';
