export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionnaireState {
  answers: Record<string, string>;
  isComplete: boolean;
  error: string | null;
} 