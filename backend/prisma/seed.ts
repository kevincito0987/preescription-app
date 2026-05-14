import 'dotenv/config';
import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('✨ Base de datos vacía. Iniciando seeding...');

  // --- 2. Crear Usuarios (Usa create en lugar de upsert ya que limpiamos antes) ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: adminPassword,
      fullName: 'System Admin',
      role: 'admin',
    },
  });

  const drPassword = await bcrypt.hash('dr1238', 10);
  const doctorUser = await prisma.user.create({
    data: {
      email: 'dr@test.com',
      password: drPassword,
      fullName: 'Dr. Gregory House',
      role: 'doctor',
      doctor: { create: { specialty: 'Diagnóstico Médico' } },
    },
    include: { doctor: true },
  });

  const patientPassword = await bcrypt.hash('patient123', 10);
  const patientUser = await prisma.user.create({
    data: {
      email: 'patient@test.com',
      password: patientPassword,
      fullName: 'John Doe',
      role: 'patient',
      patient: { create: { birthDate: new Date('1990-01-01') } },
    },
    include: { patient: true },
  });

  // --- 3. Generar Prescripciones ---
  const statusOptions = ['pending', 'consumed'] as const;
  for (let i = 1; i <= 8; i++) {
    await prisma.prescription.create({
      data: {
        medicalCode: `RX-${1000 + i}`,
        status: statusOptions[i % 2],
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

  console.log('🚀 Todo listo. Base de datos reseteada y poblada.');
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error en el seeding:', e);
  process.exit(1);
});
