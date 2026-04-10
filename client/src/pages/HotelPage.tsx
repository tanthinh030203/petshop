import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Card,
  Row,
  Col,
  message,
  Typography,
  Spin,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  LoginOutlined,
  LogoutOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { hotelService } from '@/services/hotel.service';
import type { HotelBooking, HotelBookingStatus } from '@/types';

const { Title, Text } = Typography;

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const statusColorMap: Record<HotelBookingStatus, string> = {
  booked: 'blue',
  checked_in: 'green',
  checked_out: 'default',
  cancelled: 'red',
};

const statusLabelMap: Record<HotelBookingStatus, string> = {
  booked: 'Đã đặt',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả',
  cancelled: 'Đã hủy',
};

// Generate room grid data from bookings
function buildRoomGrid(bookings: HotelBooking[]): Array<{ room: string; status: 'vacant' | 'occupied'; booking?: HotelBooking }> {
  const occupiedRooms = new Map<string, HotelBooking>();
  bookings.forEach((b) => {
    if (b.room_number && b.status === 'checked_in') {
      occupiedRooms.set(b.room_number, b);
    }
  });

  // Collect all known rooms
  const allRooms = new Set<string>();
  bookings.forEach((b) => {
    if (b.room_number) allRooms.add(b.room_number);
  });
  // Add default rooms if none exist
  if (allRooms.size === 0) {
    for (let i = 1; i <= 12; i++) {
      allRooms.add(`P${String(i).padStart(2, '0')}`);
    }
  }

  return Array.from(allRooms)
    .sort()
    .map((room) => ({
      room,
      status: occupiedRooms.has(room) ? 'occupied' as const : 'vacant' as const,
      booking: occupiedRooms.get(room),
    }));
}

export default function HotelPage() {
  const [form] = Form.useForm();
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchBookings = useCallback(
    async (page = 1, pageSize = 10) => {
      setLoading(true);
      try {
        const res = await hotelService.getAll({ page, limit: pageSize });
        setBookings(res.data);
        setPagination({
          current: res.meta.page,
          pageSize: res.meta.limit,
          total: res.meta.total,
        });
      } catch {
        message.error('Không thể tải danh sách đặt phòng');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchBookings(pag.current, pag.pageSize);
  };

  const handleCheckIn = async (id: number) => {
    setActionLoading(id);
    try {
      await hotelService.checkIn(id);
      message.success('Check-in thành công');
      fetchBookings(pagination.current, pagination.pageSize);
    } catch {
      message.error('Check-in thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (id: number) => {
    setActionLoading(id);
    try {
      await hotelService.checkOut(id);
      message.success('Check-out thành công');
      fetchBookings(pagination.current, pagination.pageSize);
    } catch {
      message.error('Check-out thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddBooking = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        check_in: values.check_in.toISOString(),
        expected_check_out: values.expected_check_out.toISOString(),
      };
      await hotelService.create(payload);
      message.success('Thêm đặt phòng thành công');
      setModalOpen(false);
      form.resetFields();
      fetchBookings(pagination.current, pagination.pageSize);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Thêm đặt phòng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const roomGrid = buildRoomGrid(bookings);

  const columns: ColumnsType<HotelBooking> = [
    {
      title: 'Phòng',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 90,
      render: (room: string) => room || '—',
    },
    {
      title: 'Thú cưng',
      key: 'pet',
      render: (_: unknown, record: HotelBooking) =>
        record.pet?.name ?? `#${record.pet_id}`,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: HotelBooking) =>
        record.customer?.full_name ?? `#${record.customer_id}`,
    },
    {
      title: 'Check-in',
      dataIndex: 'check_in',
      key: 'check_in',
      width: 150,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Check-out dự kiến',
      dataIndex: 'expected_check_out',
      key: 'expected_check_out',
      width: 150,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Check-out thực tế',
      dataIndex: 'check_out',
      key: 'check_out',
      width: 150,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Giá/ngày',
      dataIndex: 'daily_rate',
      key: 'daily_rate',
      width: 130,
      align: 'right',
      render: (val: number) => formatVND(val ?? 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: HotelBookingStatus) => (
        <Tag color={statusColorMap[status] ?? 'default'}>
          {statusLabelMap[status] ?? status}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_: unknown, record: HotelBooking) => (
        <Space>
          {record.status === 'booked' && (
            <Tooltip title="Check-in">
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                loading={actionLoading === record.id}
                onClick={() => handleCheckIn(record.id)}
              >
                Check-in
              </Button>
            </Tooltip>
          )}
          {record.status === 'checked_in' && (
            <Popconfirm
              title="Xác nhận check-out?"
              onConfirm={() => handleCheckOut(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                size="small"
                icon={<LogoutOutlined />}
                loading={actionLoading === record.id}
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
              >
                Check-out
              </Button>
            </Popconfirm>
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
            <HomeOutlined style={{ marginRight: 8 }} />
            Khách sạn thú cưng
          </Title>
          <Text type="secondary">Quản lý phòng lưu trú thú cưng</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchBookings(pagination.current, pagination.pageSize)}
          >
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Thêm đặt phòng
          </Button>
        </Space>
      </div>

      {/* Room Overview Grid */}
      <Card
        title="Tổng quan phòng"
        style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Row gutter={[12, 12]}>
          {roomGrid.map((room) => (
            <Col key={room.room} xs={12} sm={8} md={6} lg={4} xl={3}>
              <Card
                size="small"
                style={{
                  textAlign: 'center',
                  borderRadius: 8,
                  borderColor: room.status === 'occupied' ? '#52c41a' : '#d9d9d9',
                  backgroundColor: room.status === 'occupied' ? '#f6ffed' : '#fafafa',
                }}
              >
                <Text strong>{room.room}</Text>
                <br />
                <Tag
                  color={room.status === 'occupied' ? 'green' : 'default'}
                  style={{ marginTop: 4 }}
                >
                  {room.status === 'occupied' ? 'Đang sử dụng' : 'Trống'}
                </Tag>
                {room.booking && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {room.booking.pet?.name ?? `Pet #${room.booking.pet_id}`}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Bookings Table */}
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={bookings}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{ emptyText: 'Không có đặt phòng nào' }}
          scroll={{ x: 1200 }}
        />
      </Spin>

      {/* Add Booking Modal */}
      <Modal
        title="Thêm đặt phòng mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleAddBooking}
        confirmLoading={submitting}
        okText="Thêm mới"
        cancelText="Hủy"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="pet_id"
                label="Mã thú cưng"
                rules={[{ required: true, message: 'Vui lòng nhập mã thú cưng' }]}
              >
                <InputNumber
                  placeholder="ID thú cưng"
                  style={{ width: '100%' }}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer_id"
                label="Mã khách hàng"
                rules={[{ required: true, message: 'Vui lòng nhập mã khách hàng' }]}
              >
                <InputNumber
                  placeholder="ID khách hàng"
                  style={{ width: '100%' }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="room_number"
                label="Số phòng"
                rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
              >
                <Input placeholder="VD: P01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="daily_rate"
                label="Giá/ngày (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá/ngày' }]}
              >
                <InputNumber
                  placeholder="200000"
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => parseFloat(value?.replace(/,/g, '') || '0') as unknown as 0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="check_in"
                label="Ngày check-in"
                rules={[{ required: true, message: 'Vui lòng chọn ngày check-in' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn ngày giờ"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expected_check_out"
                label="Check-out dự kiến"
                rules={[{ required: true, message: 'Vui lòng chọn ngày check-out' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn ngày giờ"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="special_requests" label="Yêu cầu đặc biệt">
            <Input.TextArea rows={2} placeholder="VD: Chế độ ăn kiêng, thuốc..." />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú thêm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
