import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar data existente
  await prisma.notification.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios de prueba
  const password = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      nombre: 'José García',
      correo: 'jose@test.com',
      password,
      plan: 'free',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      nombre: 'María López',
      correo: 'maria@test.com',
      password,
      plan: 'premium',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
  });

  console.log('Users created');

  // Crear movimientos
  await prisma.movement.createMany({
    data: [
      {
        usuarioId: user1.id,
        tipo: 'ingreso',
        monto: 5000,
        categoria: 'salary',
        descripcion: 'Salario mensual',
        fecha: new Date('2026-04-01'),
      },
      {
        usuarioId: user1.id,
        tipo: 'egreso',
        monto: 150,
        categoria: 'groceries',
        descripcion: 'Supermercado',
        fecha: new Date('2026-04-15'),
      },
      {
        usuarioId: user1.id,
        tipo: 'egreso',
        monto: 50,
        categoria: 'transport',
        descripcion: 'Uber',
        fecha: new Date('2026-04-20'),
      },
      {
        usuarioId: user2.id,
        tipo: 'ingreso',
        monto: 8000,
        categoria: 'salary',
        fecha: new Date('2026-04-01'),
      },
    ],
  });

  console.log('Movements created');

  // Crear metas
  const goal1 = await prisma.goal.create({
    data: {
      usuarioId: user1.id,
      nombre: 'Vacaciones 2026',
      montoMeta: 10000,
      montoActual: 3500,
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2026-12-31'),
    },
  });

  await prisma.goal.create({
    data: {
      usuarioId: user1.id,
      nombre: 'Fondo de emergencia',
      montoMeta: 20000,
      montoActual: 5000,
      fechaInicio: new Date('2026-01-01'),
    },
  });

  await prisma.goal.create({
    data: {
      usuarioId: user2.id,
      nombre: 'Nuevo auto',
      montoMeta: 50000,
      montoActual: 12000,
      fechaInicio: new Date('2025-06-01'),
      fechaFin: new Date('2027-06-01'),
    },
  });

  console.log('Goals created');

  // Crear grupo
  const group = await prisma.group.create({
    data: {
      nombre: 'Viaje a Europa 2027',
      metaAhorro: 30000,
      inviteCode: 'EUROPA2027',
      liderId: user1.id,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      {
        usuarioId: user1.id,
        grupoId: group.id,
        contribucion: 8000,
        streakWeeks: 12,
      },
      {
        usuarioId: user2.id,
        grupoId: group.id,
        contribucion: 5500,
        streakWeeks: 8,
      },
    ],
  });

  console.log('Groups created');

  // Crear notificaciones
  await prisma.notification.createMany({
    data: [
      {
        usuarioId: user1.id,
        tipo: 'goal_progress',
        mensaje: '¡Estás a mitad de camino de tu meta "Vacaciones 2026"!',
        leida: false,
      },
      {
        usuarioId: user1.id,
        tipo: 'group_update',
        mensaje: 'María López contribuyó $500 al grupo "Viaje a Europa 2027"',
        leida: true,
      },
    ],
  });

  console.log('Notifications created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('  Email: jose@test.com');
  console.log('  Email: maria@test.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });