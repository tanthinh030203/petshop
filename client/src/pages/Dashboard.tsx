import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  List,
  Avatar,
  Alert,
  Spin,
  Typography,
} from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  UserAddOutlined,
  WarningOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';

import { reportService } from '@/services/report.service';
import type {
  RevenueReport,
  TopProductReport,
  AppointmentStatsReport,
  StockAlert,
} from '@/services/report.service';
import { appointmentService } from '@/services/appointment.service';
import type { Appointment } from '@/types';

const { Title, Text } = Typography;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    value,
  );

const statusColorMap: Record<string, string> = {
  scheduled: 'blue',
  confirmed: 'cyan',
  in_progress: 'orange',
  completed: 'green',
  cancelled: 'red',
  no_show: 'default',
};

const statusLabelMap: Record<string, string> = {
  scheduled: 'Đã đặt',
  confirmed: 'Xác nhận',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
};

const typeLabelMap: Record<string, string> = {
  medical: 'Khám bệnh',
  grooming: 'Grooming',
  vaccination: 'Tiêm phòng',
  surgery: 'Phẫu thuật',
  checkup: 'Kiểm tra',
  hotel: 'Khách sạn',
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<
    Array<{ date: string; revenue: number }>
  >([]);
  const [appointmentStats, setAppointmentStats] =
    useState<AppointmentStatsReport | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [newCustomers, setNewCustomers] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = dayjs().format('YYYY-MM-DD');
    const sevenDaysAgo = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

    await Promise.allSettled([
      // Today's revenue
      (async () => {
        try {
          const data = await reportService.getRevenue({
            start_date: today,
            end_date: today,
          });
          setTodayRevenue(data.total_revenue);
        } catch {
          setTodayRevenue(0);
        }
      })(),

      // Last 7 days revenue chart
      (async () => {
        try {
          const data = await reportService.getRevenue({
            start_date: sevenDaysAgo,
            end_date: today,
          });
          setRevenueData(
            (data.by_date ?? []).map((d) => ({
              date: dayjs(d.date).format('DD/MM'),
              revenue: d.revenue,
            })),
          );
        } catch {
          // Generate empty 7-day placeholders
          const placeholder = [];
          for (let i = 6; i >= 0; i--) {
            placeholder.push({
              date: dayjs().subtract(i, 'day').format('DD/MM'),
              revenue: 0,
            });
          }
          setRevenueData(placeholder);
        }
      })(),

      // Appointment stats (today)
      (async () => {
        try {
          const data = await reportService.getAppointmentStats({
            start_date: today,
            end_date: today,
          });
          setAppointmentStats(data);
        } catch {
          setAppointmentStats({ total: 0, by_status: {}, by_type: {}, by_date: [] });
        }
      })(),

      // Upcoming appointments
      (async () => {
        try {
          const resp = await appointmentService.getAll({
            start_date: today,
            status: 'scheduled,confirmed',
            limit: 10,
            sort: 'appointment_date',
            order: 'asc',
          });
          setUpcomingAppointments(resp.data ?? []);
        } catch {
          setUpcomingAppointments([]);
        }
      })(),

      // Top products this month
      (async () => {
        try {
          const data = await reportService.getTopProducts({
            start_date: monthStart,
            end_date: today,
            limit: 5,
          });
          setTopProducts(data ?? []);
        } catch {
          setTopProducts([]);
        }
      })(),

      // Stock alerts
      (async () => {
        try {
          const data = await reportService.getStockAlerts();
          setStockAlerts(data ?? []);
        } catch {
          setStockAlerts([]);
        }
      })(),

      // New customers this month
      (async () => {
        try {
          const data = await reportService.getCustomerStats({
            start_date: monthStart,
            end_date: today,
          });
          setNewCustomers(data.new_customers);
        } catch {
          setNewCustomers(0);
        }
      })(),
    ]);

    setLoading(false);
  };

  const appointmentColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'start_time',
      key: 'time',
      render: (_: string, record: Appointment) =>
        `${dayjs(record.appointment_date).format('DD/MM')} ${record.start_time?.slice(0, 5) ?? ''}`,
    },
    {
      title: 'Thú cưng',
      key: 'pet',
      render: (_: unknown, record: Appointment) =>
        record.pet?.name ?? `#${record.pet_id}`,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: Appointment) =>
        record.customer?.full_name ?? `#${record.customer_id}`,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeLabelMap[type] ?? type,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] ?? 'default'}>
          {statusLabelMap[status] ?? status}
        </Tag>
      ),
    },
  ];

  const stockAlertColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Chi nhánh',
      dataIndex: 'branch_name',
      key: 'branch_name',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty: number, record: StockAlert) => (
        <Text type="danger">
          {qty} / {record.min_quantity}
        </Text>
      ),
    },
  ];

  const chartTooltipFormatter = (value: number) => [formatVND(value), 'Doanh thu'];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        Dashboard
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Tổng quan hoạt động phòng khám &amp; cửa hàng
      </Text>

      {/* ====== Stat Cards ====== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title="Doanh thu hôm nay"
              value={todayRevenue}
              formatter={(val) => formatVND(val as number)}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title="Lịch hẹn hôm nay"
              value={appointmentStats?.total ?? 0}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title="Khách hàng mới"
              value={newCustomers}
              prefix={<UserAddOutlined style={{ color: '#722ed1' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  tháng này
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              title="Cảnh báo tồn kho"
              value={stockAlerts.length}
              prefix={
                <WarningOutlined
                  style={{
                    color: stockAlerts.length > 0 ? '#faad14' : '#52c41a',
                  }}
                />
              }
              valueStyle={
                stockAlerts.length > 0 ? { color: '#faad14' } : undefined
              }
            />
          </Card>
        </Col>
      </Row>

      {/* ====== Revenue Chart ====== */}
      <Card
        title="Doanh thu 7 ngày gần nhất"
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis
              tickFormatter={(value: number) =>
                value >= 1_000_000
                  ? `${(value / 1_000_000).toFixed(0)}M`
                  : value >= 1_000
                    ? `${(value / 1_000).toFixed(0)}K`
                    : String(value)
              }
            />
            <Tooltip formatter={chartTooltipFormatter} />
            <Bar
              dataKey="revenue"
              fill="#1677ff"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ====== Appointments + Top Products ====== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title="Lịch hẹn sắp tới"
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <Table
              columns={appointmentColumns}
              dataSource={upcomingAppointments}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'Không có lịch hẹn sắp tới' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Top sản phẩm bán chạy"
            style={{
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <List
              dataSource={topProducts}
              locale={{ emptyText: 'Chưa có dữ liệu' }}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor:
                            index === 0
                              ? '#f5222d'
                              : index === 1
                                ? '#fa8c16'
                                : index === 2
                                  ? '#fadb14'
                                  : '#1677ff',
                        }}
                        icon={<ShoppingOutlined />}
                      />
                    }
                    title={item.product_name}
                    description={`Đã bán: ${item.total_quantity} — Doanh thu: ${formatVND(item.total_revenue)}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* ====== Stock Alerts ====== */}
      {stockAlerts.length > 0 ? (
        <Card
          title="Cảnh báo tồn kho thấp"
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Alert
            message="Một số sản phẩm có số lượng tồn kho dưới mức tối thiểu"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={stockAlertColumns}
            dataSource={stockAlerts}
            rowKey={(r) => `${r.branch_id}-${r.product_id}`}
            pagination={false}
            size="small"
          />
        </Card>
      ) : (
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <Alert
            message="Tồn kho ổn định"
            description="Không có sản phẩm nào dưới mức tồn kho tối thiểu."
            type="success"
            showIcon
          />
        </Card>
      )}
    </div>
  );
}
