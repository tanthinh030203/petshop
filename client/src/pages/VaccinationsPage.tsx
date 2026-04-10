import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { vaccinationService } from '@/services/vaccination.service';
import { petService } from '@/services/pet.service';
import type { Pet, Vaccination } from '@/types';

export default function VaccinationsPage() {
  const [data, setData] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reminders
  const [reminders, setReminders] = useState<Vaccination[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  // Create modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Lookups
  const [pets, setPets] = useState<Pet[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vaccinationService.getAll({ page, limit: pageSize });
      setData(res.data);
      setTotal(res.meta.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const fetchReminders = useCallback(async () => {
    setRemindersLoading(true);
    try {
      const result = await vaccinationService.getReminders();
      setReminders(result);
    } catch {
      setReminders([]);
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchReminders();
  }, [fetchData, fetchReminders]);

  const loadPets = useCallback(async () => {
    try {
      const res = await petService.getAll({ limit: 500 });
      setPets(res.data);
    } catch {
      setPets([]);
    }
  }, []);

  const handleOpenModal = () => {
    form.resetFields();
    loadPets();
    setModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      await vaccinationService.create({
        pet_id: v.petId,
        vaccine_name: v.vaccineName,
        vaccine_batch: v.vaccineBatch,
        vaccination_date: v.vaccinationDate.format('YYYY-MM-DD'),
        next_due_date: v.nextDueDate?.format('YYYY-MM-DD'),
        note: v.note,
      });
      message.success('Thêm tiêm phòng thành công');
      setModalOpen(false);
      fetchData();
      fetchReminders();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Không thể thêm tiêm phòng');
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (nextDueDate?: string) => {
    if (!nextDueDate) return false;
    return dayjs(nextDueDate).isBefore(dayjs(), 'day');
  };

  const columns: ColumnsType<Vaccination> = [
    {
      title: 'Thú cưng',
      key: 'pet',
      render: (_: unknown, r: Vaccination) => r.pet?.name ?? `#${r.pet_id}`,
    },
    {
      title: 'Tên vaccine',
      dataIndex: 'vaccine_name',
      key: 'vaccine_name',
    },
    {
      title: 'Số lô',
      dataIndex: 'vaccine_batch',
      key: 'vaccine_batch',
      render: (v: string | undefined) => v || '-',
    },
    {
      title: 'Ngày tiêm',
      dataIndex: 'vaccination_date',
      key: 'vaccination_date',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày tiêm tiếp theo',
      dataIndex: 'next_due_date',
      key: 'next_due_date',
      width: 160,
      render: (v: string | undefined) => {
        if (!v) return '-';
        const overdue = isOverdue(v);
        return (
          <span style={{ color: overdue ? '#ff4d4f' : undefined, fontWeight: overdue ? 600 : undefined }}>
            {overdue && <WarningOutlined style={{ marginRight: 4 }} />}
            {dayjs(v).format('DD/MM/YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Bác sĩ',
      key: 'vet',
      render: (_: unknown, r: Vaccination) => r.vet?.full_name ?? (r.vet_id ? `#${r.vet_id}` : '-'),
    },
  ];

  const upcomingReminders = reminders.filter((r) => {
    if (!r.next_due_date) return false;
    const diff = dayjs(r.next_due_date).diff(dayjs(), 'day');
    return diff >= 0 && diff <= 7;
  });

  const overdueReminders = reminders.filter((r) => isOverdue(r.next_due_date));

  return (
    <div>
      <Typography.Title level={4}>Tiêm phòng</Typography.Title>

      {/* Reminders section */}
      {!remindersLoading && (overdueReminders.length > 0 || upcomingReminders.length > 0) && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          {overdueReminders.length > 0 && (
            <Alert
              type="error"
              showIcon
              icon={<WarningOutlined />}
              message={
                <span>
                  <Badge count={overdueReminders.length} style={{ backgroundColor: '#ff4d4f', marginRight: 8 }} />
                  Tiêm phòng quá hạn
                </span>
              }
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {overdueReminders.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      {r.pet?.name ?? `Pet #${r.pet_id}`} - {r.vaccine_name} (hạn:{' '}
                      {dayjs(r.next_due_date).format('DD/MM/YYYY')})
                    </li>
                  ))}
                  {overdueReminders.length > 5 && (
                    <li>...và {overdueReminders.length - 5} mục khác</li>
                  )}
                </ul>
              }
            />
          )}
          {upcomingReminders.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={
                <span>
                  <Badge count={upcomingReminders.length} style={{ backgroundColor: '#faad14', marginRight: 8 }} />
                  Tiêm phòng sắp đến hạn (trong 7 ngày)
                </span>
              }
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {upcomingReminders.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      {r.pet?.name ?? `Pet #${r.pet_id}`} - {r.vaccine_name} (hạn:{' '}
                      {dayjs(r.next_due_date).format('DD/MM/YYYY')})
                    </li>
                  ))}
                  {upcomingReminders.length > 5 && (
                    <li>...và {upcomingReminders.length - 5} mục khác</li>
                  )}
                </ul>
              }
            />
          )}
        </Space>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          Thêm tiêm phòng
        </Button>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowClassName={(record) =>
          isOverdue(record.next_due_date) ? 'ant-table-row-overdue' : ''
        }
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
        scroll={{ x: 700 }}
      />

      {/* Inline style for overdue rows */}
      <style>{`
        .ant-table-row-overdue td {
          background-color: #fff2f0 !important;
        }
      `}</style>

      <Modal
        title="Thêm tiêm phòng"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="petId"
            label="Thú cưng"
            rules={[{ required: true, message: 'Chọn thú cưng' }]}
          >
            <Select
              showSearch
              placeholder="Tìm thú cưng"
              optionFilterProp="label"
              options={pets.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.species}) - ${p.customer?.full_name ?? ''}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="vaccineName"
            label="Tên vaccine"
            rules={[{ required: true, message: 'Nhập tên vaccine' }]}
          >
            <Input placeholder="VD: Dại, 5 bệnh, 7 bệnh..." />
          </Form.Item>

          <Form.Item name="vaccineBatch" label="Số lô">
            <Input />
          </Form.Item>

          <Space size="middle">
            <Form.Item
              name="vaccinationDate"
              label="Ngày tiêm"
              rules={[{ required: true, message: 'Chọn ngày tiêm' }]}
              initialValue={dayjs()}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="nextDueDate" label="Ngày tiêm tiếp theo">
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          </Space>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
