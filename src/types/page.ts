export interface PageParams {
  page: number;
  page_size: number;
}

export interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
