import { DirectPageResponse } from "./base";
export interface ICallKpiTargetList {
  id: number;
  name: string;
  userName: string;
  deptName: string;
  callTimeTarget: number;
  enabledStatus: string;
}

export interface ICallKpiTargetListParams {
  deptIds?: string;
  name?: string;
  userNo?: string;
  page: number;
  limit: number;
  deptIdsArr?: string[];
  id?: number;
}

export interface ICallKpiTargetListResponse extends DirectPageResponse<ICallKpiTargetList> {
  list: ICallKpiTargetList[];
  total: number;
}
