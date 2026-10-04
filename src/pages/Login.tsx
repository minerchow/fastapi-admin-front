import { useState, type CSSProperties } from "react";
import { useNavigate, Link } from "react-router-dom";
import { observer } from "mobx-react";
import { Button, Card, Form, Input, message } from "antd";
import { login } from "@/api/user";
import rootStore from "@/store";
import { LoginParams } from "@/types/user";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginParams) => {
    setLoading(true);
    try {
      const res = await login(values);
      if (res.code === 200 && res.data) {
        rootStore.userStore.setLoginResult(res.data);
        message.success(res.message || "登录成功");
        navigate("/home", { replace: true });
      } else {
        message.error(res.message || "登录失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<LoginParams> name="login" onFinish={onFinish} size="large">
      <Form.Item
        name="username"
        rules={[
          { required: true, message: "请输入用户名" },
          { max: 50, message: "用户名不能超过50个字符" },
        ]}
      >
        <Input placeholder="用户名" autoComplete="username" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          { required: true, message: "请输入密码" },
          { min: 6, message: "密码至少6位" },
        ]}
      >
        <Input.Password placeholder="密码" autoComplete="current-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          登录
        </Button>
      </Form.Item>
      <div style={{ textAlign: "center" }}>
        还没有账号？<Link to="/register">立即注册</Link>
      </div>
    </Form>
  );
};

const Login = () => {
  const { userStore } = rootStore;
  if (userStore.isLogin && userStore.user) {
    return (
      <div className="login-page" style={pageStyle}>
        <Card title="已登录" style={cardStyle}>
          <p>当前登录用户：{userStore.user.username}</p>
          <Button type="primary" href="/home" block size="large">
            进入首页
          </Button>
          <Button
            block
            size="large"
            style={{ marginTop: 12 }}
            onClick={() => {
              userStore.logout();
              message.success("已退出登录");
            }}
          >
            退出登录
          </Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="login-page" style={pageStyle}>
      <Card title="登录" style={cardStyle}>
        <LoginForm />
      </Card>
    </div>
  );
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f0f2f5",
};

const cardStyle: CSSProperties = { width: 380 };

export default observer(Login);
