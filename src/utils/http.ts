// 修复第一行的导入
import { baseUrl } from "@/config/common";

import axios from "axios";
import rootStore from "@/store";
import {
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiring,
  setTokens,
} from "@/utils/auth";
import type { ApiResponse, TokenData } from "@/types/user";
// 创建 axios 实例
const service = axios.create({
  // 基础URL，可根据环境变量配置
  baseURL: baseUrl(),
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

// 使用 refreshToken 换取新的 accessToken，多个并发请求共享同一次刷新
let refreshPromise: Promise<string | null> | null = null;

// refreshToken 缺失或已失效：清理登录态并跳转登录页
const redirectToLogin = () => {
  rootStore.userStore.logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const refreshAccessToken = (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    redirectToLogin();
    return Promise.resolve(null);
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<TokenData>>(
        baseUrl() + "/api/users/refresh",
        { refresh_token: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((res) => {
        console.log("res", res);
        const data = res.data?.data;
        if (res.data?.code === 200 && data?.access_token) {
          setTokens(data);
          return getAccessToken();
        }
        // 业务码非 200 但 HTTP 正常：不确定是 refreshToken 过期，不强制跳登录
        return null;
      })
      .catch((err) => {
        console.log("err", err);
        // 仅当 refreshToken 明确无效/过期（401）才跳登录，其它错误(网络/5xx)不强跳
        // if (err?.response?.status === 401) {
        //   redirectToLogin();
        // }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// 请求拦截器
service.interceptors.request.use(
  async (config: any) => {
    // 如果没有明确指定不需要token，则添加token
    if (!config.noToken) {
      // accessToken 缺失或距离过期不足 5 分钟时，用 refreshToken 换取新的 token
      const accessToken = isAccessTokenExpiring()
        ? await refreshAccessToken()
        : getAccessToken();
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    // 删除noToken属性，避免发送到服务器
    delete config.noToken;
    return config;
  },
  (error: any) => {
    // 处理请求错误
    console.error("请求错误:", error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: any) => {
    // 直接返回响应的data对象，这样所有通过service的请求都会返回data
    return response.data;
  },
  async (error: any) => {
    // 处理响应错误
    console.error("响应错误:", error);
    const config = error?.config;
    if (error.response?.status === 401 && config && !config.__isRetry) {
      // accessToken 已失效，尝试用 refreshToken 刷新后重试一次
      config.__isRetry = true;
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
        return service.request(config);
      }
    }

    return Promise.reject(error);
  }
);

// Content-Type 枚举
export enum ContentType {
  JSON = "application/json",
  FORM_URLENCODED = "application/x-www-form-urlencoded",
  FORM_DATA = "multipart/form-data",
}

/**
 * 处理 x-www-form-urlencoded 格式的数据
 * @param data 需要转换的数据
 * @returns 转换后的字符串
 */
const transformFormData = (data: Record<string, any>): string => {
  const formData = new URLSearchParams();
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      formData.append(key, String(data[key]));
    }
  }
  return formData.toString();
};

/**
 * GET 请求方法
 * @param options 请求选项
 * @returns Promise - 返回axios响应的data对象
 */
export const get = ({
  url,
  params,
  config,
}: {
  url: string;
  params?: Record<string, any>;
  contentType?: ContentType;
  config?: any;
}): Promise<any> => {
  // GET请求不需要Content-Type头，但明确指定Accept为JSON
  const headers = {
    Accept: "application/json",
  };

  return new Promise((resolve, reject) => {
    console.log("GET 请求:", baseUrl() + url, { params, headers, ...config });
    service
      .get(baseUrl() + url, { params, headers, ...config })
      .then((response: any) => {
        // 返回axios响应的data对象
        resolve(response);
      })
      .catch((error: any) => {
        reject(error);
      });
  });
};

/**
 * POST 请求方法
 * @param options 请求选项
 * @returns Promise - 返回axios响应的data对象
 */
export const post = ({
  url,
  data,
  contentType = ContentType.JSON,
  config,
}: {
  url: string;
  data?: Record<string, any>;
  contentType?: ContentType;
  config?: any;
}): Promise<any> => {
  // 根据 contentType 处理数据
  const headers = { "Content-Type": contentType };

  return new Promise((resolve, reject) => {
    if (contentType === ContentType.FORM_URLENCODED && data) {
      service
        .post(baseUrl() + url, transformFormData(data), { headers, ...config })
        .then((response: any) => {
          // 返回axios响应的data对象
          resolve(response);
        })
        .catch((error: any) => {
          reject(error);
        });
    } else {
      service
        .post(baseUrl() + url, data, { headers, ...config })
        .then((response: any) => {
          // 返回axios响应的data对象
          resolve(response);
        })
        .catch((error: any) => {
          reject(error);
        });
    }
  });
};

/**
 * PUT 请求方法
 * @param options 请求选项
 * @returns Promise - 返回axios响应的data对象
 */
export const put = ({
  url,
  data,
  contentType = ContentType.JSON,
  config,
}: {
  url: string;
  data?: Record<string, any>;
  contentType?: ContentType;
  config?: any;
}): Promise<any> => {
  // 根据 contentType 处理数据
  const headers = { "Content-Type": contentType };

  return new Promise((resolve, reject) => {
    if (contentType === ContentType.FORM_URLENCODED && data) {
      service
        .put(baseUrl() + url, transformFormData(data), { headers, ...config })
        .then((response: any) => {
          // 返回axios响应的data对象
          resolve(response);
        })
        .catch((error: any) => {
          reject(error);
        });
    } else {
      service
        .put(baseUrl() + url, data, { headers, ...config })
        .then((response: any) => {
          // 返回axios响应的data对象
          resolve(response);
        })
        .catch((error: any) => {
          reject(error);
        });
    }
  });
};

/**
 * DELETE 请求方法
 * @param options 请求选项
 * @returns Promise - 返回axios响应的data对象
 */
export const del = ({
  url,
  params,
  config,
}: {
  url: string;
  params?: Record<string, any>;
  config?: any;
}): Promise<any> => {
  // DELETE 不携带请求体，只明确 Accept 为 JSON
  const headers = {
    Accept: "application/json",
  };

  return new Promise((resolve, reject) => {
    service
      .delete(baseUrl() + url, { params, headers, ...config })
      .then((response: any) => {
        // 返回axios响应的data对象
        resolve(response);
      })
      .catch((error: any) => {
        reject(error);
      });
  });
};

export default service;
