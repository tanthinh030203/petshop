import prisma from '../config/database';

export const create = async (branchId: number, vetId: number, data: any) => {
  const record = await prisma.medicalRecord.create({
    data: {
      branchId,
      vetId,
      appointmentId: data.appointmentId,
      petId: data.petId,
      visitDate: new Date(data.visitDate),
      weight: data.weight,
      temperature: data.temperature,
      heartRate: data.heartRate,
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      note: data.note,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    },
    include: {
      pet: { select: { id: true, name: true, species: true, code: true } },
      vet: { select: { id: true, fullName: true } },
    },
  });

  return record;
};

export const getById = async (id: number) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, code: true } },
      vet: { select: { id: true, fullName: true, role: true } },
      appointment: { select: { id: true, appointmentDate: true, type: true, status: true } },
      prescriptions: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });

  if (!record) {
    throw Object.assign(new Error('Medical record not found'), { statusCode: 404 });
  }

  return record;
};

export const update = async (id: number, data: any) => {
  const existing = await prisma.medicalRecord.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Medical record not found'), { statusCode: 404 });
  }

  const updateData: any = { ...data };
  if (data.visitDate) updateData.visitDate = new Date(data.visitDate);
  if (data.followUpDate) updateData.followUpDate = new Date(data.followUpDate);

  const record = await prisma.medicalRecord.update({
    where: { id },
    data: updateData,
    include: {
      pet: { select: { id: true, name: true, species: true, code: true } },
      vet: { select: { id: true, fullName: true } },
    },
  });

  return record;
};

export const addPrescriptions = async (medicalRecordId: number, items: any[]) => {
  const existing = await prisma.medicalRecord.findUnique({ where: { id: medicalRecordId } });
  if (!existing) {
    throw Object.assign(new Error('Medical record not found'), { statusCode: 404 });
  }

  const prescriptions = await prisma.prescription.createMany({
    data: items.map((item) => ({
      medicalRecordId,
      productId: item.productId,
      dosage: item.dosage,
      frequency: item.frequency,
      durationDays: item.durationDays,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      note: item.note,
    })),
  });

  // Return the full record with prescriptions
  const record = await prisma.medicalRecord.findUnique({
    where: { id: medicalRecordId },
    include: {
      prescriptions: {
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
        },
      },
    },
  });

  return record;
};
