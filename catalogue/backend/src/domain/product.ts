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

export function slugify(name: string): string {
  return name
    .toLocaleLowerCase('en-US')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function topRated(products: Product[], count: number): Product[] {
  return [...products]
    .sort((left, right) => {
      const ratingDifference = right.rating.rate - left.rating.rate;
      return ratingDifference !== 0
        ? ratingDifference
        : right.rating.count - left.rating.count;
    })
    .slice(0, Math.max(0, count));
}
