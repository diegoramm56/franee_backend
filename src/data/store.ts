import { randomUUID } from 'node:crypto';

export type StateValue = 'Activo' | 'Inactivo' | boolean;

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  phone: string;
  state: boolean;
}

export interface Rol {
  rolId: string;
  name: string;
  description: string;
  state: boolean;
  modules: string[];
}

export interface User {
  userId: string;
  username: string;
  name: string;
  password: string;
  rolId: string;
  branchId?: string;
  email?: string;
  branchAccess?: string[];
}

export interface Brand {
  brandId: string;
  name: string;
  state: boolean;
}

export interface Category {
  categoryId: string;
  name: string;
  state: boolean;
}

export interface Measure {
  measureId: string;
  name: string;
  state: boolean;
}

export interface Client {
  clientId: string;
  name: string;
  direction: string;
  phone: string;
  mail: string;
  state: boolean;
}

export interface Provider {
  providerId: string;
  name: string;
  direction: string;
  phone: string;
  mail: string;
  state: boolean;
}

export interface Product {
  productId: string;
  codeBar: string;
  name: string;
  purchasePrice: number;
  gainPercentage: number;
  unitPrice: number;
  description: string;
  state: boolean;
  brandId?: string;
  categoryId?: string;
  measureId?: string;
}

export interface ProductBranchAvailability {
  productId: string;
  branchId: string;
  enable: boolean;
  stock: number;
}

export interface CartItem {
  cartId: string;
  userId: string;
  branchId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  salePrice: number;
}

export interface SaleDetail {
  saleDetailId: string;
  saleId: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  unitPrice: number;
  discount: number;
  salePrice: number;
  subtotal: number;
}

export interface Sale {
  saleId: string;
  date: string;
  total: number;
  state: boolean;
  clientId: string;
  branchId: string;
  userId: string;
}

export interface Store {
  branches: Branch[];
  roles: Rol[];
  users: User[];
  brands: Brand[];
  categories: Category[];
  measures: Measure[];
  clients: Client[];
  providers: Provider[];
  products: Product[];
  productBranches: ProductBranchAvailability[];
  carts: CartItem[];
  sales: Sale[];
  saleDetails: SaleDetail[];
}

const generateId = () => randomUUID();
export const createId = () => generateId();

export const store: Store = {
  branches: [
    {
      branchId: generateId(),
      name: 'Sucursal Principal',
      address: 'Zona 1, Ciudad',
      phone: '1234-5678',
      state: true
    }
  ],
  roles: [
    {
      rolId: 'admin',
      name: 'Administrador',
      description: 'Control total del sistema',
      state: true,
      modules: ['Users', 'Roles', 'Branches', 'Clients', 'Cart', 'Products', 'Providers', 'Brands', 'Categories', 'Measures']
    },
    {
      rolId: 'ventas',
      name: 'Ventas',
      description: 'Gestión de ventas y clientes',
      state: true,
      modules: ['Clients', 'Cart', 'Products']
    }
  ],
  users: [
    {
      userId: 'u-admin',
      username: 'admin',
      name: 'Administrador',
      password: 'admin123',
      rolId: 'admin',
      branchId: '',
      email: 'admin@mi-almacencito.com',
      branchAccess: []
    }
  ],
  brands: [
    {
      brandId: createId(),
      name: 'Genérico',
      state: true
    }
  ],
  categories: [
    {
      categoryId: createId(),
      name: 'General',
      state: true
    }
  ],
  measures: [
    {
      measureId: createId(),
      name: 'Unidad',
      state: true
    }
  ],
  clients: [
    {
      clientId: generateId(),
      name: 'Consumidor Final',
      direction: 'No especificado',
      phone: '0000-0000',
      mail: 'consumidor@mi-almacencito.com',
      state: true
    }
  ],
  providers: [],
  products: [],
  productBranches: [],
  carts: [],
  sales: [],
  saleDetails: []
};
