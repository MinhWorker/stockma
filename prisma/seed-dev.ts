/**
 * Dev seed — xóa trắng DB (trừ dữ liệu người dùng) rồi tạo dữ liệu mẫu.
 * Chạy: npx tsx prisma/seed-dev.ts
 */

import { prisma } from '../src/lib/db';

async function main() {
  console.log('🧹 Clearing non-user data...');

  // Delete in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.debtPayment.deleteMany();
  await prisma.debtGroup.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.returnTransaction.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.inventory.deleteMany();

  console.log('✓ Cleared\n');

  // ── Lấy user đầu tiên để gán giao dịch ──────────────────────────────────
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) throw new Error('No user found. Run prisma/seed.ts first.');
  const uid = user.id;

  // ── Categories ───────────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const [catDrink, catFood, catElec, catCosm] = await Promise.all([
    prisma.productCategory.create({ data: { name: 'Đồ uống', state: 'active' } }),
    prisma.productCategory.create({ data: { name: 'Thực phẩm', state: 'active' } }),
    prisma.productCategory.create({ data: { name: 'Điện tử', state: 'active' } }),
    prisma.productCategory.create({ data: { name: 'Mỹ phẩm', state: 'active' } }),
  ]);

  // ── Providers ────────────────────────────────────────────────────────────
  console.log('🏭 Seeding providers...');
  const [pvA, pvB, pvC] = await Promise.all([
    prisma.provider.create({ data: { name: 'Công ty TNHH Thực Phẩm Xanh' } }),
    prisma.provider.create({ data: { name: 'Nhà phân phối Điện Tử Việt' } }),
    prisma.provider.create({ data: { name: 'Công ty Mỹ Phẩm Sài Gòn' } }),
  ]);

  // ── Inventories ──────────────────────────────────────────────────────────
  console.log('🏪 Seeding inventories...');
  const [inv1, inv2, inv3] = await Promise.all([
    prisma.inventory.create({ data: { name: 'Kho Hà Nội', description: 'Kho chính miền Bắc' } }),
    prisma.inventory.create({ data: { name: 'Kho TP.HCM', description: 'Kho chính miền Nam' } }),
    prisma.inventory.create({ data: { name: 'Kho Đà Nẵng', description: 'Kho miền Trung' } }),
  ]);

  // ── Products ─────────────────────────────────────────────────────────────
  console.log('📦 Seeding products...');

  // Kho Hà Nội — đồ uống + thực phẩm
  const [nuocSuoi, traSua, banh, sua] = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Nước suối Aqua 500ml',
        costPrice: 3500, price: 6000, unit: 'chai',
        categoryId: catDrink.id, providerId: pvA.id, inventoryId: inv1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Trà sữa Phúc Long',
        costPrice: 25000, price: 45000, unit: 'ly',
        categoryId: catDrink.id, providerId: pvA.id, inventoryId: inv1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bánh mì sandwich',
        costPrice: 8000, price: 15000, unit: 'ổ',
        categoryId: catFood.id, providerId: pvA.id, inventoryId: inv1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sữa tươi Vinamilk 1L',
        costPrice: 28000, price: 38000, unit: 'hộp',
        categoryId: catFood.id, providerId: pvA.id, inventoryId: inv1.id,
      },
    }),
  ]);

  // Kho TP.HCM — điện tử + mỹ phẩm
  const [tai_nghe, sac_du_phong, kem_duong, son_moi] = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Tai nghe Bluetooth JBL',
        costPrice: 450000, price: 750000, unit: 'cái',
        categoryId: catElec.id, providerId: pvB.id, inventoryId: inv2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sạc dự phòng Anker 10000mAh',
        costPrice: 280000, price: 450000, unit: 'cái',
        categoryId: catElec.id, providerId: pvB.id, inventoryId: inv2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Kem dưỡng da Pond\'s',
        costPrice: 55000, price: 95000, unit: 'hộp',
        categoryId: catCosm.id, providerId: pvC.id, inventoryId: inv2.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Son môi MAC',
        costPrice: 180000, price: 320000, unit: 'cây',
        categoryId: catCosm.id, providerId: pvC.id, inventoryId: inv2.id,
      },
    }),
  ]);

  // Kho Đà Nẵng — mix, có variant
  const [capSac, nuocHoa] = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Cáp sạc USB-C',
        costPrice: 35000, price: 65000, unit: 'cái',
        categoryId: catElec.id, providerId: pvB.id, inventoryId: inv3.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Nước hoa Chanel No.5',
        costPrice: 1200000, price: 2200000, unit: 'chai',
        categoryId: catCosm.id, providerId: pvC.id, inventoryId: inv3.id,
      },
    }),
  ]);

  // ── Variants (cho Nước hoa và Tai nghe) ──────────────────────────────────
  console.log('🎨 Seeding variants...');

  const [v_nuochoa_50, v_nuochoa_100] = await Promise.all([
    prisma.productVariant.create({
      data: { productId: nuocHoa.id, name: '50ml', costPrice: 900000, price: 1600000 },
    }),
    prisma.productVariant.create({
      data: { productId: nuocHoa.id, name: '100ml', costPrice: 1200000, price: 2200000 },
    }),
  ]);

  const [v_tainghe_den, v_tainghe_trang] = await Promise.all([
    prisma.productVariant.create({
      data: { productId: tai_nghe.id, name: 'Màu đen' },
    }),
    prisma.productVariant.create({
      data: { productId: tai_nghe.id, name: 'Màu trắng', costPrice: 460000, price: 780000 },
    }),
  ]);

  // ── Stock transactions ────────────────────────────────────────────────────
  console.log('📊 Seeding transactions...');

  // Helper: tạo stock_in
  async function stockIn(productId: number, qty: number, purchasePrice: number, variantId?: number) {
    const where = variantId ? { variantId } : { productId, variantId: null };
    const last = await prisma.stockTransaction.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { stockAfter: true } });
    const before = last?.stockAfter ?? 0;
    return prisma.stockTransaction.create({
      data: {
        type: 'stock_in', quantity: qty, stockBefore: before, stockAfter: before + qty,
        productId, userId: uid, purchasePrice,
        ...(variantId ? { variantId } : {}),
      },
    });
  }

  // Helper: tạo stock_out retail
  async function stockOut(productId: number, qty: number, salePrice: number, variantId?: number, note?: string) {
    const where = variantId ? { variantId } : { productId, variantId: null };
    const last = await prisma.stockTransaction.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { stockAfter: true } });
    const before = last?.stockAfter ?? 0;
    return prisma.stockTransaction.create({
      data: {
        type: 'stock_out', quantity: -qty, stockBefore: before, stockAfter: before - qty,
        productId, userId: uid, stockOutType: 'retail', salePrice, note: note ?? null,
        ...(variantId ? { variantId } : {}),
      },
    });
  }

  // Kho Hà Nội
  await stockIn(nuocSuoi.id, 200, 3500);
  await stockIn(traSua.id, 50, 25000);
  await stockIn(banh.id, 80, 8000);
  await stockIn(sua.id, 60, 28000);

  await stockOut(nuocSuoi.id, 45, 6000);
  await stockOut(traSua.id, 12, 45000);
  await stockOut(banh.id, 30, 15000);
  await stockOut(sua.id, 10, 38000);

  // Kho TP.HCM — tai nghe có variant
  await stockIn(tai_nghe.id, 20, 450000, v_tainghe_den.id);
  await stockIn(tai_nghe.id, 15, 460000, v_tainghe_trang.id);
  await stockIn(sac_du_phong.id, 30, 280000);
  await stockIn(kem_duong.id, 100, 55000);
  await stockIn(son_moi.id, 40, 180000);

  await stockOut(tai_nghe.id, 5, 750000, v_tainghe_den.id);
  await stockOut(tai_nghe.id, 3, 780000, v_tainghe_trang.id);
  await stockOut(sac_du_phong.id, 8, 450000);
  await stockOut(kem_duong.id, 25, 95000);
  await stockOut(son_moi.id, 10, 320000);

  // Kho Đà Nẵng — nước hoa có variant
  await stockIn(capSac.id, 50, 35000);
  await stockIn(nuocHoa.id, 10, 900000, v_nuochoa_50.id);
  await stockIn(nuocHoa.id, 8, 1200000, v_nuochoa_100.id);

  await stockOut(capSac.id, 15, 65000);
  await stockOut(nuocHoa.id, 3, 1600000, v_nuochoa_50.id);
  await stockOut(nuocHoa.id, 2, 2200000, v_nuochoa_100.id);

  // ── Giao dịch ghi nợ ─────────────────────────────────────────────────────
  console.log('💳 Seeding debt transactions...');

  // Bán sỉ trà sữa, ghi nợ
  const lastTraSua = await prisma.stockTransaction.findFirst({
    where: { productId: traSua.id, variantId: null }, orderBy: { createdAt: 'desc' }, select: { stockAfter: true },
  });
  const traSuaBefore = lastTraSua?.stockAfter ?? 0;
  const debtTx = await prisma.stockTransaction.create({
    data: {
      type: 'stock_out', quantity: -10, stockBefore: traSuaBefore, stockAfter: traSuaBefore - 10,
      productId: traSua.id, userId: uid, stockOutType: 'wholesale', salePrice: 40000,
    },
  });
  await prisma.debtGroup.create({
    data: {
      transactionId: debtTx.id, debtorName: 'Quán Cà Phê Bình Minh',
      totalAmount: 400000, paidAmount: 100000, status: 'open',
    },
  });

  // Bán lẻ son môi, ghi nợ đã đóng
  const lastSon = await prisma.stockTransaction.findFirst({
    where: { productId: son_moi.id, variantId: null }, orderBy: { createdAt: 'desc' }, select: { stockAfter: true },
  });
  const sonBefore = lastSon?.stockAfter ?? 0;
  const debtTx2 = await prisma.stockTransaction.create({
    data: {
      type: 'stock_out', quantity: -5, stockBefore: sonBefore, stockAfter: sonBefore - 5,
      productId: son_moi.id, userId: uid, stockOutType: 'retail', salePrice: 320000,
    },
  });
  await prisma.debtGroup.create({
    data: {
      transactionId: debtTx2.id, debtorName: 'Chị Lan',
      totalAmount: 1600000, paidAmount: 1600000, status: 'closed',
    },
  });

  // ── Return transaction ────────────────────────────────────────────────────
  console.log('🔄 Seeding return transactions...');

  const lastBanh = await prisma.stockTransaction.findFirst({
    where: { productId: banh.id, variantId: null }, orderBy: { createdAt: 'desc' }, select: { stockAfter: true },
  });
  const banhBefore = lastBanh?.stockAfter ?? 0;

  const returnTx = await prisma.returnTransaction.create({
    data: {
      productId: banh.id, returnQty: 5, replacementQty: 5,
      purchasePrice: 8000, note: 'Bánh hết hạn, đổi lô mới', userId: uid,
    },
  });
  // stock_out for returned items
  await prisma.stockTransaction.create({
    data: {
      type: 'stock_out', quantity: -5, stockBefore: banhBefore, stockAfter: banhBefore - 5,
      productId: banh.id, userId: uid, returnTransactionId: returnTx.id,
    },
  });
  // stock_in for replacements
  await prisma.stockTransaction.create({
    data: {
      type: 'stock_in', quantity: 5, stockBefore: banhBefore - 5, stockAfter: banhBefore,
      productId: banh.id, userId: uid, purchasePrice: 8000, returnTransactionId: returnTx.id,
    },
  });

  // ── Activity logs ─────────────────────────────────────────────────────────
  console.log('📋 Seeding activity logs...');

  const activityEntries = [
    { action: 'create' as const, entityType: 'Inventory', entityId: inv1.id, entityName: inv1.name, description: `Tạo kho "${inv1.name}"`, inventoryId: inv1.id },
    { action: 'create' as const, entityType: 'Inventory', entityId: inv2.id, entityName: inv2.name, description: `Tạo kho "${inv2.name}"`, inventoryId: inv2.id },
    { action: 'create' as const, entityType: 'Inventory', entityId: inv3.id, entityName: inv3.name, description: `Tạo kho "${inv3.name}"`, inventoryId: inv3.id },
    { action: 'create' as const, entityType: 'Product', entityId: nuocSuoi.id, entityName: nuocSuoi.name, description: `Tạo sản phẩm "${nuocSuoi.name}"`, inventoryId: inv1.id },
    { action: 'create' as const, entityType: 'Product', entityId: traSua.id, entityName: traSua.name, description: `Tạo sản phẩm "${traSua.name}"`, inventoryId: inv1.id },
    { action: 'create' as const, entityType: 'Product', entityId: tai_nghe.id, entityName: tai_nghe.name, description: `Tạo sản phẩm "${tai_nghe.name}"`, inventoryId: inv2.id },
    { action: 'create' as const, entityType: 'ProductVariant', entityId: v_nuochoa_50.id, entityName: '50ml', description: `Tạo phân loại "50ml" cho ${nuocHoa.name}`, inventoryId: inv3.id },
    { action: 'create' as const, entityType: 'ProductVariant', entityId: v_nuochoa_100.id, entityName: '100ml', description: `Tạo phân loại "100ml" cho ${nuocHoa.name}`, inventoryId: inv3.id },
    { action: 'update' as const, entityType: 'Product', entityId: kem_duong.id, entityName: kem_duong.name, description: `Cập nhật giá sản phẩm "${kem_duong.name}"`, inventoryId: inv2.id },
    { action: 'create' as const, entityType: 'Provider', entityId: pvA.id, entityName: pvA.name, description: `Tạo nhà cung cấp "${pvA.name}"`, inventoryId: null },
  ];

  for (const entry of activityEntries) {
    await prisma.activityLog.create({ data: { ...entry, userId: uid } });
  }

  console.log('\n✅ Dev seed complete!');
  console.log(`   3 inventories, ${4 + 4 + 2} products, 4 variants`);
  console.log(`   Transactions, 2 debt groups, 1 return, ${activityEntries.length} activity logs`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
