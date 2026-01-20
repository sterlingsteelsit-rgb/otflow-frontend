export type Role = {
  id: string;
  name: "admin" | "manager" | "supervisor" | string;
  permissions: string[];
};

export type User = {
  id: string;
  email: string;
  username: string;
  canApprove: boolean;
  role: Role;
};

export type AuthState = {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
};
