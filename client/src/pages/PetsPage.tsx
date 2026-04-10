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
  InputNumber,
  Checkbox,
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
import { petService } from '@/services/pet.service';
import { customerService } from '@/services/customer.service';
import type { Pet, Customer, PetSpecies } from '@/types';

const { Title } = Typography;

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

const speciesColorMap: Record<PetSpecies, string> = {
  dog: 'blue',
  cat: 'purple',
  bird: 'orange',
  hamster: 'gold',
  rabbit: 'pink',
  fish: 'cyan',
  reptile: 'green',
  other: 'default',
};

const petGenderMap: Record<string, string> = {
  male: 'Đực',
  female: 'Cái',
  unknown: 'Không rõ',
};

const speciesOptions = Object.entries(speciesMap).map(([value, label]) => ({
  value,
  label,
}));

export default function PetsPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  const fetchPets = useCallback(
    async (page = 1, pageSize = 10, search = '', species?: string) => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: pageSize };
        if (search) params.search = search;
        if (species) params.species = species;
        const res = await petService.getAll(params);
        setPets(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách thú cưng');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchPets(pag.current, pag.pageSize, searchText, speciesFilter);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchPets(1, pagination.pageSize, value, speciesFilter);
  };

  const handleSpeciesFilter = (value: string | undefined) => {
    setSpeciesFilter(value);
    fetchPets(1, pagination.pageSize, searchText, value);
  };

  const handleCustomerSearch = async (value: string) => {
    if (!value || value.length < 2) {
      setCustomerOptions([]);
      return;
    }
    setCustomerSearchLoading(true);
    try {
      const results = await customerService.search(value);
      setCustomerOptions(results);
    } catch {
      // silent
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPet(null);
    form.resetFields();
    setCustomerOptions([]);
    setModalOpen(true);
  };

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    if (pet.customer) {
      setCustomerOptions([pet.customer]);
    }
    form.setFieldsValue({
      ...pet,
      date_of_birth: pet.date_of_birth ? dayjs(pet.date_of_birth) : undefined,
      customer_id: pet.customer_id,
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
      if (editingPet) {
        await petService.update(editingPet.id, payload);
        message.success('Cập nhật thú cưng thành công');
      } else {
        await petService.create(payload);
        message.success('Thêm thú cưng thành công');
      }
      setModalOpen(false);
      form.resetFields();
      fetchPets(pagination.current, pagination.pageSize, searchText, speciesFilter);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Pet> = [
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
      width: 110,
      render: (species: PetSpecies) => (
        <Tag color={speciesColorMap[species] || 'default'}>
          {speciesMap[species] || species}
        </Tag>
      ),
    },
    {
      title: 'Giống',
      dataIndex: 'breed',
      key: 'breed',
    },
    {
      title: 'Chủ',
      dataIndex: ['customer', 'full_name'],
      key: 'customer',
      render: (text: string, record: Pet) =>
        record.customer ? (
          <a onClick={() => navigate(`/customers/${record.customer_id}`)}>
            {record.customer.full_name}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      render: (g: string) => petGenderMap[g] || g,
    },
    {
      title: 'Cân nặng',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'right',
      render: (w: number | undefined) => (w != null ? `${w} kg` : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
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
      render: (_: unknown, record: Pet) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/pets/${record.id}`)}
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
          Thú cưng
        </Title>
        <Space>
          <Select
            placeholder="Lọc theo loài"
            allowClear
            style={{ width: 160 }}
            options={speciesOptions}
            onChange={handleSpeciesFilter}
            value={speciesFilter}
          />
          <Input.Search
            placeholder="Tìm theo tên thú cưng"
            allowClear
            onSearch={handleSearch}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm thú cưng
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={pets}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingPet ? 'Chỉnh sửa thú cưng' : 'Thêm thú cưng mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingPet ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="customer_id"
            label="Chủ sở hữu"
            rules={[{ required: true, message: 'Vui lòng chọn chủ sở hữu' }]}
          >
            <Select
              showSearch
              placeholder="Tìm khách hàng theo tên hoặc SĐT"
              filterOption={false}
              onSearch={handleCustomerSearch}
              loading={customerSearchLoading}
              notFoundContent={customerSearchLoading ? 'Đang tìm...' : 'Không tìm thấy'}
              options={customerOptions.map((c) => ({
                value: c.id,
                label: `${c.full_name} - ${c.phone}`,
              }))}
            />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item
              name="name"
              label="Tên thú cưng"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Nhập tên thú cưng" />
            </Form.Item>

            <Form.Item
              name="species"
              label="Loài"
              rules={[{ required: true, message: 'Vui lòng chọn loài' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="Chọn loài" options={speciesOptions} />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="breed" label="Giống" style={{ flex: 1 }}>
              <Input placeholder="Nhập giống" />
            </Form.Item>

            <Form.Item name="color" label="Màu sắc" style={{ flex: 1 }}>
              <Input placeholder="Nhập màu sắc" />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="gender" label="Giới tính" style={{ flex: 1 }}>
              <Select placeholder="Chọn giới tính">
                <Select.Option value="male">Đực</Select.Option>
                <Select.Option value="female">Cái</Select.Option>
                <Select.Option value="unknown">Không rõ</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="date_of_birth" label="Ngày sinh" style={{ flex: 1 }}>
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="weight" label="Cân nặng (kg)" style={{ flex: 1 }}>
              <InputNumber
                min={0}
                step={0.1}
                placeholder="Nhập cân nặng"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item name="microchip_id" label="Mã microchip" style={{ flex: 1 }}>
              <Input placeholder="Nhập mã microchip" />
            </Form.Item>
          </Space>

          <Form.Item name="is_neutered" valuePropName="checked">
            <Checkbox>Đã triệt sản</Checkbox>
          </Form.Item>

          <Form.Item name="allergies" label="Dị ứng">
            <Input.TextArea rows={2} placeholder="Nhập thông tin dị ứng (nếu có)" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
