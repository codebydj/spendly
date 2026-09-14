import type { Category } from '../types/finance';

export const suggestCategoryForMerchant = (
  input: string,
  categories: Category[]
): Category | null => {
  if (!input.trim()) return null;
  const text = input.toLowerCase();

  let categoryName: string | null = null;

  if (text.includes('swiggy') || text.includes('zomato') || text.includes('lunch') || text.includes('dinner') || text.includes('cafe') || text.includes('restaurant') || text.includes('food')) {
    categoryName = 'Food';
  } else if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('clothes') || text.includes('shopping')) {
    categoryName = 'Shopping';
  } else if (text.includes('uber') || text.includes('rapido') || text.includes('ola') || text.includes('petrol') || text.includes('cab') || text.includes('auto')) {
    categoryName = 'Transport';
  } else if (text.includes('electricity') || text.includes('wifi') || text.includes('recharge') || text.includes('water') || text.includes('bill')) {
    categoryName = 'Bills';
  } else if (text.includes('salary') || text.includes('stipend')) {
    categoryName = 'Salary';
  }

  if (!categoryName) return null;
  return categories.find((c) => c.name.toLowerCase() === categoryName!.toLowerCase()) || null;
};
