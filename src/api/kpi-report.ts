import {
  ICallKpiTargetListParams,
  ICallKpiTargetListResponse,
} from "@/types/kpi-report";
import { get } from "@/utils/http";

export const queryCallKpiTargetList = (
  params: ICallKpiTargetListParams
): Promise<ICallKpiTargetListResponse> => {
  return get({
    url: "xxxx/callKpiTargetManage/queryCallKpiTargetList",
    params: params,
  });
};
