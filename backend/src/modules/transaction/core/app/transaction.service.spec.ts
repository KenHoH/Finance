import { TransactionService } from './transaction.service.js';

describe('TransactionService update', () => {
  const existingTransaction = {
    id: 'transaction-1',
    userId: 'user-1',
    amount: 100,
    type: 'EXPENSE',
    description: 'Lunch',
    reviewed: true,
    date: new Date('2024-05-01T08:30:00.000Z'),
    categoryId: 'category-1',
  };

  const prisma = {
    transaction: {
      findFirst: jest.fn(async () => existingTransaction),
      update: jest.fn(async () => existingTransaction),
    },
    category: {
      findFirst: jest.fn(async () => null),
    },
  };
  const activityLogService = {
    logActivity: jest.fn(async () => undefined),
  };

  const service = new TransactionService(
    prisma as never,
    {} as never,
    {} as never,
    activityLogService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves reviewed when the field is omitted', async () => {
    await service.update('user-1', 'transaction-1', { amount: 250 });

    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewed: undefined }),
      }),
    );
  });

  it('accepts false review values and nullable categories', async () => {
    await service.update('user-1', 'transaction-1', {
      review: false,
      categoryId: null,
    });

    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reviewed: false,
          categoryId: null,
        }),
        include: { category: true },
      }),
    );
  });

  it('rejects categories unavailable to the user or transaction type', async () => {
    await expect(
      service.update('user-1', 'transaction-1', {
        categoryId: 'category-2',
      }),
    ).rejects.toThrow('Category is not available for this transaction');

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'category-2',
        type: 'EXPENSE',
        OR: [{ userId: 'user-1' }, { userId: null }],
      },
    });
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });
});
