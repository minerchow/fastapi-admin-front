import { getCookie, setCookie, removeCookie } from "@/utils/cookie";
import type { TokenData } from "@/types/user";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// 提前 5 分钟刷新，避免请求途中刚好过期
const REFRESH_THRESHOLD_SECONDS = 5 * 60;

export const getAccessToken = (): string | null => getCookie(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  getCookie(REFRESH_TOKEN_KEY);

/**
 * 解析 JWT payload 中的 exp（秒级时间戳），解析失败返回 null
 */
const decodeJwtExp = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
};

/**
 * 从当前起到 token 过期(exp)的剩余秒数，无法解析 exp 返回 null
 */
const remainingSeconds = (token: string): number | null => {
  const exp = decodeJwtExp(token);
  if (exp === null) return null;
  return Math.floor(exp - Date.now() / 1000);
};

export const setTokens = (token: TokenData) => {
  // accessToken 提前 5 分钟刷新，cookie 的过期时间与之对齐（exp - now - 阈值）
  const accessRemaining = remainingSeconds(token.access_token);
  const accessMaxAge =
    accessRemaining !== null
      ? accessRemaining - REFRESH_THRESHOLD_SECONDS
      : token.expires_in - REFRESH_THRESHOLD_SECONDS;
  setCookie(ACCESS_TOKEN_KEY, token.access_token, Math.max(accessMaxAge, 0));

  // refreshToken 使用自身过期时间；解析不到 exp 时不设过期（会话 cookie）
  if (token.refresh_token) {
    const refreshRemaining = remainingSeconds(token.refresh_token);
    setCookie(
      REFRESH_TOKEN_KEY,
      token.refresh_token,
      refreshRemaining !== null ? Math.max(refreshRemaining, 0) : undefined
    );
  }
};

export const clearTokens = () => {
  removeCookie(ACCESS_TOKEN_KEY);
  removeCookie(REFRESH_TOKEN_KEY);
};

/**
 * accessToken 是否缺失，或距离过期不足 thresholdSeconds（默认 5 分钟）
 */
export const isAccessTokenExpiring = (
  thresholdSeconds: number = REFRESH_THRESHOLD_SECONDS
): boolean => {
  const token = getAccessToken();
  if (!token) return true;
  const exp = decodeJwtExp(token);
  if (exp === null) {
    // 无法解析 exp 时，退回到 cookie 的 Max-Age 判断：cookie 还在即视为有效
    return false;
  }
  const remainingMs = exp * 1000 - Date.now();
  return remainingMs <= thresholdSeconds * 1000;
};
