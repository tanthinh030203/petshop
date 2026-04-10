import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  DatePicker,
  Select,
  message,
  Typography,
  Spin,
  Tooltip,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { appointmentService } from '@/services/appointment.service';
import type { Appointment, AppointmentStatus } from '@/types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({
  value,
  label,
}));

export default function GroomingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchAppointments = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          page,
          limit: pageSize,
          type: 'grooming',
        };
        if (dateRange) {
          params.start_date = dateRange[0].format('YYYY-MM-DD');
          params.end_date = dateRange[1].format('YYYY-MM-DD');
        }
        if (statusFilter) {
          params.status = statusFilter;
        }
        const res = await appointmentService.getAll(params);
        setAppointments(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách lịch hẹn grooming');
      } finally {
        setLoading(false);
      }
    },
    [dateRange, statusFilter],
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchAppointments(pag.current, pag.pageSize);
  };

  const handleStatusUpdate = async (id: number, status: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, status);
      message.success(
        status === 'in_progress'
          ? 'Đã bắt đầu dịch vụ'
          : 'Đã hoàn thành dịch vụ',
      );
      fetchAppointments(pagination.current, pagination.pageSize);
    } catch {
      message.error('Cập nhật trạng thái thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: ColumnsType<Appointment> = [
    {
      title: 'Ngày',
      dataIndex: 'appointment_date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ',
      dataIndex: 'start_time',
      key: 'time',
      width: 100,
      render: (time: string) => time?.slice(0, 5) ?? '—',
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
      title: 'Dịch vụ',
      key: 'services',
      render: (_: unknown, record: Appointment) =>
        record.services && record.services.length > 0
          ? record.services.map((s) => s.service?.name ?? `DV #${s.service_id}`).join(', ')
          : '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColorMap[status] ?? 'default'}>
          {statusLabelMap[status] ?? status}
        </Tag>
      ),
    },
    {
      title: 'NV phụ trách',
      key: 'assigned_user',
      width: 150,
      render: (_: unknown, record: Appointment) =>
        record.assigned_user?.full_name ?? (record.assigned_user_id ? `#${record.assigned_user_id}` : '—'),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (note: string) => note || '—',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      align: 'center',
      render: (_: unknown, record: Appointment) => (
        <Space>
          {(record.status === 'scheduled' || record.status === 'confirmed') && (
            <Tooltip title="Bắt đầu">
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                loading={updatingId === record.id}
                onClick={() => handleStatusUpdate(record.id, 'in_progress')}
              >
                Bắt đầu
              </Button>
            </Tooltip>
          )}
          {record.status === 'in_progress' && (
            <Tooltip title="Hoàn thành">
              <Button
                type="primary"
                size="small"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                icon={<CheckCircleOutlined />}
                loading={updatingId === record.id}
                onClick={() => handleStatusUpdate(record.id, 'completed')}
              >
                Hoàn thành
              </Button>
            </Tooltip>
          )}
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
            <ScissorOutlined style={{ marginRight: 8 }} />
            Grooming &amp; Spa
          </Title>
          <Text type="secondary">Quản lý dịch vụ làm đẹp thú cưng</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchAppointments(pagination.current, pagination.pageSize)}
        >
          Làm mới
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <RangePicker
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          onChange={(dates) =>
            setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
          }
          allowClear
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 180 }}
          options={statusOptions}
          onChange={(val) => setStatusFilter(val)}
        />
      </Space>

      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={appointments}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{ emptyText: 'Không có lịch hẹn grooming nào' }}
          scroll={{ x: 1000 }}
        />
      </Spin>
    </div>
  );
}
