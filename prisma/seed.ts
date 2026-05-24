import { auth } from '../src/lib/auth';
import { prisma } from '../src/lib/db';

async function main() {
  const users = [
    { email: 'phamdungcm1981@gmail.com', name: 'Pham Dung' },
    { email: 'minhnk.work@gmail.com', name: 'Minh NK' },
  ];

  for (const user of users) {
    await auth.api.signUpEmail({
      body: { email: user.email, name: user.name, password: 'prim@stkm01' },
    });
    console.log(`✓ Created ${user.email}`);
  }

  const firstUser = await prisma.user.findFirst({ select: { id: true } });
  const openPeriod = await prisma.accountingPeriod.findFirst({ where: { status: 'open' } });
  if (firstUser && !openPeriod) {
    await prisma.accountingPeriod.create({
      data: {
        name: 'Kỳ kế toán đầu tiên',
        startAt: new Date(),
        status: 'open',
        createdById: firstUser.id,
      },
    });
    console.log('✓ Created initial accounting period');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
