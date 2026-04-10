import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { userService } from '@/services/user.service';
import { branchService } from '@/services/branch.service';
import type { User, UserRole, Branch } from '@/types';

const { Title, Text } = Typography;

const roleLabelMap: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  branch_mgr: 'Quản lý',
  veterinarian: 'Bác sĩ',
  receptionist: 'Lễ tân',
  sales_staff: 'Bán hàng',
  groomer: 'Groomer',
  accountant: 'Kế toán',
};

const roleColorMap: Record<UserRole, string> = {
  super_admin: 'red',
  branch_mgr: 'purple',
  veterinarian: 'blue',
  receptionist: 'cyan',
  sales_staff: 'green',
  groomer: 'orange',
  accountant: 'gold',
};

const roleOptions = Object.entries(roleLabelMap).map(([value, label]) => ({
  value,
  label,
}));

export default function UsersPage() {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    branchService.getAll({ limit: 100 }).then((res) => setBranches(res.data)).catch(() => {});
  }, []);

  const fetchUsers = useCallback(
    async (page = 1, pageSize = 10, search = '') => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: pageSize };
        if (search) params.search = search;
        const res = await userService.getAll(params);
        setUsers(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchUsers(pag.current, pag.pageSize, searchText);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchUsers(1, pagination.pageSize, value);
  };

  const openAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      branch_id: user.branch_id,
      role: user.role,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingUser) {
        // Remove password if empty on edit
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        await userService.update(editingUser.id, payload);
        message.success('Cập nhật người dùng thành công');
      } else {
        await userService.create(values);
        message.success('Thêm người dùng thành công');
      }
      setModalOpen(false);
      form.resetFields();
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateStatus(user.id, !user.is_active);
      message.success(
        user.is_active ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản',
      );
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 130,
    },
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (val: string) => val || '—',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (val: string) => val || '—',
    },
    {
      title: 'Chi nhánh',
      key: 'branch',
      width: 150,
      render: (_: unknown, record: User) =>
        record.branch?.name ?? (record.branch_id ? `#${record.branch_id}` : '—'),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role: UserRole) => (
        <Tag color={roleColorMap[role] ?? 'default'}>
          {roleLabelMap[role] ?? role}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 160,
      render: (val: string) =>
        val ? dayjs(val).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 170,
      align: 'center',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title={
              record.is_active
                ? 'Vô hiệu hóa tài khoản này?'
                : 'Kích hoạt tài khoản này?'
            }
            onConfirm={() => handleToggleStatus(record)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger={record.is_active}
              style={!record.is_active ? { color: '#52c41a' } : undefined}
            >
              {record.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Quản lý người dùng
          </Title>
          <Text type="secondary">Cài đặt tài khoản &amp; phân quyền</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="Tìm theo tên hoặc username"
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm người dùng
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        locale={{ emptyText: 'Chưa có người dùng nào' }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingUser ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Vui lòng nhập username' }]}
          >
            <Input placeholder="Nhập username" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}
            rules={
              editingUser
                ? []
                : [{ required: true, message: 'Vui lòng nhập mật khẩu' }]
            }
          >
            <Input.Password placeholder={editingUser ? 'Nhập mật khẩu mới (tùy chọn)' : 'Nhập mật khẩu'} />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="Nhập SĐT" />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item
              name="branch_id"
              label="Chi nhánh"
              rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Chọn chi nhánh"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn vai trò" options={roleOptions} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
