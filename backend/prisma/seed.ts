import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: 'Food & Drinks', type: 'EXPENSE' as const, icon: 'utensils' },
  { name: 'Transport', type: 'EXPENSE' as const, icon: 'car' },
  { name: 'Shopping', type: 'EXPENSE' as const, icon: 'shopping-bag' },
  { name: 'Bills & Utilities', type: 'EXPENSE' as const, icon: 'zap' },
  { name: 'Entertainment', type: 'EXPENSE' as const, icon: 'film' },
  { name: 'Health', type: 'EXPENSE' as const, icon: 'heart' },
  { name: 'Education', type: 'EXPENSE' as const, icon: 'book' },
  { name: 'Groceries', type: 'EXPENSE' as const, icon: 'shopping-cart' },
  { name: 'Salary', type: 'INCOME' as const, icon: 'briefcase' },
  { name: 'Freelance', type: 'INCOME' as const, icon: 'laptop' },
  { name: 'Investment', type: 'INCOME' as const, icon: 'trending-up' },
  { name: 'Gift', type: 'INCOME' as const, icon: 'gift' },
  { name: 'Other Income', type: 'INCOME' as const, icon: 'plus-circle' },
  { name: 'Other Expense', type: 'EXPENSE' as const, icon: 'minus-circle' },
];

async function main(){
  console.log('Seeding default categories...');

  for(const cat of defaultCategories){
    await prisma.category.upsert({
      where: {
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        userId: null,
      },
    });
  }

  console.log(`Seeded ${defaultCategories.length} default categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async() => {
    await prisma.$disconnect();
  });
