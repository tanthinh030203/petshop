import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Calendar,
  Card,
  Col,
  List,
  Row,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { appointmentService } from '@/services/appointment.service';
import type { Appointment, AppointmentStatus, AppointmentType } from '@/types';

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

export default function AppointmentCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const fetchCalendar = useCallback(async (month: Dayjs) => {
    setLoading(true);
    try {
      const result = await appointmentService.getCalendar({
        year: month.year(),
        month: month.month() + 1,
      });
      setAppointments(result);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentMonth);
  }, [currentMonth, fetchCalendar]);

  /** Group appointments by date string YYYY-MM-DD */
  const byDate = appointments.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const key = apt.appointment_date?.slice(0, 10);
    if (key) {
      (acc[key] ??= []).push(apt);
    }
    return acc;
  }, {});

  const dateCellRender = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD');
    const list = byDate[key];
    if (!list?.length) return null;
    return (
      <Badge
        count={list.length}
        style={{ backgroundColor: '#1677ff' }}
        size="small"
      />
    );
  };

  const selectedKey = selectedDate.format('YYYY-MM-DD');
  const selectedAppointments = byDate[selectedKey] ?? [];

  return (
    <div>
      <Typography.Title level={4}>Lịch hẹn - Dạng lịch</Typography.Title>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card loading={loading}>
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={(date) => setSelectedDate(date)}
              onPanelChange={(date) => {
                setCurrentMonth(date);
                setSelectedDate(date);
              }}
              cellRender={(date, info) => {
                if (info.type === 'date') return dateCellRender(date as Dayjs);
                return null;
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={`Lịch hẹn ngày ${selectedDate.format('DD/MM/YYYY')}`}
            style={{ minHeight: 400 }}
          >
            {selectedAppointments.length === 0 ? (
              <Typography.Text type="secondary">
                Không có lịch hẹn nào.
              </Typography.Text>
            ) : (
              <List
                dataSource={selectedAppointments}
                renderItem={(apt) => (
                  <List.Item key={apt.id}>
                    <List.Item.Meta
                      title={
                        <span>
                          {apt.start_time?.slice(0, 5)}{' '}
                          {apt.pet?.name ?? `Pet #${apt.pet_id}`}
                        </span>
                      }
                      description={
                        <>
                          <Tag color={TYPE_COLOR[apt.type]}>
                            {TYPE_LABEL[apt.type]}
                          </Tag>
                          <Tag color={STATUS_COLOR[apt.status]}>
                            {STATUS_LABEL[apt.status]}
                          </Tag>
                          {apt.assigned_user?.full_name && (
                            <span style={{ marginLeft: 4 }}>
                              - {apt.assigned_user.full_name}
                            </span>
                          )}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
