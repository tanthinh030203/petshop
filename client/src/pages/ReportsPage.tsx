import { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Select,
  Alert,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  CustomerServiceOutlined,
  TeamOutlined,
  CalendarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';

import { reportService } from '@/services/report.service';
import type {
  RevenueReport,
  TopProductReport,
  TopServiceReport,
  CustomerStatsReport,
  AppointmentStatsReport,
  StockAlert,
} from '@/services/report.service';
import { branchService } from '@/services/branch.service';
import type { Branch } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const formatShortVND = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
};

const PIE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

const typeLabelMap: Record<string, string> = {
  medical: 'Khám bệnh',
  grooming: 'Grooming',
  vaccination: 'Tiêm phòng',
  surgery: 'Phẫu thuật',
  checkup: 'Kiểm tra',
  hotel: 'Khách sạn',
};

const statusLabelMap: Record<string, string> = {
  scheduled: 'Đã đặt',
  confirmed: 'Xác nhận',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
};

const statusBarColors: Record<string, string> = {
  scheduled: '#1677ff',
  confirmed: '#13c2c2',
  in_progress: '#faad14',
  completed: '#52c41a',
  cancelled: '#f5222d',
  no_show: '#d9d9d9',
};

// ---- Tab 1: Revenue ----
function RevenueTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RevenueReport | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);

  useEffect(() => {
    branchService.getAll({ limit: 100 }).then((res) => setBranches(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, branchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      if (branchId) params.branch_id = branchId;
      const res = await reportService.getRevenue(params);
      setData(res);
    } catch {
      message.error('Không thể tải dữ liệu doanh thu');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = (data?.by_date ?? []).map((d) => ({
    date: dayjs(d.date).format('DD/MM'),
    revenue: d.revenue,
  }));

  const days = data?.by_date?.length || 1;
  const avgDaily = (data?.total_revenue ?? 0) / days;

  return (
    <Spin spinning={loading}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
            }}
            format="DD/MM/YYYY"
          />
        </Col>
        <Col>
          <Select
            placeholder="Tất cả chi nhánh"
            allowClear
            style={{ width: 200 }}
            onChange={(val) => setBranchId(val)}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={data?.total_revenue ?? 0}
              formatter={(val) => formatVND(val as number)}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Doanh thu trung bình/ngày"
              value={avgDaily}
              formatter={(val) => formatVND(val as number)}
              prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Doanh thu theo ngày">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatShortVND} />
            <Tooltip formatter={(value: number) => [formatVND(value), 'Doanh thu']} />
            <Bar dataKey="revenue" fill="#1677ff" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Spin>
  );
}

// ---- Tab 2: Top Products ----
function TopProductsTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopProductReport[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getTopProducts({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        limit: 10,
      });
      setData(res ?? []);
    } catch {
      message.error('Không thể tải dữ liệu sản phẩm');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [...data].reverse();

  const columns = [
    {
      title: '#',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name' },
    {
      title: 'SL bán',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: 160,
      align: 'right' as const,
      render: (val: number) => formatVND(val),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
          }}
          format="DD/MM/YYYY"
        />
      </div>

      <Card title="Top 10 sản phẩm bán chạy" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={formatShortVND} />
            <YAxis type="category" dataKey="product_name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [formatVND(value), 'Doanh thu']} />
            <Bar dataKey="total_revenue" fill="#52c41a" radius={[0, 6, 6, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Table
        rowKey="product_id"
        columns={columns}
        dataSource={data}
        pagination={false}
        locale={{ emptyText: 'Chưa có dữ liệu' }}
      />
    </Spin>
  );
}

// ---- Tab 3: Top Services ----
function TopServicesTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopServiceReport[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getTopServices({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        limit: 10,
      });
      setData(res ?? []);
    } catch {
      message.error('Không thể tải dữ liệu dịch vụ');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [...data].reverse();

  const columns = [
    {
      title: '#',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    { title: 'Dịch vụ', dataIndex: 'service_name', key: 'service_name' },
    {
      title: 'Lượt sử dụng',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 130,
      align: 'right' as const,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: 160,
      align: 'right' as const,
      render: (val: number) => formatVND(val),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
          }}
          format="DD/MM/YYYY"
        />
      </div>

      <Card title="Top 10 dịch vụ phổ biến" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={formatShortVND} />
            <YAxis type="category" dataKey="service_name" width={110} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [formatVND(value), 'Doanh thu']} />
            <Bar dataKey="total_revenue" fill="#722ed1" radius={[0, 6, 6, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Table
        rowKey="service_id"
        columns={columns}
        dataSource={data}
        pagination={false}
        locale={{ emptyText: 'Chưa có dữ liệu' }}
      />
    </Spin>
  );
}

// ---- Tab 4: Customer Stats ----
function CustomerStatsTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerStatsReport | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getCustomerStats({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      setData(res);
    } catch {
      message.error('Không thể tải thống kê khách hàng');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = (data?.by_date ?? []).map((d) => ({
    date: dayjs(d.date).format('DD/MM'),
    new_count: d.new_count,
    returning_count: d.returning_count,
  }));

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
          }}
          format="DD/MM/YYYY"
        />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng khách hàng"
              value={data?.total_customers ?? 0}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách mới trong kỳ"
              value={data?.new_customers ?? 0}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Khách quay lại"
              value={data?.returning_customers ?? 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Khách hàng mới theo thời gian">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="new_count" name="Khách mới" stroke="#52c41a" strokeWidth={2} />
            <Line type="monotone" dataKey="returning_count" name="Quay lại" stroke="#722ed1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </Spin>
  );
}

// ---- Tab 5: Appointment Stats ----
function AppointmentStatsTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AppointmentStatsReport | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getAppointmentStats({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      setData(res);
    } catch {
      message.error('Không thể tải thống kê lịch hẹn');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const pieDataType = Object.entries(data?.by_type ?? {}).map(([key, value]) => ({
    name: typeLabelMap[key] ?? key,
    value,
  }));

  const barDataStatus = Object.entries(data?.by_status ?? {}).map(([key, value]) => ({
    status: statusLabelMap[key] ?? key,
    key,
    count: value,
  }));

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
          }}
          format="DD/MM/YYYY"
        />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng lịch hẹn"
              value={data?.total ?? 0}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Theo loại dịch vụ" style={{ marginBottom: 24 }}>
            {pieDataType.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieDataType}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieDataType.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">Chưa có dữ liệu</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Theo trạng thái" style={{ marginBottom: 24 }}>
            {barDataStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barDataStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {barDataStatus.map((entry) => (
                      <Cell key={entry.key} fill={statusBarColors[entry.key] ?? '#1677ff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">Chưa có dữ liệu</Text>
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}

// ---- Tab 6: Stock Alerts ----
function StockAlertsTab() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StockAlert[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reportService.getStockAlerts();
      setData(res ?? []);
    } catch {
      message.error('Không thể tải cảnh báo tồn kho');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name' },
    { title: 'Chi nhánh', dataIndex: 'branch_name', key: 'branch_name' },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 140,
      align: 'right' as const,
      render: (qty: number) => <Text type="danger">{qty}</Text>,
    },
    {
      title: 'Tối thiểu',
      dataIndex: 'min_quantity',
      key: 'min_quantity',
      width: 120,
      align: 'right' as const,
    },
    {
      title: 'Thiếu',
      key: 'deficit',
      width: 100,
      align: 'right' as const,
      render: (_: unknown, record: StockAlert) => {
        const deficit = record.min_quantity - record.quantity;
        return <Tag color="red">-{deficit > 0 ? deficit : 0}</Tag>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      {data.length > 0 && (
        <Alert
          message={`Có ${data.length} sản phẩm dưới mức tồn kho tối thiểu`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}
      {data.length === 0 && !loading && (
        <Alert
          message="Tồn kho ổn định"
          description="Không có sản phẩm nào dưới mức tồn kho tối thiểu."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Table
        rowKey={(r) => `${r.branch_id}-${r.product_id}`}
        columns={columns}
        dataSource={data}
        pagination={false}
        locale={{ emptyText: 'Không có cảnh báo' }}
      />
    </Spin>
  );
}

// ---- Main Page ----
export default function ReportsPage() {
  const tabItems = [
    {
      key: 'revenue',
      label: (
        <span>
          <DollarOutlined /> Doanh thu
        </span>
      ),
      children: <RevenueTab />,
    },
    {
      key: 'products',
      label: (
        <span>
          <ShoppingOutlined /> Sản phẩm bán chạy
        </span>
      ),
      children: <TopProductsTab />,
    },
    {
      key: 'services',
      label: (
        <span>
          <CustomerServiceOutlined /> Dịch vụ phổ biến
        </span>
      ),
      children: <TopServicesTab />,
    },
    {
      key: 'customers',
      label: (
        <span>
          <TeamOutlined /> Khách hàng
        </span>
      ),
      children: <CustomerStatsTab />,
    },
    {
      key: 'appointments',
      label: (
        <span>
          <CalendarOutlined /> Lịch hẹn
        </span>
      ),
      children: <AppointmentStatsTab />,
    },
    {
      key: 'stock',
      label: (
        <span>
          <WarningOutlined /> Cảnh báo tồn kho
        </span>
      ),
      children: <StockAlertsTab />,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>
        Báo cáo &amp; Thống kê
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Phân tích doanh thu, sản phẩm, dịch vụ và hoạt động kinh doanh
      </Text>
      <Tabs items={tabItems} defaultActiveKey="revenue" />
    </div>
  );
}
