export interface Element {
  id: string;
  name: string;
  emoji: string;
  image_url: string | null;
  thumbnail_url: string | null;
  is_initial: boolean;
  created_at: string;
}

export interface Combination {
  id: string;
  element_a_id: string;
  element_b_id: string;
  result_id: string | null;
  status: 'pending' | 'generating' | 'done' | 'failed';
  created_at: string;
}

export interface CombineRequest {
  elementAId: string;
  elementBId: string;
  elementAName: string;
  elementBName: string;
}

export interface CombineResponse {
  result: Element;
  isNew: boolean;
}
