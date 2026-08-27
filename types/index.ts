export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number; 
  frequency: number;
  visibility?: string;
  history: Record<string, 'completed' | 'skipped' | 'failed'>;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  dailyProgress: number; 
  friendStatus: 'friends' | 'pending' | 'none'; 
}