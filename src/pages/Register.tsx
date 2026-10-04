import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Card, Form, Input, message } from "antd";
import { register } from "@/api/user";
import { RegisterParams } from "@/types/user";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<RegisterParams>();

  const onFinish = async (values: RegisterParams) => {
    setLoading(true);
    try {
      const res = await register(values);
      if (res.code === 200) {
        message.success(res.message || "注册成功");
        navigate("/login", { replace: true });
      } else {
        message.error(res.message || "注册失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<RegisterParams>
      name="register"
      form={form}
      onFinish={onFinish}
      size="large"
    >
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
        <Input.Password placeholder="密码" autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirm_password"
        dependencies={["password"]}
        rules={[
          { required: true, message: "请再次输入密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次密码输入不一致"));
            },
          }),
        ]}
      >
        <Input.Password placeholder="确认密码" autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          注册
        </Button>
      </Form.Item>
      <div style={{ textAlign: "center" }}>
        已有账号？<Link to="/login">去登录</Link>
      </div>
    </Form>
  );
};

const Register = () => (
  <div
    className="register-page"
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0f2f5",
    }}
  >
    <Card title="注册" style={{ width: 380 }}>
      <RegisterForm />
    </Card>
  </div>
);

export default Register;
