export interface Category {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}
