/**
 * 基础响应接口
 * 所有接口响应都应该继承这个接口
 */
export interface BaseResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success?: boolean;
  msg?: string;
  code?: number;
}

/**
 * 分页响应数据的基础接口
 */
export interface PageData<T = any> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

/**
 * 分页响应接口
 */
export interface PageResponse<T = any> extends BaseResponse<PageData<T>> {
  data: PageData<T>;
}

/**
 * 直接分页响应接口
 * 用于分页数据直接包含在响应体顶层的情况
 */
export interface DirectPageResponse<T = any> extends BaseResponse {
  list: T[];
  total: number;
  page?: number;
  size?: number;
}
