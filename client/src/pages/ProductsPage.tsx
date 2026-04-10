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
  InputNumber,
  Checkbox,
  message,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { productService } from '@/services/product.service';
import type { Product, ProductCategory } from '@/types';

const { Title } = Typography;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export default function ProductsPage() {
  const [form] = Form.useForm();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | undefined>();
  const [filterPrescription, setFilterPrescription] = useState<boolean | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: pageSize };
        if (searchText) params.search = searchText;
        if (filterCategory) params.category_id = filterCategory;
        if (filterPrescription !== undefined) params.is_prescription = filterPrescription;
        const res = await productService.getAll(params);
        setProducts(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách sản phẩm');
      } finally {
        setLoading(false);
      }
    },
    [searchText, filterCategory, filterPrescription],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await productService.getCategories();
      setCategories(cats);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchProducts(pag.current, pag.pageSize);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      categoryId: product.category_id,
      costPrice: product.cost_price,
      sellingPrice: product.selling_price,
      isPrescription: product.is_prescription,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: Partial<Product> = {
        sku: values.sku,
        barcode: values.barcode,
        name: values.name,
        category_id: values.categoryId,
        unit: values.unit,
        cost_price: values.costPrice,
        selling_price: values.sellingPrice,
        description: values.description,
        is_prescription: values.isPrescription ?? false,
      };
      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await productService.create(payload);
        message.success('Thêm sản phẩm thành công');
      }
      setModalOpen(false);
      form.resetFields();
      fetchProducts(pagination.current, pagination.pageSize);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const flattenCategories = (cats: ProductCategory[]): ProductCategory[] => {
    const result: ProductCategory[] = [];
    const traverse = (list: ProductCategory[]) => {
      for (const cat of list) {
        result.push(cat);
        if (cat.children?.length) traverse(cat.children);
      }
    };
    traverse(cats);
    return result;
  };

  const allCategories = flattenCategories(categories);

  const columns: ColumnsType<Product> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Tên SP', dataIndex: 'name', key: 'name' },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: ProductCategory | undefined) => cat?.name ?? '—',
    },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 90 },
    {
      title: 'Giá nhập',
      dataIndex: 'cost_price',
      key: 'cost_price',
      width: 130,
      align: 'right',
      render: (v: number) => formatVND(v),
    },
    {
      title: 'Giá bán',
      dataIndex: 'selling_price',
      key: 'selling_price',
      width: 130,
      align: 'right',
      render: (v: number) => formatVND(v),
    },
    {
      title: 'Thuốc kê đơn',
      dataIndex: 'is_prescription',
      key: 'is_prescription',
      width: 120,
      align: 'center',
      render: (v: boolean) =>
        v ? <Tag color="red">Kê đơn</Tag> : <Tag>Không</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Hoạt động' : 'Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Product) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => openEditModal(record)}
        />
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
          Sản phẩm
        </Title>
        <Space>
          <Select
            placeholder="Danh mục"
            allowClear
            style={{ width: 180 }}
            value={filterCategory}
            onChange={(v) => setFilterCategory(v)}
            options={allCategories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Select
            placeholder="Thuốc kê đơn"
            allowClear
            style={{ width: 150 }}
            value={filterPrescription}
            onChange={(v) => setFilterPrescription(v)}
            options={[
              { label: 'Kê đơn', value: true },
              { label: 'Không kê đơn', value: false },
            ]}
          />
          <Input.Search
            placeholder="Tìm sản phẩm..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Thêm sản phẩm
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={products}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingProduct ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: SP001" />
            </Form.Item>
            <Form.Item name="barcode" label="Barcode" style={{ flex: 1 }}>
              <Input placeholder="Mã vạch" />
            </Form.Item>
          </Space>

          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input placeholder="Nhập tên sản phẩm" />
          </Form.Item>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item name="categoryId" label="Danh mục" style={{ flex: 1 }}>
              <Select
                placeholder="Chọn danh mục"
                allowClear
                options={allCategories.map((c) => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item
              name="unit"
              label="Đơn vị"
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: viên, hộp, chai" />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ display: 'flex' }}>
            <Form.Item
              name="costPrice"
              label="Giá nhập"
              rules={[{ required: true, message: 'Vui lòng nhập giá nhập' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => parseFloat(v?.replace(/,/g, '') || '0') as unknown as 0}
                addonAfter="VND"
              />
            </Form.Item>
            <Form.Item
              name="sellingPrice"
              label="Giá bán"
              rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => parseFloat(v?.replace(/,/g, '') || '0') as unknown as 0}
                addonAfter="VND"
              />
            </Form.Item>
          </Space>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả sản phẩm" />
          </Form.Item>

          <Form.Item name="isPrescription" valuePropName="checked">
            <Checkbox>Thuốc kê đơn</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
