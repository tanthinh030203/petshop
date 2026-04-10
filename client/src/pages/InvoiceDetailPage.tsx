import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Descriptions,
  Divider,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Space,
  Spin,
  message,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { invoiceService } from '@/services/invoice.service';
import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  InvoiceType,
  Payment,
  PaymentMethod,
} from '@/types';

const { Title, Text } = Typography;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const statusColor: Record<InvoiceStatus, string> = {
  draft: 'default',
  pending: 'blue',
  paid: 'green',
  partial: 'orange',
  voided: 'red',
};

const statusLabel: Record<InvoiceStatus, string> = {
  draft: 'Nháp',
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  partial: 'Thanh toán một phần',
  voided: 'Đã hủy',
};

const typeLabel: Record<InvoiceType, string> = {
  sale: 'Bán hàng',
  service: 'Dịch vụ',
  mixed: 'Hỗn hợp',
};

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  transfer: 'Chuyển khoản',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
  other: 'Khác',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await invoiceService.getById(Number(id));
      setInvoice(data);
    } catch {
      message.error('Không thể tải chi tiết hóa đơn');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleAddPayment = async () => {
    if (!invoice) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await invoiceService.addPayment(invoice.id, {
        amount: values.amount,
        method: values.method,
        reference_no: values.reference_no || undefined,
        paid_at: new Date().toISOString(),
        note: values.note || undefined,
      });
      message.success('Thêm thanh toán thành công');
      setPaymentModalOpen(false);
      form.resetFields();
      fetchInvoice();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">Không tìm thấy hóa đơn</Text>
      </div>
    );
  }

  const canAddPayment =
    invoice.status !== 'paid' && invoice.status !== 'voided';

  // Items table columns
  const itemColumns: ColumnsType<InvoiceItem> = [
    {
      title: 'Loại',
      dataIndex: 'item_type',
      key: 'item_type',
      width: 100,
      render: (t: string) => (
        <Tag color={t === 'product' ? 'blue' : 'purple'}>
          {t === 'product' ? 'Sản phẩm' : 'Dịch vụ'}
        </Tag>
      ),
    },
    {
      title: 'Sản phẩm / Dịch vụ',
      key: 'name',
      render: (_: unknown, record: InvoiceItem) =>
        record.product?.name ?? record.service?.name ?? record.description ?? '—',
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      align: 'center',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 130,
      align: 'right',
      render: (v: number) => formatVND(v),
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount',
      key: 'discount',
      width: 110,
      align: 'right',
      render: (v: number) => (v > 0 ? formatVND(v) : '—'),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'line_total',
      key: 'line_total',
      width: 140,
      align: 'right',
      render: (v: number) => <Text strong>{formatVND(v)}</Text>,
    },
  ];

  // Payments table columns
  const paymentColumns: ColumnsType<Payment> = [
    {
      title: 'Ngày',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 170,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (v: number) => <Text strong>{formatVND(v)}</Text>,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (m: PaymentMethod) => methodLabel[m] ?? m,
    },
    {
      title: 'Mã GD',
      dataIndex: 'reference_no',
      key: 'reference_no',
      render: (v: string | undefined) => v ?? '—',
    },
  ];

  const paymentMethodOptions = Object.entries(methodLabel).map(
    ([value, label]) => ({ label, value }),
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')}>
          Quay lại
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          In hóa đơn
        </Button>
        {canAddPayment && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setPaymentModalOpen(true);
            }}
          >
            Thêm thanh toán
          </Button>
        )}
      </Space>

      {/* Invoice info */}
      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          title={
            <Title level={5} style={{ margin: 0 }}>
              Hóa đơn: {invoice.invoice_number}
            </Title>
          }
          column={{ xs: 1, sm: 2, md: 3 }}
          bordered
          size="small"
        >
          <Descriptions.Item label="Số hóa đơn">
            {invoice.invoice_number}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dayjs(invoice.created_at).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Khách hàng">
            {invoice.customer?.full_name ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Loại">
            {typeLabel[invoice.type] ?? invoice.type}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusColor[invoice.status]}>
              {statusLabel[invoice.status] ?? invoice.status}
            </Tag>
          </Descriptions.Item>
          {invoice.note && (
            <Descriptions.Item label="Ghi chú">{invoice.note}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Items */}
      <Card title="Chi tiết sản phẩm / dịch vụ" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          columns={itemColumns}
          dataSource={invoice.items ?? []}
          pagination={false}
          size="small"
        />

        <Divider />

        <div style={{ maxWidth: 350, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>Tạm tính:</Text>
            <Text>{formatVND(invoice.subtotal)}</Text>
          </div>
          {invoice.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Giảm giá:</Text>
              <Text type="danger">-{formatVND(invoice.discount_amount)}</Text>
            </div>
          )}
          {invoice.tax_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Thuế:</Text>
              <Text>{formatVND(invoice.tax_amount)}</Text>
            </div>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>
              Tổng cộng:
            </Title>
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              {formatVND(invoice.total_amount)}
            </Title>
          </div>
        </div>
      </Card>

      {/* Payments */}
      <Card title="Lịch sử thanh toán">
        <Table
          rowKey="id"
          columns={paymentColumns}
          dataSource={invoice.payments ?? []}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Add payment modal */}
      <Modal
        title="Thêm thanh toán"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={handleAddPayment}
        confirmLoading={submitting}
        okText="Xác nhận"
        cancelText="Hủy"
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="amount"
            label="Số tiền"
            rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => parseFloat(v?.replace(/,/g, '') || '0') as any}
              addonAfter="VND"
            />
          </Form.Item>

          <Form.Item
            name="method"
            label="Phương thức"
            rules={[{ required: true, message: 'Chọn phương thức thanh toán' }]}
          >
            <Select
              placeholder="Chọn phương thức"
              options={paymentMethodOptions}
            />
          </Form.Item>

          <Form.Item name="reference_no" label="Mã giao dịch">
            <Input placeholder="Mã tham chiếu / giao dịch" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú thanh toán" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
