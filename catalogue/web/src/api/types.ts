export type Product = {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: { rate: number; count: number };
};

export type Category = { slug: string; name: string };
export type CategoryResponse = { category: Category; topRated: Product[]; more: Product[] };
export type EnquiryBody = {
  productId: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
};
