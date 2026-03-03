export interface Word {
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
  word_a_id: string;
  word_b_id: string;
  result_id: string | null;
  status: 'pending' | 'generating' | 'done' | 'failed';
  created_at: string;
}

export interface CombineRequest {
  wordAId: string;
  wordBId: string;
  wordAName: string;
  wordBName: string;
}

export interface CombineResponse {
  result: Word;
  isNew: boolean;
}
