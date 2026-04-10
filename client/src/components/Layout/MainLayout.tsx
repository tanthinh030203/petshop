import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Badge,
  Space,
  Breadcrumb,
  Select,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  HeartOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  ScissorOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TagsOutlined,
  InboxOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  BankOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';

const { Header, Sider, Content, Footer } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: 'customers-group',
    icon: <TeamOutlined />,
    label: 'Khach hang & Thu cung',
    children: [
      { key: '/customers', label: 'Khach hang' },
      { key: '/pets', label: 'Thu cung' },
    ],
  },
  {
    key: 'appointments-group',
    icon: <CalendarOutlined />,
    label: 'Lich hen',
    children: [
      { key: '/appointments', label: 'Danh sach' },
      { key: '/appointments/calendar', label: 'Lich' },
    ],
  },
  {
    key: 'medical-group',
    icon: <MedicineBoxOutlined />,
    label: 'Y te',
    children: [
      { key: '/medical', label: 'Ho so kham benh' },
      { key: '/vaccinations', label: 'Tiem phong' },
    ],
  },
  {
    key: '/grooming',
    icon: <ScissorOutlined />,
    label: 'Grooming & Spa',
  },
  {
    key: '/hotel',
    icon: <HomeOutlined />,
    label: 'Hotel thu cung',
  },
  {
    key: '/pos',
    icon: <ShoppingCartOutlined />,
    label: 'Ban hang (POS)',
  },
  {
    key: 'products-group',
    icon: <AppstoreOutlined />,
    label: 'San pham & Kho',
    children: [
      { key: '/products', icon: <TagsOutlined />, label: 'San pham' },
      { key: '/products/categories', label: 'Danh muc' },
      { key: '/stock', icon: <InboxOutlined />, label: 'Ton kho' },
    ],
  },
  {
    key: 'invoices-group',
    icon: <FileTextOutlined />,
    label: 'Hoa don',
    children: [
      { key: '/invoices', label: 'Danh sach hoa don' },
    ],
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Bao cao',
  },
  {
    key: 'settings-group',
    icon: <SettingOutlined />,
    label: 'Cai dat',
    children: [
      { key: '/settings/branches', icon: <BankOutlined />, label: 'Chi nhanh' },
      { key: '/settings/users', icon: <UserOutlined />, label: 'Nguoi dung' },
    ],
  },
];

// Map paths to breadcrumb labels
const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Khach hang',
  '/pets': 'Thu cung',
  '/appointments': 'Lich hen',
  '/appointments/calendar': 'Lich',
  '/medical': 'Ho so kham benh',
  '/vaccinations': 'Tiem phong',
  '/grooming': 'Grooming & Spa',
  '/hotel': 'Hotel thu cung',
  '/pos': 'Ban hang',
  '/products': 'San pham',
  '/products/categories': 'Danh muc',
  '/stock': 'Ton kho',
  '/invoices': 'Hoa don',
  '/reports': 'Bao cao',
  '/settings/branches': 'Chi nhanh',
  '/settings/users': 'Nguoi dung',
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: logoutStore } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logoutStore();
      navigate('/login');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Ho so ca nhan',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Dang xuat',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Build breadcrumb items
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { title: <DashboardOutlined />, href: '/' },
    ...pathSegments.map((_, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        title: breadcrumbMap[path] || pathSegments[index],
      };
    }),
  ];

  // Determine selected and open keys
  const selectedKey = location.pathname;
  const openKeys = menuItems
    ?.filter(
      (item) =>
        item &&
        'children' in item &&
        item.children?.some((child) => child && 'key' in child && child.key === selectedKey),
    )
    .map((item) => (item as { key: string }).key) ?? [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <HeartOutlined
            style={{ fontSize: 24, color: '#ff4d94', marginRight: collapsed ? 0 : 8 }}
          />
          {!collapsed && (
            <span
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              PetShop
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Space>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(false)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(true)}
              />
            )}
          </Space>

          <Space size="middle">
            <Select
              defaultValue="main"
              style={{ width: 180 }}
              options={[
                { value: 'main', label: user?.branch?.name || 'Chi nhanh chinh' },
              ]}
            />

            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.avatar_url}
                />
                <span>{user?.full_name || 'User'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '16px 24px' }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>

        <Footer style={{ textAlign: 'center', color: '#999' }}>
          &copy; 2026 PetShop
        </Footer>
      </Layout>
    </Layout>
  );
}
