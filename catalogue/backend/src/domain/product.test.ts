import { describe, expect, it } from 'vitest';
import { slugify, topRated, type Product } from './product.js';

const product = (id: number, rate: number, count: number): Product => ({
  id,
  title: `Product ${id}`,
  price: 10,
  description: 'Description',
  category: 'electronics',
  image: '',
  rating: { rate, count }
});

describe('slugify', () => {
  it('normalizes apostrophes and whitespace', () => {
    expect(slugify("men's clothing")).toBe('mens-clothing');
  });
});

describe('topRated', () => {
  it('sorts by rating and breaks ties by rating count without mutating input', () => {
    const input = [product(1, 4.5, 10), product(2, 4.8, 5), product(3, 4.5, 30)];
    expect(topRated(input, 3).map((item) => item.id)).toEqual([2, 3, 1]);
    expect(input.map((item) => item.id)).toEqual([1, 2, 3]);
  });
});
