import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tabs,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Spin,
  message,
  Typography,
} from 'antd';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { customerService } from '@/services/customer.service';
import type { Customer, Pet, PetSpecies } from '@/types';

const { Title } = Typography;

const genderMap: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

const speciesMap: Record<PetSpecies, string> = {
  dog: 'Chó',
  cat: 'Mèo',
  bird: 'Chim',
  hamster: 'Hamster',
  rabbit: 'Thỏ',
  fish: 'Cá',
  reptile: 'Bò sát',
  other: 'Khác',
};

const petGenderMap: Record<string, string> = {
  male: 'Đực',
  female: 'Cái',
  unknown: 'Không rõ',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [customerData, petsData] = await Promise.all([
        customerService.getById(Number(id)),
        customerService.getPets(Number(id)),
      ]);
      setCustomer(customerData);
      setPets(petsData);
    } catch {
      message.error('Không thể tải thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const openEditModal = () => {
    if (!customer) return;
    form.setFieldsValue({
      ...customer,
      date_of_birth: customer.date_of_birth
        ? dayjs(customer.date_of_birth)
        : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!customer) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format('YYYY-MM-DD')
          : undefined,
      };
      await customerService.update(customer.id, payload);
      message.success('Cập nhật khách hàng thành công');
      setModalOpen(false);
      fetchCustomer();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const petColumns: ColumnsType<Pet> = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Pet) => (
        <a onClick={() => navigate(`/pets/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Loài',
      dataIndex: 'species',
      key: 'species',
      render: (species: PetSpecies) => (
        <Tag color="blue">{speciesMap[species] || species}</Tag>
      ),
    },
    {
      title: 'Giống',
      dataIndex: 'breed',
      key: 'breed',
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      render: (g: string) => petGenderMap[g] || g,
    },
    {
      title: 'Cân nặng (kg)',
      dataIndex: 'weight',
      key: 'weight',
      align: 'right',
      render: (w: number | undefined) => (w != null ? `${w} kg` : '-'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Title level={4}>Không tìm thấy khách hàng</Title>
        <Button onClick={() => navigate('/customers')}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
          Quay lại
        </Button>
      </Space>

      <Card
        title={
          <Space>
            <span>Thông tin khách hàng - {customer.full_name}</span>
            <Tag color={customer.is_active ? 'green' : 'red'}>
              {customer.is_active ? 'Hoạt động' : 'Ngừng'}
            </Tag>
          </Space>
        }
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>
            Chỉnh sửa
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="Mã KH">{customer.code}</Descriptions.Item>
          <Descriptions.Item label="Họ tên">{customer.full_name}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{customer.phone}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{customer.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">
            {customer.date_of_birth
              ? dayjs(customer.date_of_birth).format('DD/MM/YYYY')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Giới tính">
            {customer.gender ? genderMap[customer.gender] : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="CMND/CCCD">
            {customer.id_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Điểm tích lũy">
            <Tag color="gold">{customer.loyalty_points?.toLocaleString('vi-VN') ?? 0}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="pets"
          items={[
            {
              key: 'pets',
              label: `Thú cưng (${pets.length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={petColumns}
                  dataSource={pets}
                  pagination={false}
                />
              ),
            },
            {
              key: 'medical',
              label: 'Lịch sử khám',
              children: (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  Chức năng đang phát triển
                </div>
              ),
            },
            {
              key: 'invoices',
              label: 'Hóa đơn',
              children: (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  Chức năng đang phát triển
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Chỉnh sửa khách hàng"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Cập nhật"
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
