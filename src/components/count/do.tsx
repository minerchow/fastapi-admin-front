import { useStore } from "../../store";

const Do = () => {
  const store = useStore();

  return (
    <div>
      <button onClick={store.countStore.increment}>增加</button>
      <button onClick={store.countStore.decrement}>减少</button>
      <button onClick={store.countStore.reset}>重置</button>
    </div>
  );
};

export default Do;
