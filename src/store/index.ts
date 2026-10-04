// export * from './count';
// stores/index.ts
import { createContext, useContext } from "react";
import CountStore from "./count";
import MenuStore from "./menu";
import UserStore from "./user";

class RootStore {
  countStore = new CountStore();
  menuStore = new MenuStore();
  userStore = new UserStore();
}

const rootStore = new RootStore();

// 创建 Context
const StoreContext = createContext(rootStore);

// 自定义 Hook 使用 store
export const useStore = () => {
  return useContext(StoreContext);
};

export default rootStore;
