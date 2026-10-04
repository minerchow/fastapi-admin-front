import { useStore } from "@/store";
import { observer } from "mobx-react";
import React from "react";

const Display = () => {
  const store = useStore();

  return (
    <div>
      <p>当前计数: {store.countStore.count}</p>
    </div>
  );
};
export default React.memo(observer(Display));
