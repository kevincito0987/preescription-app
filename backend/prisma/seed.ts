import 'dotenv/config';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Iniciando seeding con Driver Adapter...');

  // 1. Crear Admin (según imagen image_83a6e7.png)
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: adminPassword,
      fullName: 'System Admin',
      role: 'admin',
    },
  });

  // 2. Crear Médico (según imagen image_83a6e7.png)
  const drPassword = await bcrypt.hash('dr123', 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'dr@test.com' },
    update: {},
    create: {
      email: 'dr@test.com',
      password: drPassword,
      fullName: 'Dr. Gregory House',
      role: 'doctor',
      doctor: {
        create: { specialty: 'Diagnóstico Médico' },
      },
    },
    include: { doctor: true },
  });

  // 3. Crear Paciente (según imagen image_83a6e7.png)
  const patientPassword = await bcrypt.hash('patient123', 10);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@test.com' },
    update: {},
    create: {
      email: 'patient@test.com',
      password: patientPassword,
      fullName: 'John Doe',
      role: 'patient',
      patient: {
        create: { birthDate: new Date('1990-01-01') },
      },
    },
    include: { patient: true },
  });

  console.log('✅ Usuarios base creados.');

  // 4. Crear 5-10 Prescripciones (según imagen image_83a39c.png)
  console.log('💊 Generando prescripciones de ejemplo...');

  const statusOptions: ('pending' | 'consumed')[] = ['pending', 'consumed'];

  for (let i = 1; i <= 8; i++) {
    await prisma.prescription.create({
      data: {
        medicalCode: `RX-${1000 + i}`,
        status: statusOptions[i % 2], // Alterna entre pending y consumed
        notes: `Prescripción de prueba número ${i}`,
        patientId: patientUser.patient!.id,
        authorId: doctorUser.doctor!.id,
        items: {
          create: [
            {
              name: i % 2 === 0 ? 'Paracetamol' : 'Ibuprofeno',
              dosage: '500mg',
              quantity: 10,
              instructions: 'Tomar cada 8 horas',
            },
          ],
        },
      },
    });
  }

  console.log('🚀 Seeding completado con éxito.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
