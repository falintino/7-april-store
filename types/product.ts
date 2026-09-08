export interface Product {
  id: number;
  gameSlug: string;
  title: string;
  price: number;
  originalPrice?: number;
  badge?: string;
}