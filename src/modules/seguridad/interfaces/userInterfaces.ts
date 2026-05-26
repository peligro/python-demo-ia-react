export interface UserResponse {
  id: number;
  name: string;
  email: string;
  metadata?: {
    id: number;
    phone: string | null;
    state_id: number | null;
    profile_id: number | null;
  };
  profile?: { id: number; name: string; description: string } | null;
  state?: { id: number; name: string } | null;
  modules?: Array<{
    id: number;
    name: string;
    slug: string;
    items: Array<{ id: number; name: string; code: string }>;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}
