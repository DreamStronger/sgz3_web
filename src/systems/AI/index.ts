/**
 * AI系统模块导出
 */

export { AISystem, aiSystem, AIDifficulty, type AIConfig, type AITurnDecision } from './AISystem';
export { 
  SituationEvaluator, 
  ThreatLevel, 
  OpportunityLevel, 
  ResourceScarcity, 
  FactionScale,
  type SituationAssessment,
  type FactionStrength,
  type ThreatInfo,
  type OpportunityInfo,
  type ResourceNeeds
} from './SituationEvaluator';
export { 
  DecisionGenerator, 
  DecisionType, 
  DecisionPriority,
  type AIDecision 
} from './DecisionGenerator';
export { WeightSystem, type AIDecisionWeights } from './WeightSystem';
export { 
  PersonalitySystem, 
  RulerPersonality,
  type PersonalityTraits 
} from './PersonalitySystem';
export { AIExecutor, type ExecutionResult } from './AIExecutor';
