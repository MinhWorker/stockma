import { auth } from '../src/lib/auth';

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
}

main().catch(console.error);
