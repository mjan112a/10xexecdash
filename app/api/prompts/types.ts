export interface PromptCategory {
  primary: string;
  secondary?: string;
  tertiary?: string;
}

export interface PromptMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Prompt {
  id: string;
  promptId: string;
  version: number;
  isLatest: boolean;
  category: PromptCategory;
  title: string;
  template: string;
  metadata: PromptMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptRequest {
  promptId: string;
  category: PromptCategory;
  title: string;
  template: string;
  metadata: Omit<PromptMetadata, 'createdAt' | 'updatedAt'>;
}

export interface UpdatePromptRequest extends Omit<CreatePromptRequest, 'promptId'> {
  promptId: string;
} 