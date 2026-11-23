export type Subject = 'Maths' | 'Physics' | 'Biology' | 'Chemistry';

export interface ConceptDefinition {
  id: string;
  number: number;
  name: string;
  subject: Subject;
  prompt: string;
  description: string;
}

export type ValidationCheckId =
  | 'xml_valid'
  | 'viewbox_bounds'
  | 'title_and_labels'
  | 'has_animation'
  | 'security_clean';

export interface ValidationCheckResult {
  checkId: ValidationCheckId;
  name: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationSummary {
  isValid: boolean;
  checks: ValidationCheckResult[];
  errors: string[];
}

export interface GenerationMetadata {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  apiRetries: number;
  validationRetries: number;
  totalTimeMs: number;
  generatedAt: string;
}

export type ReviewStatus = 'approved' | 'rejected' | 'pending';

export interface ReviewDecision {
  status: ReviewStatus;
  notes: string;
  reviewedAt?: string;
}

export interface DiagramResult {
  id: string;
  conceptId: string;
  conceptName: string;
  subject: Subject;
  prompt: string;
  svg: string;
  validation: ValidationSummary;
  metadata: GenerationMetadata;
  review?: ReviewDecision;
}

export interface StatsData {
  totalDiagrams: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  passRatePercentage: number;
  totalApiRetries: number;
  totalValidationRetries: number;
}
