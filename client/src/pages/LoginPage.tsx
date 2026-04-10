import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, HeartOutlined } from '@ant-design/icons';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { LoginRequest } from '@/types';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const result = await authService.login(values.username, values.password);
      setAuth(result.user, result.access_token);
      message.success('Dang nhap thanh cong!');
      navigate(from, { replace: true });
    } catch {
      message.error('Sai tai khoan hoac mat khau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, borderRadius: 12 }} bordered={false}>
        <Space
          direction="vertical"
          align="center"
          style={{ width: '100%', marginBottom: 24 }}
        >
          <HeartOutlined style={{ fontSize: 48, color: '#ff4d94' }} />
          <Title level={3} style={{ margin: 0 }}>
            PetShop
          </Title>
          <Text type="secondary">Dang nhap he thong quan ly</Text>
        </Space>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui long nhap ten dang nhap' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Ten dang nhap"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui long nhap mat khau' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mat khau"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Dang nhap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
