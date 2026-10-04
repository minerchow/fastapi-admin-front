import {
  ApiResponse,
  LoginParams,
  LoginResult,
  RegisterParams,
  TokenData,
  UserInfo,
  UserListData,
  UserListParams,
  UserRoleUpdate,
} from "@/types/user";
import { post, get, put } from "@/utils/http";

export const login = (data: LoginParams): Promise<ApiResponse<LoginResult>> =>
  post({
    url: "/api/users/login",
    data,
    config: { noToken: true },
  });

export const register = (
  data: RegisterParams
): Promise<ApiResponse<UserInfo>> =>
  post({
    url: "/api/users/register",
    data,
    config: { noToken: true },
  });

export const refreshToken = (
  refresh_token: string
): Promise<ApiResponse<TokenData>> =>
  post({
    url: "/api/users/refresh",
    data: { refresh_token },
    config: { noToken: true },
  });

export const getUserInfo = (): Promise<ApiResponse<UserInfo>> =>
  get({ url: "/api/users/info" });

export const getUserList = (
  params: UserListParams
): Promise<ApiResponse<UserListData>> => get({ url: "/api/users", params });

export const assignUserRoles = (
  userId: number,
  data: UserRoleUpdate
): Promise<ApiResponse<UserInfo>> =>
  put({ url: `/api/users/${userId}/roles`, data });
