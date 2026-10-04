export interface RoleBrief {
  id: number;
  name: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string | null;
  avatar?: string | null;
  roles: RoleBrief[];
}

export interface UserRoleUpdate {
  role_ids: number[];
}

export interface UserListParams {
  page: number;
  page_size: number;
}

export interface UserListData {
  items: UserInfo[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResult {
  user: UserInfo;
  token: TokenData;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirm_password: string;
}
