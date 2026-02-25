export interface BlogPost {
  id: string;
  date: string;
  title: string;
  description: string;
  badges: string[];
  category: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

export interface BlogPostDto {
  id: string;
  date: string;
  title: string;
  description: string;
  badges: string[];
  category: string;
  mediaSrc?: string;
  mediaAlt?: string;
}
