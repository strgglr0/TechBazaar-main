export type {
  Product,
  InsertProduct,
  Order,
  InsertOrder,
  CartItem,
  InsertCartItem,
  CartItemWithProduct,
  ProductFilters,
} from "@shared/schema";

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface AdminStats {
  totalProducts: number;
  ordersToday: number;
  revenue: number;
  lowStock: number;
}
