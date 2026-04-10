import { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Table,
  Button,
  Form,
  Select,
  InputNumber,
  Input,
  Tag,
  Space,
  message,
  Typography,
} from 'antd';
import {
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { stockService } from '@/services/stock.service';
import type { StockMovement } from '@/services/stock.service';
import { productService } from '@/services/product.service';
import { branchService } from '@/services/branch.service';
import type { BranchStock, Product, Branch } from '@/types';

const { Title } = Typography;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// ── Tab 1: Inventory ──────────────────────────────────────────
function InventoryTab() {
  const [data, setData] = useState<BranchStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetch = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await stockService.getStock({ page, limit: pageSize });
      setData(res.data);
      setPagination({
        current: res.meta.page,
        pageSize: res.meta.limit,
        total: res.meta.total,
      });
    } catch {
      message.error('Không thể tải dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const columns: ColumnsType<BranchStock> = [
    {
      title: 'Sản phẩm',
      key: 'product_name',
      render: (_: unknown, r: BranchStock) => r.product?.name ?? `#${r.product_id}`,
    },
    {
      title: 'SKU',
      key: 'sku',
      width: 120,
      render: (_: unknown, r: BranchStock) => r.product?.sku ?? '—',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'right',
    },
    {
      title: 'Tối thiểu',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
      width: 110,
      align: 'right',
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      render: (v: string | undefined) => v ?? '—',
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={(pag) => fetch(pag.current, pag.pageSize)}
      rowClassName={(record) =>
        record.quantity <= record.min_quantity ? 'stock-low-row' : ''
      }
    />
  );
}

// ── Shared product list hook ──────────────────────────────────
function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    productService
      .getAll({ limit: 500 })
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);
  return products;
}

function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  useEffect(() => {
    branchService
      .getAll({ limit: 100 })
      .then((res) => setBranches(res.data))
      .catch(() => {});
  }, []);
  return branches;
}

// ── Tab 2: Import ─────────────────────────────────────────────
function ImportTab() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const products = useProducts();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await stockService.importStock({
        branch_id: values.branch_id,
        items: values.items.map((item: { product_id: number; quantity: number; note?: string }) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          note: item.note,
        })),
        note: values.note,
      });
      message.success('Nhập kho thành công');
      form.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra khi nhập kho');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
      <Form.Item name="note" label="Ghi chú chung">
        <Input.TextArea rows={2} placeholder="Ghi chú nhập kho" />
      </Form.Item>

      <Form.List name="items" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                <Form.Item
                  {...restField}
                  name={[name, 'product_id']}
                  rules={[{ required: true, message: 'Chọn SP' }]}
                  style={{ width: 300 }}
                >
                  <Select
                    showSearch
                    placeholder="Chọn sản phẩm"
                    optionFilterProp="label"
                    options={products.map((p) => ({
                      label: `${p.sku} - ${p.name}`,
                      value: p.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'quantity']}
                  rules={[{ required: true, message: 'Nhập SL' }]}
                >
                  <InputNumber min={1} placeholder="Số lượng" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'note']}>
                  <Input placeholder="Ghi chú" style={{ width: 200 }} />
                </Form.Item>
                {fields.length > 1 && (
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 8 }} />
                )}
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Thêm sản phẩm
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Button type="primary" loading={submitting} onClick={handleSubmit}>
          Xác nhận nhập kho
        </Button>
      </Form.Item>
    </Form>
  );
}

// ── Tab 3: Export ─────────────────────────────────────────────
function ExportTab() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const products = useProducts();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await stockService.exportStock({
        branch_id: values.branch_id,
        items: values.items.map((item: { product_id: number; quantity: number; note?: string }) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          note: item.note,
        })),
        note: values.note,
      });
      message.success('Xuất kho thành công');
      form.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra khi xuất kho');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
      <Form.Item name="note" label="Ghi chú chung">
        <Input.TextArea rows={2} placeholder="Ghi chú xuất kho" />
      </Form.Item>

      <Form.List name="items" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                <Form.Item
                  {...restField}
                  name={[name, 'product_id']}
                  rules={[{ required: true, message: 'Chọn SP' }]}
                  style={{ width: 300 }}
                >
                  <Select
                    showSearch
                    placeholder="Chọn sản phẩm"
                    optionFilterProp="label"
                    options={products.map((p) => ({
                      label: `${p.sku} - ${p.name}`,
                      value: p.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'quantity']}
                  rules={[{ required: true, message: 'Nhập SL' }]}
                >
                  <InputNumber min={1} placeholder="Số lượng" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'note']}>
                  <Input placeholder="Ghi chú" style={{ width: 200 }} />
                </Form.Item>
                {fields.length > 1 && (
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 8 }} />
                )}
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Thêm sản phẩm
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Button type="primary" loading={submitting} onClick={handleSubmit}>
          Xác nhận xuất kho
        </Button>
      </Form.Item>
    </Form>
  );
}

// ── Tab 4: Transfer ───────────────────────────────────────────
function TransferTab() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const products = useProducts();
  const branches = useBranches();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await stockService.transferStock({
        from_branch_id: values.from_branch_id,
        to_branch_id: values.to_branch_id,
        items: values.items.map((item: { product_id: number; quantity: number }) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        note: values.note,
      });
      message.success('Chuyển kho thành công');
      form.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra khi chuyển kho');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
      <Space size="middle" style={{ display: 'flex' }}>
        <Form.Item
          name="from_branch_id"
          label="Chi nhánh nguồn"
          rules={[{ required: true, message: 'Chọn chi nhánh nguồn' }]}
          style={{ flex: 1 }}
        >
          <Select
            placeholder="Chọn chi nhánh nguồn"
            options={branches.map((b) => ({ label: b.name, value: b.id }))}
          />
        </Form.Item>
        <Form.Item
          name="to_branch_id"
          label="Chi nhánh đích"
          rules={[{ required: true, message: 'Chọn chi nhánh đích' }]}
          style={{ flex: 1 }}
        >
          <Select
            placeholder="Chọn chi nhánh đích"
            options={branches.map((b) => ({ label: b.name, value: b.id }))}
          />
        </Form.Item>
      </Space>

      <Form.Item name="note" label="Ghi chú">
        <Input.TextArea rows={2} placeholder="Ghi chú chuyển kho" />
      </Form.Item>

      <Form.List name="items" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                <Form.Item
                  {...restField}
                  name={[name, 'product_id']}
                  rules={[{ required: true, message: 'Chọn SP' }]}
                  style={{ width: 300 }}
                >
                  <Select
                    showSearch
                    placeholder="Chọn sản phẩm"
                    optionFilterProp="label"
                    options={products.map((p) => ({
                      label: `${p.sku} - ${p.name}`,
                      value: p.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'quantity']}
                  rules={[{ required: true, message: 'Nhập SL' }]}
                >
                  <InputNumber min={1} placeholder="Số lượng" style={{ width: 120 }} />
                </Form.Item>
                {fields.length > 1 && (
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 8 }} />
                )}
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Thêm sản phẩm
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Button type="primary" loading={submitting} onClick={handleSubmit}>
          Xác nhận chuyển kho
        </Button>
      </Form.Item>
    </Form>
  );
}

// ── Tab 5: Movements History ──────────────────────────────────
function MovementsTab() {
  const [data, setData] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const products = useProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const fetch = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await stockService.getMovements({ page, limit: pageSize });
      setData(res.data);
      setPagination({
        current: res.meta.page,
        pageSize: res.meta.limit,
        total: res.meta.total,
      });
    } catch {
      message.error('Không thể tải lịch sử kho');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const typeColor: Record<string, string> = {
    import: 'green',
    export: 'orange',
    transfer: 'blue',
    adjustment: 'purple',
  };
  const typeLabel: Record<string, string> = {
    import: 'Nhập kho',
    export: 'Xuất kho',
    transfer: 'Chuyển kho',
    adjustment: 'Điều chỉnh',
  };

  const columns: ColumnsType<StockMovement> = [
    {
      title: 'Ngày',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product_id',
      key: 'product_id',
      render: (id: number) => {
        const p = productMap.get(id);
        return p ? `${p.sku} - ${p.name}` : `#${id}`;
      },
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: string) => (
        <Tag color={typeColor[t] ?? 'default'}>{typeLabel[t] ?? t}</Tag>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 140,
      render: (v: number) => `User #${v}`,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v: string | undefined) => v ?? '—',
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={(pag) => fetch(pag.current, pag.pageSize)}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StockPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        Quản lý kho
      </Title>

      <style>{`
        .stock-low-row { background-color: #fff2f0 !important; }
        .stock-low-row:hover > td { background-color: #ffccc7 !important; }
      `}</style>

      <Tabs
        defaultActiveKey="inventory"
        items={[
          { key: 'inventory', label: 'Tồn kho', children: <InventoryTab /> },
          { key: 'import', label: 'Nhập kho', children: <ImportTab /> },
          { key: 'export', label: 'Xuất kho', children: <ExportTab /> },
          { key: 'transfer', label: 'Chuyển kho', children: <TransferTab /> },
          { key: 'movements', label: 'Lịch sử', children: <MovementsTab /> },
        ]}
      />
    </div>
  );
}
