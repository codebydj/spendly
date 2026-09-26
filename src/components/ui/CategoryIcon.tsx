import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  Receipt,
  GraduationCap,
  Film,
  Heart,
  Plane,
  Fuel,
  Home,
  ShoppingCart,
  Briefcase,
  Laptop,
  ArrowLeftRight,
  Banknote,
  Tag,
  TrendingUp,
} from 'lucide-react';

interface CategoryIconProps {
  categoryName?: string;
  iconName?: string;
  size?: number;
  color?: string;
}

export const getCategoryIconComponent = (categoryName = '', iconName = ''): React.ReactElement => {
  const name = (categoryName || iconName).toLowerCase().trim();

  if (name.includes('food') || name.includes('restaurant') || name.includes('swiggy') || name.includes('zomato') || name.includes('cafe')) {
    return <Utensils />;
  }
  if (name.includes('grocery') || name.includes('groceries') || name.includes('supermarket') || name.includes('blinkit') || name.includes('zepto')) {
    return <ShoppingCart />;
  }
  if (name.includes('shop') || name.includes('amazon') || name.includes('myntra') || name.includes('flipkart') || name.includes('zara')) {
    return <ShoppingBag />;
  }
  if (name.includes('transport') || name.includes('uber') || name.includes('ola') || name.includes('bus') || name.includes('auto') || name.includes('taxi') || name.includes('namma')) {
    return <Car />;
  }
  if (name.includes('fuel') || name.includes('petrol') || name.includes('diesel') || name.includes('shell') || name.includes('hpcl')) {
    return <Fuel />;
  }
  if (name.includes('bill') || name.includes('utility') || name.includes('electricity') || name.includes('water') || name.includes('dth') || name.includes('recharge')) {
    return <Receipt />;
  }
  if (name.includes('rent') || name.includes('house') || name.includes('flat') || name.includes('home')) {
    return <Home />;
  }
  if (name.includes('education') || name.includes('tuition') || name.includes('school') || name.includes('college') || name.includes('course') || name.includes('book')) {
    return <GraduationCap />;
  }
  if (name.includes('entertainment') || name.includes('movie') || name.includes('netflix') || name.includes('spotify') || name.includes('pvr') || name.includes('hotstar')) {
    return <Film />;
  }
  if (name.includes('health') || name.includes('medical') || name.includes('doctor') || name.includes('pharmacy') || name.includes('hospital') || name.includes('gym')) {
    return <Heart />;
  }
  if (name.includes('travel') || name.includes('flight') || name.includes('hotel') || name.includes('vacation')) {
    return <Plane />;
  }
  if (name.includes('salary') || name.includes('paycheck') || name.includes('income')) {
    return <Briefcase />;
  }
  if (name.includes('freelance') || name.includes('project') || name.includes('client')) {
    return <Laptop />;
  }
  if (name.includes('transfer') || name.includes('self')) {
    return <ArrowLeftRight />;
  }
  if (name.includes('atm') || name.includes('cash withdrawal')) {
    return <Banknote />;
  }
  if (name.includes('invest') || name.includes('stocks') || name.includes('mutual')) {
    return <TrendingUp />;
  }

  return <Tag />;
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName,
  iconName,
  size = 20,
  color = 'currentColor',
}) => {
  const icon = getCategoryIconComponent(categoryName, iconName);
  return React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, { size, color });
};
