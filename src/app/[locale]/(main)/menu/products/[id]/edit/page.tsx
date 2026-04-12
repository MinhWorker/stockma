import { notFound } from 'next/navigation';
import { getAllProducts } from '@/services/product.service';
import { ProductFormPage } from '../../_components/product-form-page';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) notFound();

  const products = await getAllProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) notFound();

  return <ProductFormPage product={product} />;
}
