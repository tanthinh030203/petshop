import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { medicalService } from '@/services/medical.service';
import { appointmentService } from '@/services/appointment.service';
import { userService } from '@/services/user.service';
import { petService } from '@/services/pet.service';
import { productService } from '@/services/product.service';
import type {
  Appointment,
  MedicalRecord,
  Pet,
  Prescription,
  Product,
  User,
} from '@/types';

export default function MedicalRecordsPage() {
  const [data, setData] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Lookups
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<MedicalRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add prescription modal
  const [rxOpen, setRxOpen] = useState(false);
  const [rxForm] = Form.useForm();
  const [rxSubmitting, setRxSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicalService.getAll({ page, limit: pageSize });
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadLookups = useCallback(async () => {
    try {
      const [aptRes, petRes, userRes, prodRes] = await Promise.all([
        appointmentService.getAll({
          from: dayjs().format('YYYY-MM-DD'),
          to: dayjs().format('YYYY-MM-DD'),
          limit: 200,
        }),
        petService.getAll({ limit: 500 }),
        userService.getAll({ limit: 500 }),
        productService.getAll({ limit: 500, is_prescription: true }),
      ]);
      setTodayAppointments(aptRes.data);
      setPets(petRes.data);
      setUsers(userRes.data);
      setProducts(prodRes.data);
    } catch {
      // graceful fallback
    }
  }, []);

  const handleOpenCreate = () => {
    createForm.resetFields();
    loadLookups();
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      const v = await createForm.validateFields();
      setSubmitting(true);
      await medicalService.create({
        appointment_id: v.appointmentId,
        pet_id: v.petId,
        vet_id: v.vetId,
        visit_date: v.visitDate.format('YYYY-MM-DD HH:mm:ss'),
        weight: v.weight,
        temperature: v.temperature,
        heart_rate: v.heartRate,
        symptoms: v.symptoms,
        diagnosis: v.diagnosis,
        treatment: v.treatment,
        note: v.note,
        follow_up_date: v.followUpDate?.format('YYYY-MM-DD'),
      });
      message.success('Tạo hồ sơ khám thành công');
      setCreateOpen(false);
      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Không thể tạo hồ sơ khám');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const record = await medicalService.getById(id);
      setDetail(record);
    } catch {
      message.error('Không thể tải chi tiết hồ sơ');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenRx = () => {
    if (products.length === 0) loadLookups();
    rxForm.resetFields();
    setRxOpen(true);
  };

  const handleAddRx = async () => {
    try {
      const v = await rxForm.validateFields();
      if (!detail) return;
      setRxSubmitting(true);
      const items: Partial<Prescription>[] = [
        {
          product_id: v.productId,
          dosage: v.dosage,
          frequency: v.frequency,
          duration_days: v.durationDays,
          quantity: v.quantity,
          unit_price: v.unitPrice,
        },
      ];
      await medicalService.addPrescriptions(detail.id, items);
      message.success('Thêm đơn thuốc thành công');
      setRxOpen(false);
      // Reload detail
      const updated = await medicalService.getById(detail.id);
      setDetail(updated);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Không thể thêm đơn thuốc');
    } finally {
      setRxSubmitting(false);
    }
  };

  const columns: ColumnsType<MedicalRecord> = [
    {
      title: 'Ngày khám',
      dataIndex: 'visit_date',
      key: 'visit_date',
      width: 140,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thú cưng',
      key: 'pet',
      render: (_: unknown, r: MedicalRecord) => r.pet?.name ?? `#${r.pet_id}`,
    },
    {
      title: 'Bác sĩ',
      key: 'vet',
      render: (_: unknown, r: MedicalRecord) => r.vet?.full_name ?? `#${r.vet_id}`,
    },
    {
      title: 'Triệu chứng',
      dataIndex: 'symptoms',
      key: 'symptoms',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Tái khám',
      dataIndex: 'follow_up_date',
      key: 'follow_up',
      width: 120,
      render: (v: string | undefined) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_: unknown, r: MedicalRecord) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(r.id)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Hồ sơ bệnh án</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Tạo hồ sơ khám
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
        scroll={{ x: 800 }}
      />

      {/* Create Medical Record Modal */}
      <Modal
        title="Tạo hồ sơ khám"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="appointmentId" label="Lịch hẹn hôm nay">
            <Select
              allowClear
              placeholder="Chọn lịch hẹn (nếu có)"
              options={todayAppointments.map((a) => ({
                value: a.id,
                label: `${a.start_time?.slice(0, 5)} - ${a.pet?.name ?? `Pet #${a.pet_id}`} (${a.customer?.full_name ?? ''})`,
              }))}
              onChange={(aptId) => {
                const apt = todayAppointments.find((a) => a.id === aptId);
                if (apt) {
                  createForm.setFieldsValue({
                    petId: apt.pet_id,
                    vetId: apt.assigned_user_id,
                  });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="petId"
            label="Thú cưng"
            rules={[{ required: true, message: 'Chọn thú cưng' }]}
          >
            <Select
              showSearch
              placeholder="Chọn thú cưng"
              optionFilterProp="label"
              options={pets.map((p) => ({
                value: p.id,
                label: `${p.name} - ${p.customer?.full_name ?? ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="vetId" label="Bác sĩ">
            <Select
              showSearch
              allowClear
              placeholder="Chọn bác sĩ"
              optionFilterProp="label"
              options={users
                .filter((u) => u.role === 'veterinarian')
                .map((u) => ({ value: u.id, label: u.full_name }))}
            />
          </Form.Item>

          <Form.Item
            name="visitDate"
            label="Ngày giờ khám"
            rules={[{ required: true, message: 'Chọn ngày giờ' }]}
            initialValue={dayjs()}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Divider orientation="left">Chỉ số sinh tồn</Divider>

          <Space size="middle">
            <Form.Item name="weight" label="Cân nặng (kg)">
              <InputNumber min={0} step={0.1} />
            </Form.Item>
            <Form.Item name="temperature" label="Nhiệt độ (°C)">
              <InputNumber min={30} max={45} step={0.1} />
            </Form.Item>
            <Form.Item name="heartRate" label="Nhịp tim (bpm)">
              <InputNumber min={0} max={300} />
            </Form.Item>
          </Space>

          <Form.Item name="symptoms" label="Triệu chứng">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="diagnosis" label="Chẩn đoán">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="treatment" label="Điều trị">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="followUpDate" label="Ngày tái khám">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="Chi tiết hồ sơ bệnh án"
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        width={640}
        loading={detailLoading}
      >
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Thú cưng">
                {detail.pet?.name ?? `#${detail.pet_id}`}
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ">
                {detail.vet?.full_name ?? `#${detail.vet_id}`}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khám">
                {dayjs(detail.visit_date).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Tái khám">
                {detail.follow_up_date
                  ? dayjs(detail.follow_up_date).format('DD/MM/YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Cân nặng">
                {detail.weight ? `${detail.weight} kg` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Nhiệt độ">
                {detail.temperature ? `${detail.temperature} °C` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Nhịp tim">
                {detail.heart_rate ? `${detail.heart_rate} bpm` : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Typography.Text strong>Triệu chứng:</Typography.Text>
            <Typography.Paragraph>{detail.symptoms || '-'}</Typography.Paragraph>

            <Typography.Text strong>Chẩn đoán:</Typography.Text>
            <Typography.Paragraph>{detail.diagnosis || '-'}</Typography.Paragraph>

            <Typography.Text strong>Điều trị:</Typography.Text>
            <Typography.Paragraph>{detail.treatment || '-'}</Typography.Paragraph>

            {detail.note && (
              <>
                <Typography.Text strong>Ghi chú:</Typography.Text>
                <Typography.Paragraph>{detail.note}</Typography.Paragraph>
              </>
            )}

            <Divider orientation="left">Đơn thuốc</Divider>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleOpenRx}
              style={{ marginBottom: 12 }}
            >
              Thêm đơn thuốc
            </Button>

            {detail.prescriptions && detail.prescriptions.length > 0 ? (
              <List
                bordered
                size="small"
                dataSource={detail.prescriptions}
                renderItem={(rx: Prescription) => (
                  <List.Item>
                    <List.Item.Meta
                      title={rx.product?.name ?? `Sản phẩm #${rx.product_id}`}
                      description={
                        <Space direction="vertical" size={0}>
                          {rx.dosage && <span>Liều: {rx.dosage}</span>}
                          {rx.frequency && <span>Tần suất: {rx.frequency}</span>}
                          {rx.duration_days && (
                            <span>Thời gian: {rx.duration_days} ngày</span>
                          )}
                          <span>
                            SL: {rx.quantity} &middot; Đơn giá:{' '}
                            {rx.unit_price?.toLocaleString('vi-VN')}đ
                          </span>
                        </Space>
                      }
                    />
                    <Tag color="blue">
                      {(rx.quantity * rx.unit_price).toLocaleString('vi-VN')}đ
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">
                Chưa có đơn thuốc.
              </Typography.Text>
            )}
          </>
        )}
      </Drawer>

      {/* Add Prescription Modal */}
      <Modal
        title="Thêm đơn thuốc"
        open={rxOpen}
        onCancel={() => setRxOpen(false)}
        onOk={handleAddRx}
        confirmLoading={rxSubmitting}
        destroyOnClose
      >
        <Form form={rxForm} layout="vertical">
          <Form.Item
            name="productId"
            label="Thuốc / Sản phẩm"
            rules={[{ required: true, message: 'Chọn thuốc' }]}
          >
            <Select
              showSearch
              placeholder="Tìm thuốc"
              optionFilterProp="label"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.sku})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="dosage" label="Liều dùng">
            <Input placeholder="VD: 1 viên/lần" />
          </Form.Item>
          <Form.Item name="frequency" label="Tần suất">
            <Input placeholder="VD: 2 lần/ngày" />
          </Form.Item>
          <Form.Item name="durationDays" label="Số ngày">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Space size="middle">
            <Form.Item
              name="quantity"
              label="Số lượng"
              rules={[{ required: true, message: 'Nhập số lượng' }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="unitPrice"
              label="Đơn giá (đ)"
              rules={[{ required: true, message: 'Nhập đơn giá' }]}
            >
              <InputNumber min={0} step={1000} style={{ width: 160 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
