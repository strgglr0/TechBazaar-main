import { type Product, type InsertProduct, type Order, type InsertOrder, type CartItem, type InsertCartItem, type ProductFilters } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getProducts(filters?: ProductFilters): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  // Cart
  getCartItems(sessionId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
  
  // Analytics
  getStats(): Promise<{
    totalProducts: number;
    ordersToday: number;
    revenue: number;
    lowStock: number;
  }>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private cartItems: Map<string, CartItem>;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.cartItems = new Map();
    
    // Initialize with sample products
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleProducts: Product[] = [
      {
        id: randomUUID(),
        name: "iPhone 15 Pro",
        description: "Latest iPhone with advanced camera system and A17 Pro chip",
        price: "999.00",
        category: "phones",
        brand: "Apple",
        sku: "IPH15P-128",
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        specifications: {
          storage: "128GB",
          display: "6.1-inch Super Retina XDR",
          processor: "A17 Pro chip",
          camera: "48MP Main camera"
        },
        stock: 25,
        rating: "4.5",
        reviewCount: 128,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "ASUS ROG Strix G15",
        description: "Gaming laptop with RTX 4070 and Ryzen 7 processor",
        price: "1299.00",
        category: "laptops",
        brand: "ASUS",
        sku: "ASU-ROG-G15",
        imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        specifications: {
          processor: "AMD Ryzen 7 7735HS",
          graphics: "NVIDIA RTX 4070",
          ram: "16GB DDR5",
          storage: "512GB SSD"
        },
        stock: 8,
        rating: "4.5",
        reviewCount: 64,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Dell XPS Desktop",
        description: "Powerful desktop for creative professionals and gaming",
        price: "1599.00",
        category: "desktops",
        brand: "Dell",
        sku: "DELL-XPS-DT",
        imageUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        specifications: {
          processor: "Intel Core i7-13700",
          graphics: "NVIDIA RTX 4060",
          ram: "32GB DDR5",
          storage: "1TB SSD"
        },
        stock: 12,
        rating: "4.7",
        reviewCount: 89,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Sony WH-1000XM5",
        description: "Industry-leading noise canceling headphones",
        price: "399.00",
        category: "accessories",
        brand: "Sony",
        sku: "SONY-WH1000XM5",
        imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        specifications: {
          type: "Over-ear wireless",
          battery: "30 hours",
          features: "Active noise canceling",
          connectivity: "Bluetooth 5.2"
        },
        stock: 45,
        rating: "4.9",
        reviewCount: 256,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Samsung Galaxy S24 Ultra",
        description: "Flagship Android phone with S Pen and advanced cameras",
        price: "1199.00",
        category: "phones",
        brand: "Samsung",
        sku: "SAM-S24U-256",
        imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        specifications: {
          storage: "256GB",
          display: "6.8-inch Dynamic AMOLED 2X",
          processor: "Snapdragon 8 Gen 3",
          camera: "200MP Main camera"
        },
        stock: 18,
        rating: "4.6",
        reviewCount: 142,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "MacBook Air M3",
        description: "Ultra-thin laptop with M3 chip and all-day battery",
        price: "1099.00",
        category: "laptops",
        brand: "Apple",
        sku: "MBA-M3-256",
        imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        specifications: {
          processor: "Apple M3 chip",
          ram: "8GB unified memory",
          storage: "256GB SSD",
          display: "13.6-inch Liquid Retina"
        },
        stock: 32,
        rating: "4.8",
        reviewCount: 201,
        isActive: true,
        createdAt: new Date(),
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    let products = Array.from(this.products.values()).filter(p => p.isActive);

    if (filters) {
      if (filters.category) {
        products = products.filter(p => p.category === filters.category);
      }
      if (filters.brand) {
        products = products.filter(p => p.brand === filters.brand);
      }
      if (filters.minPrice) {
        products = products.filter(p => parseFloat(p.price) >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        products = products.filter(p => parseFloat(p.price) <= filters.maxPrice!);
      }
      if (filters.rating) {
        products = products.filter(p => parseFloat(p.rating || '0') >= filters.rating!);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
        );
      }
    }

    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      imageUrl: insertProduct.imageUrl || null,
      specifications: insertProduct.specifications || {},
      stock: insertProduct.stock || 0,
      rating: insertProduct.rating || null,
      reviewCount: insertProduct.reviewCount || null,
      isActive: insertProduct.isActive ?? true,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...updateData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      customerPhone: insertOrder.customerPhone || null,
      status: insertOrder.status || 'pending',
      createdAt: new Date(),
      refundedAt: insertOrder.refundedAt ?? null,
      refundAmount: insertOrder.refundAmount ?? null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.sessionId === sessionId);
  }

  async addToCart(insertItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.sessionId === insertItem.sessionId && item.productId === insertItem.productId
    );

    if (existingItem) {
      // Update quantity
      const updatedItem = { ...existingItem, quantity: existingItem.quantity + (insertItem.quantity || 1) };
      this.cartItems.set(existingItem.id, updatedItem);
      return updatedItem;
    }

    const id = randomUUID();
    const cartItem: CartItem = {
      ...insertItem,
      id,
      quantity: insertItem.quantity || 1,
      createdAt: new Date(),
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;

    if (quantity <= 0) {
      this.cartItems.delete(id);
      return undefined;
    }

    const updatedItem = { ...item, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const items = Array.from(this.cartItems.entries());
    let cleared = false;
    
    items.forEach(([id, item]) => {
      if (item.sessionId === sessionId) {
        this.cartItems.delete(id);
        cleared = true;
      }
    });

    return cleared;
  }

  async getStats(): Promise<{
    totalProducts: number;
    ordersToday: number;
    revenue: number;
    lowStock: number;
  }> {
    const products = Array.from(this.products.values()).filter(p => p.isActive);
    const orders = Array.from(this.orders.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = orders.filter(o => {
      const orderDate = new Date(o.createdAt!);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const revenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const lowStock = products.filter(p => p.stock < 10).length;

    return {
      totalProducts: products.length,
      ordersToday: ordersToday.length,
      revenue: Math.round(revenue),
      lowStock,
    };
  }
}

export const storage = new MemStorage();
