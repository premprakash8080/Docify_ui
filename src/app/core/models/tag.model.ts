export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId?: string; // optional if tags are shared
  createdAt?: string;
}

