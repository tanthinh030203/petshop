import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { productService } from '@/services/product.service';
import type { ProductCategory } from '@/types';

const { Title } = Typography;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function flattenForSelect(
  cats: ProductCategory[],
  prefix = '',
): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = [];
  for (const cat of cats) {
    result.push({ label: prefix + cat.name, value: cat.id });
    if (cat.children?.length) {
      result.push(...flattenForSelect(cat.children, prefix + '— '));
    }
  }
  return result;
}

export default function CategoriesPage() {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch {
      message.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleNameChange = () => {
    const name = form.getFieldValue('name');
    if (name) {
      form.setFieldValue('slug', slugify(name));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await productService.createCategory({
        parent_id: values.parentId ?? undefined,
        name: values.name,
        slug: values.slug,
        description: values.description,
        sort_order: values.sortOrder ?? 0,
      });
      message.success('Thêm danh mục thành công');
      setModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const selectOptions = flattenForSelect(categories);

  const columns: ColumnsType<ProductCategory> = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string | undefined) => v ?? '—',
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 90,
      align: 'center',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      align: 'center',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Hoạt động' : 'Ngừng'}
        </Tag>
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
          Danh mục sản phẩm
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Thêm danh mục
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={false}
        childrenColumnName="children"
        expandable={{ defaultExpandAllRows: true }}
      />

      <Modal
        title="Thêm danh mục mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Thêm mới"
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="parentId" label="Danh mục cha">
            <Select
              placeholder="Không (danh mục gốc)"
              allowClear
              options={selectOptions}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Nhập tên danh mục" onChange={handleNameChange} />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Vui lòng nhập slug' }]}
          >
            <Input placeholder="tu-dong-tao-tu-ten" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả danh mục" />
          </Form.Item>

          <Form.Item name="sortOrder" label="Thứ tự" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
