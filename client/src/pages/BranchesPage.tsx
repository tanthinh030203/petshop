import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Switch,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { branchService } from '@/services/branch.service';
import type { Branch } from '@/types';

const { Title, Text } = Typography;

export default function BranchesPage() {
  const [form] = Form.useForm();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = useCallback(
    async (page = 1, pageSize = 10, search = '') => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: pageSize };
        if (search) params.search = search;
        const res = await branchService.getAll(params);
        setBranches(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách chi nhánh');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchBranches(pag.current, pag.pageSize, searchText);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchBranches(1, pagination.pageSize, value);
  };

  const openAddModal = () => {
    setEditingBranch(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    form.setFieldsValue(branch);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingBranch) {
        await branchService.update(editingBranch.id, values);
        message.success('Cập nhật chi nhánh thành công');
      } else {
        await branchService.create(values);
        message.success('Thêm chi nhánh thành công');
      }
      setModalOpen(false);
      form.resetFields();
      fetchBranches(pagination.current, pagination.pageSize, searchText);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      await branchService.update(branch.id, { is_active: !branch.is_active });
      message.success(
        branch.is_active ? 'Đã ngừng hoạt động chi nhánh' : 'Đã kích hoạt chi nhánh',
      );
      fetchBranches(pagination.current, pagination.pageSize, searchText);
    } catch {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await branchService.remove(id);
      message.success('Đã xóa chi nhánh');
      fetchBranches(pagination.current, pagination.pageSize, searchText);
    } catch {
      message.error('Xóa chi nhánh thất bại');
    }
  };

  const columns: ColumnsType<Branch> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Tên chi nhánh',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (val: string) => val || '—',
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (val: string) => val || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (val: string) => val || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 130,
      align: 'center',
      render: (active: boolean, record: Branch) => (
        <Popconfirm
          title={active ? 'Ngừng hoạt động chi nhánh này?' : 'Kích hoạt chi nhánh này?'}
          onConfirm={() => handleToggleStatus(record)}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <Tag
            color={active ? 'green' : 'red'}
            style={{ cursor: 'pointer' }}
          >
            {active ? 'Hoạt động' : 'Ngừng'}
          </Tag>
        </Popconfirm>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_: unknown, record: Branch) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="Xác nhận xóa chi nhánh?"
            description="Thao tác này không thể hoàn tác"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
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
            <BranchesOutlined style={{ marginRight: 8 }} />
            Quản lý chi nhánh
          </Title>
          <Text type="secondary">Cài đặt chi nhánh hệ thống</Text>
        </div>
        <Space>
          <Input.Search
            placeholder="Tìm chi nhánh..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 260 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm chi nhánh
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={branches}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        locale={{ emptyText: 'Chưa có chi nhánh nào' }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingBranch ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="Mã chi nhánh"
            rules={[{ required: true, message: 'Vui lòng nhập mã chi nhánh' }]}
          >
            <Input placeholder="VD: HCM01" disabled={!!editingBranch} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên chi nhánh"
            rules={[{ required: true, message: 'Vui lòng nhập tên chi nhánh' }]}
          >
            <Input placeholder="Nhập tên chi nhánh" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="phone" label="Số điện thoại" style={{ flex: 1 }}>
              <Input placeholder="Nhập SĐT" />
            </Form.Item>
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input placeholder="Nhập email" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
