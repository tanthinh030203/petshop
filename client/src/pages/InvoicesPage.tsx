import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Select,
  DatePicker,
  message,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { invoiceService } from '@/services/invoice.service';
import type { Invoice, InvoiceStatus, InvoiceType } from '@/types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

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
  pending: 'Chờ TT',
  paid: 'Đã TT',
  partial: 'TT một phần',
  voided: 'Đã hủy',
};

const typeLabel: Record<InvoiceType, string> = {
  sale: 'Bán hàng',
  service: 'Dịch vụ',
  mixed: 'Hỗn hợp',
};

const typeColor: Record<InvoiceType, string> = {
  sale: 'cyan',
  service: 'purple',
  mixed: 'geekblue',
};

export default function InvoicesPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const fetchInvoices = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: pageSize };
        if (searchText) params.search = searchText;
        if (filterStatus) params.status = filterStatus;
        if (dateRange) {
          params.from_date = dateRange[0].format('YYYY-MM-DD');
          params.to_date = dateRange[1].format('YYYY-MM-DD');
        }
        const res = await invoiceService.getAll(params);
        setInvoices(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách hóa đơn');
      } finally {
        setLoading(false);
      }
    },
    [searchText, filterStatus, dateRange],
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchInvoices(pag.current, pag.pageSize);
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Số HĐ',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      width: 140,
      render: (text: string, record: Invoice) => (
        <a onClick={() => navigate(`/invoices/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: Invoice) =>
        record.customer?.full_name ?? '—',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center',
      render: (t: InvoiceType) => (
        <Tag color={typeColor[t]}>{typeLabel[t] ?? t}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 150,
      align: 'right',
      render: (v: number) => formatVND(v),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (s: InvoiceStatus) => (
        <Tag color={statusColor[s]}>{statusLabel[s] ?? s}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Invoice) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/invoices/${record.id}`)}
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
          Hóa đơn
        </Title>
        <Space wrap>
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 150 }}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={Object.entries(statusLabel).map(([value, label]) => ({
              label,
              value,
            }))}
          />
          <RangePicker
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
          />
          <Input.Search
            placeholder="Tìm theo số HĐ..."
            allowClear
            onSearch={(v) => setSearchText(v)}
            style={{ width: 220 }}
            prefix={<SearchOutlined />}
          />
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={invoices}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </div>
  );
}
