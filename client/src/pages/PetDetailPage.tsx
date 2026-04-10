import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tabs,
  Button,
  Tag,
  Space,
  Spin,
  message,
  Typography,
  Avatar,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { petService } from '@/services/pet.service';
import type { Pet, PetSpecies, MedicalRecord, Vaccination, Appointment } from '@/types';

const { Title } = Typography;

const speciesMap: Record<PetSpecies, string> = {
  dog: 'Chó',
  cat: 'Mèo',
  bird: 'Chim',
  hamster: 'Hamster',
  rabbit: 'Thỏ',
  fish: 'Cá',
  reptile: 'Bò sát',
  other: 'Khác',
};

const petGenderMap: Record<string, string> = {
  male: 'Đực',
  female: 'Cái',
  unknown: 'Không rõ',
};

const appointmentStatusMap: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Đã đặt', color: 'blue' },
  confirmed: { label: 'Đã xác nhận', color: 'cyan' },
  in_progress: { label: 'Đang khám', color: 'orange' },
  completed: { label: 'Hoàn thành', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
  no_show: { label: 'Không đến', color: 'default' },
};

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pet, setPet] = useState<Pet | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPet = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [petData, records, vacs, appts] = await Promise.all([
        petService.getById(Number(id)),
        petService.getMedicalRecords(Number(id)),
        petService.getVaccinations(Number(id)),
        petService.getAppointments(Number(id)),
      ]);
      setPet(petData);
      setMedicalRecords(records);
      setVaccinations(vacs);
      setAppointments(appts);
    } catch {
      message.error('Không thể tải thông tin thú cưng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const medicalColumns: ColumnsType<MedicalRecord> = [
    {
      title: 'Ngày khám',
      dataIndex: 'visit_date',
      key: 'visit_date',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Bác sĩ',
      dataIndex: ['vet', 'full_name'],
      key: 'vet',
    },
    {
      title: 'Triệu chứng',
      dataIndex: 'symptoms',
      key: 'symptoms',
      ellipsis: true,
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
    },
    {
      title: 'Điều trị',
      dataIndex: 'treatment',
      key: 'treatment',
      ellipsis: true,
    },
    {
      title: 'Tái khám',
      dataIndex: 'follow_up_date',
      key: 'follow_up_date',
      width: 120,
      render: (d: string | undefined) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
  ];

  const vaccinationColumns: ColumnsType<Vaccination> = [
    {
      title: 'Tên vaccine',
      dataIndex: 'vaccine_name',
      key: 'vaccine_name',
    },
    {
      title: 'Lô vaccine',
      dataIndex: 'vaccine_batch',
      key: 'vaccine_batch',
    },
    {
      title: 'Ngày tiêm',
      dataIndex: 'vaccination_date',
      key: 'vaccination_date',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày tiêm tiếp',
      dataIndex: 'next_due_date',
      key: 'next_due_date',
      width: 130,
      render: (d: string | undefined) => (d ? dayjs(d).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Bác sĩ',
      dataIndex: ['vet', 'full_name'],
      key: 'vet',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
  ];

  const appointmentColumns: ColumnsType<Appointment> = [
    {
      title: 'Ngày hẹn',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      width: 120,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Giờ',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 80,
      render: (t: string) => t?.slice(0, 5) || '-',
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 110,
    },
    {
      title: 'Bác sĩ',
      dataIndex: ['assigned_user', 'full_name'],
      key: 'assigned_user',
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const s = appointmentStatusMap[status];
        return s ? <Tag color={s.color}>{s.label}</Tag> : status;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Title level={4}>Không tìm thấy thú cưng</Title>
        <Button onClick={() => navigate('/pets')}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/pets')}>
          Quay lại
        </Button>
      </Space>

      <Card
        title={
          <Space>
            <span>Thông tin thú cưng - {pet.name}</span>
            <Tag color={pet.is_active ? 'green' : 'red'}>
              {pet.is_active ? 'Hoạt động' : 'Ngừng'}
            </Tag>
          </Space>
        }
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/pets`)}>
            Chỉnh sửa
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flexShrink: 0 }}>
            {pet.photo_url ? (
              <Avatar src={pet.photo_url} size={120} shape="square" />
            ) : (
              <Avatar
                size={120}
                shape="square"
                style={{ backgroundColor: '#f0f0f0', color: '#999', fontSize: 40 }}
              >
                {speciesMap[pet.species]?.charAt(0) || '?'}
              </Avatar>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
              <Descriptions.Item label="Mã">{pet.code}</Descriptions.Item>
              <Descriptions.Item label="Tên">{pet.name}</Descriptions.Item>
              <Descriptions.Item label="Loài">
                <Tag color="blue">{speciesMap[pet.species] || pet.species}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Giống">{pet.breed || '-'}</Descriptions.Item>
              <Descriptions.Item label="Màu sắc">{pet.color || '-'}</Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {petGenderMap[pet.gender] || pet.gender}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {pet.date_of_birth
                  ? dayjs(pet.date_of_birth).format('DD/MM/YYYY')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Cân nặng">
                {pet.weight != null ? `${pet.weight} kg` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Mã microchip">
                {pet.microchip_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Triệt sản">
                <Tag color={pet.is_neutered ? 'green' : 'default'}>
                  {pet.is_neutered ? 'Đã triệt sản' : 'Chưa'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Dị ứng" span={2}>
                {pet.allergies || 'Không có'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </Card>

      {pet.customer && (
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Thông tin chủ sở hữu</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          size="small"
        >
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Họ tên">
              <a onClick={() => navigate(`/customers/${pet.customer_id}`)}>
                {pet.customer.full_name}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {pet.customer.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {pet.customer.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {pet.customer.address || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card>
        <Tabs
          defaultActiveKey="medical"
          items={[
            {
              key: 'medical',
              label: `Hồ sơ y tế (${medicalRecords.length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={medicalColumns}
                  dataSource={medicalRecords}
                  pagination={medicalRecords.length > 10 ? { pageSize: 10 } : false}
                />
              ),
            },
            {
              key: 'vaccinations',
              label: `Lịch tiêm phòng (${vaccinations.length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={vaccinationColumns}
                  dataSource={vaccinations}
                  pagination={vaccinations.length > 10 ? { pageSize: 10 } : false}
                />
              ),
            },
            {
              key: 'appointments',
              label: `Lịch hẹn (${appointments.length})`,
              children: (
                <Table
                  rowKey="id"
                  columns={appointmentColumns}
                  dataSource={appointments}
                  pagination={appointments.length > 10 ? { pageSize: 10 } : false}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
