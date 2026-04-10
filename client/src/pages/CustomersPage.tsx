import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/types';

const { Title } = Typography;

export default function CustomersPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(
    async (page = 1, pageSize = 10, search = '') => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: pageSize };
        if (search) params.search = search;
        const res = await customerService.getAll(params);
        setCustomers(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách khách hàng');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchCustomers(pag.current, pag.pageSize, searchText);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchCustomers(1, pagination.pageSize, value);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      date_of_birth: customer.date_of_birth
        ? dayjs(customer.date_of_birth)
        : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format('YYYY-MM-DD')
          : undefined,
      };
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, payload);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await customerService.create(payload);
        message.success('Thêm khách hàng thành công');
      }
      setModalOpen(false);
      form.resetFields();
      fetchCustomers(pagination.current, pagination.pageSize, searchText);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Mã KH',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: Customer) => (
        <a onClick={() => navigate(`/customers/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Điểm tích lũy',
      dataIndex: 'loyalty_points',
      key: 'loyalty_points',
      width: 130,
      align: 'right',
      render: (points: number) => points?.toLocaleString('vi-VN') ?? 0,
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
      title: 'Hành động',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/customers/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
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
        <Title level={4} style={{ margin: 0 }}>
          Khách hàng
        </Title>
        <Space>
          <Input.Search
            placeholder="Tìm theo tên hoặc SĐT"
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm khách hàng
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={customers}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingCustomer ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="full_name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ tên khách hàng" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="date_of_birth" label="Ngày sinh" style={{ flex: 1 }}>
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item name="gender" label="Giới tính" style={{ flex: 1 }}>
              <Select placeholder="Chọn giới tính" allowClear>
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="id_number" label="CMND/CCCD">
            <Input placeholder="Nhập số CMND/CCCD" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
