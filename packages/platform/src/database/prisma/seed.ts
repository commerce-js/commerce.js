// ---------------------------------------------------------------------------
// Seed — populate the database with demo data (Prisma ORM — PostgreSQL)
// ---------------------------------------------------------------------------

import { getDb } from './client.js'

/**
 * Seed the database with demo products, categories, and store info via Prisma.
 * Accepts an optional Prisma client — if not provided, falls back to getDb().
 */
export async function seedPrisma(db?: any) {
  const prisma = db ?? getDb()

  // ---- Store ----
  await prisma.storeInfo.create({
    data: {
      id: 'default',
      name: 'CommerceJS Demo Store',
      nameAr: 'متجر كوميرس جي إس',
      description: 'A demo store powered by @commercejs/platform',
      descriptionAr: 'متجر تجريبي يعمل بواسطة كوميرس جي إس',
      currency: 'SAR',
      locale: 'en',
      timezone: 'Asia/Riyadh',
      supportedCurrencies: ['SAR', 'AED', 'USD'],
      supportedLocales: ['en', 'ar'],
    },
  })

  // ---- Categories ----
  const categories = [
    { id: 'cat-clothing', name: 'Clothing', nameAr: 'ملابس', slug: 'clothing', sortOrder: 1 },
    { id: 'cat-electronics', name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', sortOrder: 2 },
    { id: 'cat-accessories', name: 'Accessories', nameAr: 'إكسسوارات', slug: 'accessories', sortOrder: 3 },
  ]

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }

  // ---- Products ----
  const products = [
    {
      id: 'prod-1', name: 'Premium Cotton T-Shirt', nameAr: 'تي شيرت قطن فاخر',
      slug: 'premium-cotton-t-shirt',
      description: 'Ultra-soft 100% organic cotton t-shirt with a modern fit.',
      descriptionAr: 'تي شيرت من القطن العضوي بنسبة 100٪ بقصة عصرية',
      price: 89, compareAtPrice: 120, currency: 'SAR', status: 'active',
      productType: 'physical', inStock: true, inventoryQuantity: 150,
      requiresShipping: true, vatIncluded: true, vatRate: 15,
      categoryId: 'cat-clothing',
    },
    {
      id: 'prod-2', name: 'Wireless Bluetooth Earbuds', nameAr: 'سماعات بلوتوث لاسلكية',
      slug: 'wireless-bluetooth-earbuds',
      description: 'High-fidelity audio with active noise cancellation and 30h battery.',
      descriptionAr: 'صوت عالي الدقة مع إلغاء الضوضاء النشط وبطارية 30 ساعة',
      price: 249, currency: 'SAR', status: 'active',
      productType: 'physical', inStock: true, inventoryQuantity: 75,
      requiresShipping: true, vatIncluded: true, vatRate: 15,
      categoryId: 'cat-electronics',
    },
    {
      id: 'prod-3', name: 'Leather Crossbody Bag', nameAr: 'حقيبة جلدية كروس بودي',
      slug: 'leather-crossbody-bag',
      description: 'Handcrafted genuine leather bag with adjustable strap.',
      descriptionAr: 'حقيبة جلد طبيعي مصنوعة يدويًا مع حزام قابل للتعديل',
      price: 350, compareAtPrice: 450, currency: 'SAR', status: 'active',
      productType: 'physical', inStock: true, inventoryQuantity: 30,
      requiresShipping: true, vatIncluded: true, vatRate: 15,
      categoryId: 'cat-accessories',
    },
  ]

  for (const product of products) {
    const { categoryId, ...productData } = product
    await prisma.product.create({ data: productData })
    await prisma.productCategory.create({ data: { productId: product.id, categoryId } })
  }

  // ---- Product Images ----
  const images = [
    { productId: 'prod-1', url: 'https://placehold.co/600x600/f0f0f0/333?text=T-Shirt', altText: 'Cotton T-Shirt', isPrimary: true, sortOrder: 1 },
    { productId: 'prod-2', url: 'https://placehold.co/600x600/1a1a2e/e0e0e0?text=Earbuds', altText: 'Wireless Earbuds', isPrimary: true, sortOrder: 1 },
    { productId: 'prod-3', url: 'https://placehold.co/600x600/8b4513/fff?text=Bag', altText: 'Leather Bag', isPrimary: true, sortOrder: 1 },
  ]

  for (const image of images) {
    await prisma.productImage.create({ data: image })
  }

  // ---- Product Variants (for t-shirt) ----
  const variants = [
    { productId: 'prod-1', name: 'Small', sku: 'TSHIRT-S', price: 89, inStock: true, inventoryQuantity: 50, sortOrder: 1 },
    { productId: 'prod-1', name: 'Medium', sku: 'TSHIRT-M', price: 89, inStock: true, inventoryQuantity: 60, sortOrder: 2 },
    { productId: 'prod-1', name: 'Large', sku: 'TSHIRT-L', price: 99, inStock: true, inventoryQuantity: 40, sortOrder: 3 },
  ]

  for (const v of variants) {
    await prisma.productVariant.create({ data: v })
  }

  // ---- Brands ----
  const brands = [
    { id: 'brand-1', name: 'CommerceJS Essentials', nameAr: 'أساسيات كوميرس', slug: 'commercejs-essentials', isActive: true },
    { id: 'brand-2', name: 'TechWave', nameAr: 'تك ويف', slug: 'techwave', isActive: true },
    { id: 'brand-3', name: 'Artisan Leather', nameAr: 'الجلود الحرفية', slug: 'artisan-leather', isActive: true },
  ]

  for (const brand of brands) {
    await prisma.brand.create({ data: brand })
  }

  // ---- Countries ----
  const countries = [
    { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', callingCode: '+966', currency: 'SAR' },
    { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', callingCode: '+971', currency: 'AED' },
    { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', callingCode: '+965', currency: 'KWD' },
    { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', callingCode: '+973', currency: 'BHD' },
    { code: 'OM', name: 'Oman', nameAr: 'عمان', callingCode: '+968', currency: 'OMR' },
    { code: 'QA', name: 'Qatar', nameAr: 'قطر', callingCode: '+974', currency: 'QAR' },
  ]

  for (const country of countries) {
    await prisma.country.create({ data: country })
  }

  // ---- Reviews ----
  const reviews = [
    { productId: 'prod-1', authorName: 'Ahmed', rating: 5, title: 'Excellent quality', body: 'Best t-shirt I have ever bought. The cotton is incredibly soft.', verified: true, status: 'published' },
    { productId: 'prod-1', authorName: 'Sara', rating: 4, title: 'Good fit', body: 'Nice shirt, true to size. Would buy again.', verified: true, status: 'published' },
    { productId: 'prod-1', authorName: 'Omar', rating: 5, title: 'Love it', body: 'Perfect for everyday wear.', verified: false, status: 'published' },
    { productId: 'prod-2', authorName: 'Fatima', rating: 5, title: 'Amazing sound', body: 'Crystal clear audio and the noise cancellation is top-notch.', verified: true, status: 'published' },
    { productId: 'prod-2', authorName: 'Khalid', rating: 3, title: 'Decent', body: 'Good sound but battery life could be better.', verified: true, status: 'published' },
    { productId: 'prod-3', authorName: 'Noura', rating: 4, title: 'Beautiful bag', body: 'Gorgeous leather, arrived well-packaged.', verified: true, status: 'published' },
  ]

  for (const review of reviews) {
    await prisma.review.create({ data: review })
  }
}
