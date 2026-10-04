// stores/userStore.ts
import { makeAutoObservable } from "mobx";
import { LoginResult, TokenData, UserInfo } from "@/types/user";
import { getAccessToken, setTokens, clearTokens } from "@/utils/auth";

const USER_KEY = "userInfo";

function readUser(): UserInfo | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

class UserStore {
  user: UserInfo | null = readUser();

  constructor() {
    makeAutoObservable(this);
  }

  get isLogin() {
    return !!getAccessToken();
  }

  setLoginResult = ({ user, token }: LoginResult) => {
    this.setToken(token);
    this.setUser(user);
  };

  setToken = (token: TokenData) => {
    setTokens(token);
  };

  setUser = (user: UserInfo) => {
    this.user = user;
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  logout = () => {
    this.user = null;
    clearTokens();
    sessionStorage.removeItem(USER_KEY);
  };
}

export default UserStore;
