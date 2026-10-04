import { queryCallKpiTargetList } from "@/api/kpi-report";
import { Button } from "antd";

const Home = () => {
  const getList = async () => {
    const res = await queryCallKpiTargetList({
      page: 1,
      limit: 10,
    });
    console.log(res);
    if (res.code === 0) {
      console.log(res.list);
    }
  };
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <Button type="primary" onClick={getList}>
        get请求
      </Button>
    </div>
  );
};

export default Home;
