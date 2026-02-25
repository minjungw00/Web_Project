export interface MiniGame {
  id: string;
  to: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}

export interface MiniGameDto {
  id: string;
  to: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}
