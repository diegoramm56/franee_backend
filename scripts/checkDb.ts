import { branchesRepository } from '../src/repositories/branches.repository.js';
import { brandsRepository } from '../src/repositories/brands.repository.js';
import { categoriesRepository } from '../src/repositories/categories.repository.js';
import { measuresRepository } from '../src/repositories/measures.repository.js';
import { productsRepository } from '../src/repositories/products.repository.js';
import { providersRepository } from '../src/repositories/providers.repository.js';
import { usersRepository } from '../src/repositories/users.repository.js';

async function main() {
  console.log('🔍 Verificando conexión a la base de datos...');

  const branches = await branchesRepository.findAll();
  console.log(`✅ Sucursales encontradas: ${branches.length}`);

  const categories = await categoriesRepository.findAll();
  if (categories.length === 0) {
    throw new Error('La base de datos no tiene categorías configuradas.');
  }
  console.log(`📦 Categorías disponibles: ${categories.length}`);

  const users = await usersRepository.findAll();
  const usersPreview = users.slice(0, 3).map((user) => ({
    userId: user.userId,
    username: user.username,
    name: user.name,
    rolId: user.rolId,
    state: user.state
  }));
  console.log('👥 Usuarios detectados:', usersPreview);

  console.log('🧪 Probando operaciones de escritura en Brands...');
  const tempBrandName = `Check-${Date.now()}`;
  const createdBrand = await brandsRepository.create({ name: tempBrandName, state: true });
  console.log('➕ Marca creada:', createdBrand);

  console.log('🧪 Probando operaciones de escritura en Measures...');
  const tempMeasure = await measuresRepository.create({
    name: `TMP-${Date.now()}`,
    abbreviation: 'TMP',
    state: true
  });
  console.log('➕ Medida creada:', tempMeasure);

  console.log('🧪 Probando operaciones de escritura en Providers...');
  const tempProvider = await providersRepository.create({
    name: `Proveedor ${Date.now()}`,
    nit: `TMP-${Date.now()}`,
    contact: 'QA Bot',
    phone: '5555-0000',
    email: 'qa@example.com',
    address: 'Temporal '
  });
  console.log('➕ Proveedor creado:', tempProvider);

  console.log('🧪 Probando operaciones de escritura en Products...');
  const product = await productsRepository.create({
    codeBar: `TMP-${Date.now()}`,
    name: 'Producto temporal QA',
    description: 'Creado por checkDb.ts',
    categoryId: Number(categories[0].categoryId),
    brandId: Number(createdBrand.brandId),
    measureId: Number(tempMeasure.measureId),
    providerId: Number(tempProvider.providerId),
    state: true
  });
  console.log('➕ Producto creado:', product);

  await productsRepository.delete(Number(product.productId));
  console.log('➖ Producto temporal eliminado con éxito');

  await providersRepository.delete(Number(tempProvider.providerId));
  console.log('➖ Proveedor temporal eliminado con éxito');

  await measuresRepository.delete(Number(tempMeasure.measureId));
  console.log('➖ Medida temporal eliminada con éxito');

  await brandsRepository.delete(Number(createdBrand.brandId));
  console.log('➖ Marca temporal eliminada con éxito');

  console.log('✅ Todas las operaciones se ejecutaron correctamente.');
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error durante la prueba de base de datos:', error);
  process.exit(1);
});
