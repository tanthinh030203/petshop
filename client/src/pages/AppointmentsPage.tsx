import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { appointmentService } from '@/services/appointment.service';
import { customerService } from '@/services/customer.service';
import { userService } from '@/services/user.service';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  Customer,
  Pet,
  User,
} from '@/types';

const { RangePicker } = DatePicker;

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  scheduled: 'blue',
  confirmed: 'cyan',
  in_progress: 'orange',
  completed: 'green',
  cancelled: 'red',
  no_show: 'default',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: 'Đã đặt',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
};

const TYPE_LABEL: Record<AppointmentType, string> = {
  medical: 'Khám bệnh',
  grooming: 'Grooming',
  vaccination: 'Tiêm phòng',
  surgery: 'Phẫu thuật',
  checkup: 'Tái khám',
  hotel: 'Lưu trú',
};

const TYPE_COLOR: Record<AppointmentType, string> = {
  medical: 'blue',
  grooming: 'purple',
  vaccination: 'green',
  surgery: 'red',
  checkup: 'cyan',
  hotel: 'orange',
};

const ALL_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

const ALL_TYPES: AppointmentType[] = [
  'medical',
  'grooming',
  'vaccination',
  'surgery',
  'checkup',
  'hotel',
];

export default function AppointmentsPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | undefined>();
  const [filterType, setFilterType] = useState<AppointmentType | undefined>();

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Lookup data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (dateRange) {
        params.from = dateRange[0].format('YYYY-MM-DD');
        params.to = dateRange[1].format('YYYY-MM-DD');
      }
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;

      const res = await appointmentService.getAll(params);
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, dateRange, filterStatus, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadLookups = useCallback(async () => {
    try {
      const [custRes, userRes] = await Promise.all([
        customerService.getAll({ limit: 500 }),
        userService.getAll({ limit: 500 }),
      ]);
      setCustomers(custRes.data);
      setUsers(userRes.data);
    } catch {
      // graceful fallback
    }
  }, []);

  const handleOpenModal = () => {
    form.resetFields();
    setSelectedCustomerId(null);
    setPets([]);
    loadLookups();
    setModalOpen(true);
  };

  const handleCustomerChange = async (custId: number) => {
    setSelectedCustomerId(custId);
    form.setFieldValue('petId', undefined);
    try {
      const petList = await customerService.getPets(custId);
      setPets(petList);
    } catch {
      setPets([]);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await appointmentService.create({
        customer_id: values.customerId,
        pet_id: values.petId,
        assigned_user_id: values.assignedUserId,
        appointment_date: values.appointmentDate.format('YYYY-MM-DD'),
        start_time: values.startTime.format('HH:mm'),
        end_time: values.endTime ? values.endTime.format('HH:mm') : undefined,
        type: values.type,
        reason: values.reason,
        note: values.note,
      });
      message.success('Tạo lịch hẹn thành công');
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Không thể tạo lịch hẹn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, status);
      message.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const columns: ColumnsType<Appointment> = useMemo(
    () => [
      {
        title: 'Ngày',
        dataIndex: 'appointment_date',
        key: 'date',
        width: 110,
        render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      },
      {
        title: 'Giờ',
        dataIndex: 'start_time',
        key: 'time',
        width: 80,
        render: (v: string) => v?.slice(0, 5),
      },
      {
        title: 'Thú cưng',
        key: 'pet',
        render: (_: unknown, r: Appointment) => r.pet?.name ?? `#${r.pet_id}`,
      },
      {
        title: 'Khách hàng',
        key: 'customer',
        render: (_: unknown, r: Appointment) => r.customer?.full_name ?? `#${r.customer_id}`,
      },
      {
        title: 'Loại',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (t: AppointmentType) => (
          <Tag color={TYPE_COLOR[t]}>{TYPE_LABEL[t]}</Tag>
        ),
      },
      {
        title: 'Bác sĩ/NV',
        key: 'assigned',
        render: (_: unknown, r: Appointment) =>
          r.assigned_user?.full_name ?? (r.assigned_user_id ? `#${r.assigned_user_id}` : '-'),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (s: AppointmentStatus) => (
          <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
        ),
      },
      {
        title: 'Hành động',
        key: 'action',
        width: 160,
        render: (_: unknown, record: Appointment) => {
          const items = ALL_STATUSES.filter((s) => s !== record.status).map((s) => ({
            key: s,
            label: STATUS_LABEL[s],
            onClick: () => handleStatusChange(record.id, s),
          }));
          return (
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button size="small">
                Đổi trạng thái <DownOutlined />
              </Button>
            </Dropdown>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div>
      <Typography.Title level={4}>Lịch hẹn</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            style={{ width: 160 }}
            value={filterStatus}
            onChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
            options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <Select
            allowClear
            placeholder="Loại"
            style={{ width: 160 }}
            value={filterType}
            onChange={(v) => {
              setFilterType(v);
              setPage(1);
            }}
            options={ALL_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Thêm lịch hẹn
          </Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 900 }}
      />

      <Modal
        title="Thêm lịch hẹn"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customerId"
            label="Khách hàng"
            rules={[{ required: true, message: 'Chọn khách hàng' }]}
          >
            <Select
              showSearch
              placeholder="Tìm khách hàng"
              optionFilterProp="label"
              onChange={handleCustomerChange}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.full_name} - ${c.phone}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="petId"
            label="Thú cưng"
            rules={[{ required: true, message: 'Chọn thú cưng' }]}
          >
            <Select
              placeholder={selectedCustomerId ? 'Chọn thú cưng' : 'Chọn khách hàng trước'}
              disabled={!selectedCustomerId}
              options={pets.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.species})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="assignedUserId" label="Bác sĩ / Nhân viên">
            <Select
              showSearch
              allowClear
              placeholder="Chọn bác sĩ / nhân viên"
              optionFilterProp="label"
              options={users.map((u) => ({
                value: u.id,
                label: `${u.full_name} (${u.role})`,
              }))}
            />
          </Form.Item>

          <Space size="middle">
            <Form.Item
              name="appointmentDate"
              label="Ngày hẹn"
              rules={[{ required: true, message: 'Chọn ngày' }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="startTime"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: 'Chọn giờ' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="endTime" label="Giờ kết thúc">
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>

          <Form.Item
            name="type"
            label="Loại"
            rules={[{ required: true, message: 'Chọn loại' }]}
          >
            <Select
              placeholder="Chọn loại"
              options={ALL_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
            />
          </Form.Item>

          <Form.Item name="reason" label="Lý do">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
