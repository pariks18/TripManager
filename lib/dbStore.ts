import { prisma } from './prisma';
import { hashPassword, comparePassword } from './auth';
import { generateTripCode, generateObjectId } from './utils';
import { calculateMemberBalances, computeSettlements } from './settlement';
import { CategoryType, ExpenseDetail, TripSummary, UserSummary, ActivityDetail, SettlementRecordDetail, MemberBalance, MemberAnalytics, DocumentType, UserDocumentDetail, ItineraryItemDetail, StayDetail, PollDetail, PollOptionDetail, PollVoteDetail, MemberLocationDetail, UserWalletDetail, WalletAdvanceDetail, WalletTransactionDetail } from '@/types';

const SEED_USERS = [
  {
    id: '65f1a2b3c4d5e6f7a8b9c001',
    name: 'Parikshit Gole',
    email: 'parikshit@tripsplit.app',
    password: '$2a$10$e8w.xM09L0n98QvY.wGZReHl50FwP/WjQ/119aE1k.w4lE6HjC5x.',
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c002',
    name: 'Rahul Sharma',
    email: 'rahul@tripsplit.app',
    password: '$2a$10$e8w.xM09L0n98QvY.wGZReHl50FwP/WjQ/119aE1k.w4lE6HjC5x.',
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c003',
    name: 'Akash Verma',
    email: 'akash@tripsplit.app',
    password: '$2a$10$e8w.xM09L0n98QvY.wGZReHl50FwP/WjQ/119aE1k.w4lE6HjC5x.',
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c004',
    name: 'Sneha Patel',
    email: 'sneha@tripsplit.app',
    password: '$2a$10$e8w.xM09L0n98QvY.wGZReHl50FwP/WjQ/119aE1k.w4lE6HjC5x.',
  },
];

const userSelect = { select: { id: true, name: true, email: true } };

const SEED_TRIPS = [
  {
    id: '65f1a2b3c4d5e6f7a8b9t001',
    name: 'Goa Trip 2026',
    description: 'Beach getaway, shacks, and watersports with friends',
    code: 'GOA2026',
    currency: '₹',
    startDate: new Date('2026-08-10T00:00:00.000Z'),
    endDate: new Date('2026-08-15T00:00:00.000Z'),
    createdById: '65f1a2b3c4d5e6f7a8b9c001',
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9t002',
    name: 'Manali Snow Trek',
    description: 'Mountain hiking, bonfire and hot springs',
    code: 'SNOW26',
    currency: '₹',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-06T00:00:00.000Z'),
    createdById: '65f1a2b3c4d5e6f7a8b9c002',
  },
];

const SEED_MEMBERS = [
  { id: '65f1a2b3c4d5e6f7a8b9m001', tripId: '65f1a2b3c4d5e6f7a8b9t001', userId: '65f1a2b3c4d5e6f7a8b9c001', role: 'ADMIN' },
  { id: '65f1a2b3c4d5e6f7a8b9m002', tripId: '65f1a2b3c4d5e6f7a8b9t001', userId: '65f1a2b3c4d5e6f7a8b9c002', role: 'MEMBER' },
  { id: '65f1a2b3c4d5e6f7a8b9m003', tripId: '65f1a2b3c4d5e6f7a8b9t001', userId: '65f1a2b3c4d5e6f7a8b9c003', role: 'MEMBER' },
  { id: '65f1a2b3c4d5e6f7a8b9m004', tripId: '65f1a2b3c4d5e6f7a8b9t002', userId: '65f1a2b3c4d5e6f7a8b9c002', role: 'ADMIN' },
  { id: '65f1a2b3c4d5e6f7a8b9m005', tripId: '65f1a2b3c4d5e6f7a8b9t002', userId: '65f1a2b3c4d5e6f7a8b9c001', role: 'MEMBER' },
  { id: '65f1a2b3c4d5e6f7a8b9m006', tripId: '65f1a2b3c4d5e6f7a8b9t002', userId: '65f1a2b3c4d5e6f7a8b9c004', role: 'MEMBER' },
];

const SEED_EXPENSES = [
  {
    id: '65f1a2b3c4d5e6f7a8b9e001',
    tripId: '65f1a2b3c4d5e6f7a8b9t001',
    title: 'Beach Resort Booking',
    amount: 3600,
    category: 'Stay',
    paidById: '65f1a2b3c4d5e6f7a8b9c001',
    createdById: '65f1a2b3c4d5e6f7a8b9c001',
    date: new Date(Date.now() - 86400000 * 2),
    participantUserIds: ['65f1a2b3c4d5e6f7a8b9c001', '65f1a2b3c4d5e6f7a8b9c002', '65f1a2b3c4d5e6f7a8b9c003'],
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9e002',
    tripId: '65f1a2b3c4d5e6f7a8b9t001',
    title: 'Seafood Shack Dinner',
    amount: 1800,
    category: 'Food',
    paidById: '65f1a2b3c4d5e6f7a8b9c002',
    createdById: '65f1a2b3c4d5e6f7a8b9c002',
    date: new Date(Date.now() - 86400000 * 1),
    participantUserIds: ['65f1a2b3c4d5e6f7a8b9c001', '65f1a2b3c4d5e6f7a8b9c002', '65f1a2b3c4d5e6f7a8b9c003'],
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9e003',
    tripId: '65f1a2b3c4d5e6f7a8b9t001',
    title: 'Scooter Rental & Fuel',
    amount: 1200,
    category: 'Fuel',
    paidById: '65f1a2b3c4d5e6f7a8b9c003',
    createdById: '65f1a2b3c4d5e6f7a8b9c003',
    date: new Date(),
    participantUserIds: ['65f1a2b3c4d5e6f7a8b9c001', '65f1a2b3c4d5e6f7a8b9c002', '65f1a2b3c4d5e6f7a8b9c003'],
  },
];

let isSeedingCompleted = false;

async function ensureDatabaseSeeded() {
  if (isSeedingCompleted) return;

  const totalStart = performance.now();

  try {
    const countStart = performance.now();

    const userCount = await prisma.user.count();

    console.log(
      `[PERF] seed user.count: ${(performance.now() - countStart).toFixed(2)}ms`
    );

    if (userCount === 0) {

      const usersStart = performance.now();

      for (const u of SEED_USERS) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {},
          create: u,
        });
      }

      console.log(
        `[PERF] seed users: ${(performance.now() - usersStart).toFixed(2)}ms`
      );


      const tripsStart = performance.now();

      for (const t of SEED_TRIPS) {
        await prisma.trip.create({ data: t });
      }

      console.log(
        `[PERF] seed trips: ${(performance.now() - tripsStart).toFixed(2)}ms`
      );


      const membersStart = performance.now();

      for (const m of SEED_MEMBERS) {
        await prisma.tripMember.create({ data: m });
      }

      console.log(
        `[PERF] seed members: ${(performance.now() - membersStart).toFixed(2)}ms`
      );


      const expensesStart = performance.now();

      for (const e of SEED_EXPENSES) {
        const shareAmount =
          e.amount / e.participantUserIds.length;

        await prisma.expense.create({
          data: {
            id: e.id,
            tripId: e.tripId,
            title: e.title,
            amount: e.amount,
            category: e.category,
            paidById: e.paidById,
            createdById: e.createdById,
            date: e.date,
            participants: {
              create: e.participantUserIds.map((uid) => ({
                id: generateObjectId(),
                userId: uid,
                shareAmount,
              })),
            },
          },
        });
      }

      console.log(
        `[PERF] seed expenses: ${(performance.now() - expensesStart).toFixed(2)}ms`
      );


      const activityStart = performance.now();

      await prisma.activity.create({
        data: {
          id: generateObjectId(),
          tripId: SEED_TRIPS[0].id,
          userId: SEED_USERS[0].id,
          actionType: 'TRIP_CREATED',
          details: 'Parikshit created Goa Trip 2026',
        },
      });

      console.log(
        `[PERF] seed activity: ${(performance.now() - activityStart).toFixed(2)}ms`
      );
    }

    isSeedingCompleted = true;

    console.log(
      `[PERF] seed TOTAL: ${(performance.now() - totalStart).toFixed(2)}ms`
    );

  } catch (err) {
    console.error(
      '[Database Seeder] Failed to seed initial database:',
      err
    );
  }
}

async function logActivity(
  tripId: string,
  userId: string,
  actionType: ActivityDetail['actionType'],
  details: string,
  amount?: number,
  category?: string
) {
  try {
    await prisma.activity.create({
      data: {
        id: generateObjectId(),
        tripId,
        userId,
        actionType,
        details,
        amount: amount || null,
        category: category || null,
      },
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}



export const dbStore = {
  async createUser(name: string, email: string, passwordHash: string): Promise<UserSummary> {
    await ensureDatabaseSeeded();
    const id = generateObjectId();
    const newUser = await prisma.user.create({
      data: { id, name, email, password: passwordHash },
    });
    return { id: newUser.id, name: newUser.name, email: newUser.email };
  },

  async findUserByEmail(email: string): Promise<(UserSummary & { passwordHash: string }) | null> {
    await ensureDatabaseSeeded();
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return null;
    return { id: u.id, name: u.name, email: u.email, passwordHash: u.password };
  },

  async findUserById(id: string): Promise<UserSummary | null> {
    await ensureDatabaseSeeded();
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    return { id: u.id, name: u.name, email: u.email };
  },

  // async getUserTrips(userId: string): Promise<TripSummary[]> {
  //   await ensureDatabaseSeeded();

  //   const userMemberships = await prisma.tripMember.findMany({
  //     where: { userId },
  //     include: {
  //       trip: {
  //         include: {
  //           members: {
  //             select: {
  //               id: true,
  //               tripId: true,
  //               userId: true,
  //               role: true,
  //               joinedAt: true,
  //               user: { select: { id: true, name: true, email: true } },
  //             },
  //           },
  //           expenses: {
  //             where: { status: 'APPROVED' },
  //             select: {
  //               amount: true,
  //               paidById: true,
  //               participants: { select: { userId: true, shareAmount: true } },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   return userMemberships.map((m) => {
  //     const trip = m.trip;
  //     const totalExpense = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  //     let paid = 0;
  //     let share = 0;
  //     trip.expenses.forEach((e) => {
  //       if (e.paidById === userId) paid += e.amount;
  //       e.participants.forEach((p) => {
  //         if (p.userId === userId) share += p.shareAmount;
  //       });
  //     });

  //     return {
  //       id: trip.id,
  //       name: trip.name,
  //       description: trip.description,
  //       code: trip.code,
  //       currency: trip.currency,
  //       budget: trip.budget || null,
  //       startDate: trip.startDate ? trip.startDate.toISOString() : null,
  //       endDate: trip.endDate ? trip.endDate.toISOString() : null,
  //       createdById: trip.createdById || '',
  //       isLocked: trip.isLocked,
  //       approvalMode: trip.approvalMode,
  //       createdAt: trip.createdAt.toISOString(),
  //       members: trip.members.map((mem) => ({
  //         id: mem.id,
  //         tripId: mem.tripId,
  //         userId: mem.userId,
  //         role: mem.role as 'ADMIN' | 'MEMBER',
  //         joinedAt: mem.joinedAt.toISOString(),
  //         user: { id: mem.user.id, name: mem.user.name, email: mem.user.email },
  //       })),
  //       expenses: [],
  //       editRequests: [],
  //       activities: [],
  //       settlementRecords: [],
  //       totalExpense,
  //       userBalance: paid - share,
  //       userTotalPaid: paid,
  //       userTotalShare: share,
  //     };
  //   });
  // },
  

  async getUserTrips(userId: string): Promise<TripSummary[]> {
  const totalStart = performance.now();

  const seedStart = performance.now();
  await ensureDatabaseSeeded();
  const seedEnd = performance.now();

  console.log(
    `[PERF] ensureDatabaseSeeded: ${(seedEnd - seedStart).toFixed(2)}ms`
  );

  const queryStart = performance.now();

  const userMemberships = await prisma.tripMember.findMany({
    where: { userId },
    include: {
      trip: {
        include: {
          members: {
            select: {
              id: true,
              tripId: true,
              userId: true,
              role: true,
              joinedAt: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          expenses: {
            where: { status: 'APPROVED' },
            select: {
              amount: true,
              paidById: true,
              participants: {
                select: {
                  userId: true,
                  shareAmount: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const queryEnd = performance.now();

  console.log(
    `[PERF] prisma query: ${(queryEnd - queryStart).toFixed(2)}ms`
  );

  const processingStart = performance.now();

  const result = userMemberships.map((m) => {
    const trip = m.trip;
    const totalExpense = trip.expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    let paid = 0;
    let share = 0;

    trip.expenses.forEach((e) => {
      if (e.paidById === userId) {
        paid += e.amount;
      }

      e.participants.forEach((p) => {
        if (p.userId === userId) {
          share += p.shareAmount;
        }
      });
    });

    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      code: trip.code,
      currency: trip.currency,
      budget: trip.budget || null,
      startDate: trip.startDate
        ? trip.startDate.toISOString()
        : null,
      endDate: trip.endDate
        ? trip.endDate.toISOString()
        : null,
      createdById: trip.createdById || '',
      isLocked: trip.isLocked,
      approvalMode: trip.approvalMode,
      createdAt: trip.createdAt.toISOString(),

      members: trip.members.map((mem) => ({
        id: mem.id,
        tripId: mem.tripId,
        userId: mem.userId,
        role: mem.role as 'ADMIN' | 'MEMBER',
        joinedAt: mem.joinedAt.toISOString(),
        user: {
          id: mem.user.id,
          name: mem.user.name,
          email: mem.user.email,
        },
      })),

      expenses: [],
      editRequests: [],
      activities: [],
      settlementRecords: [],

      totalExpense,
      userBalance: paid - share,
      userTotalPaid: paid,
      userTotalShare: share,
    };
  });

  const processingEnd = performance.now();

  console.log(
    `[PERF] JS processing: ${(processingEnd - processingStart).toFixed(2)}ms`
  );

  console.log(
    `[PERF] getUserTrips TOTAL: ${(performance.now() - totalStart).toFixed(2)}ms`
  );

  return result;
},

  async getTripById(tripId: string, userId: string): Promise<TripSummary | null> {
    await ensureDatabaseSeeded();

    const userSelect = { select: { id: true, name: true, email: true } };

    const directTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: { include: { user: userSelect } },
        expenses: {
          include: {
            paidBy: userSelect,
            createdBy: userSelect,
            participants: { include: { user: userSelect } },
            editRequests: { include: { requestedBy: userSelect } },
          },
        },
        activities: { include: { user: userSelect }, orderBy: { createdAt: 'desc' } },
        settlements: { include: { fromUser: userSelect, toUser: userSelect }, orderBy: { updatedAt: 'desc' } },
        itinerary: { orderBy: [{ dayNumber: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }] },
        stays: { orderBy: { createdAt: 'desc' } },
        userWallets: {
          include: {
            advances: { include: { user: userSelect, approvedBy: userSelect }, orderBy: { createdAt: 'desc' } },
            transactions: { include: { createdBy: userSelect }, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!directTrip) return null;

    const approvedExpenses = directTrip.expenses.filter((e) => e.status === 'APPROVED');
    const totalExpense = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Format all user wallets
    const formattedUserWallets: UserWalletDetail[] = directTrip.userWallets.map((w) => ({
      id: w.id,
      userId: w.userId,
      tripId: w.tripId,
      balance: w.balance,
      totalAdded: w.totalAdded,
      totalSpent: w.totalSpent,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      advances: w.advances.map((a) => ({
        id: a.id,
        walletId: a.walletId,
        userId: a.userId,
        tripId: a.tripId,
        user: { id: a.user.id, name: a.user.name, email: a.user.email },
        amount: a.amount,
        status: a.status as WalletAdvanceDetail['status'],
        note: a.note,
        approvedById: a.approvedById,
        approvedBy: a.approvedBy ? { id: a.approvedBy.id, name: a.approvedBy.name, email: a.approvedBy.email } : null,
        approvedAt: a.approvedAt ? a.approvedAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      transactions: w.transactions.map((t) => ({
        id: t.id,
        walletId: t.walletId,
        type: t.type as WalletTransactionDetail['type'],
        amount: t.amount,
        description: t.description,
        expenseId: t.expenseId,
        advanceId: t.advanceId,
        createdById: t.createdById,
        createdBy: { id: t.createdBy.id, name: t.createdBy.name, email: t.createdBy.email },
        createdAt: t.createdAt.toISOString(),
      })),
    }));

    // Find current user's personal wallet
    let myWallet = formattedUserWallets.find((w) => w.userId === userId) || null;
    if (!myWallet) {
      // Ensure current user wallet exists
      myWallet = await this.getOrCreateUserWallet(userId, tripId);
    }

    const formattedExpenses: ExpenseDetail[] = directTrip.expenses.map((e) => ({
      id: e.id,
      tripId: e.tripId,
      title: e.title,
      amount: e.amount,
      category: e.category as CategoryType,
      paidById: e.paidById,
      paidBy: { id: e.paidBy.id, name: e.paidBy.name, email: e.paidBy.email },
      createdById: e.createdById || e.paidById,
      createdBy: e.createdBy ? { id: e.createdBy.id, name: e.createdBy.name, email: e.createdBy.email } : undefined,
      lastUpdatedById: e.lastUpdatedById,
      status: e.status as 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED',
      paymentMode: (e.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY',
      walletTransactionId: e.walletTransactionId,
      rejectionReason: e.rejectionReason,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      receiptUrl: e.receiptUrl,
      participants: e.participants.map((p) => ({
        id: p.id,
        expenseId: p.expenseId,
        userId: p.userId,
        shareAmount: p.shareAmount,
        user: { id: p.user.id, name: p.user.name, email: p.user.email },
      })),
      editRequests: e.editRequests?.map((req) => ({
        id: req.id,
        expenseId: req.expenseId,
        requestedById: req.requestedById,
        requestedBy: { id: req.requestedBy.id, name: req.requestedBy.name, email: req.requestedBy.email },
        requestType: req.requestType as 'EDIT' | 'DELETE',
        proposedData: req.proposedData,
        reason: req.reason,
        status: req.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
      })),
    }));

    const formattedMembers = directTrip.members.map((mem) => ({
      id: mem.id,
      tripId: mem.tripId,
      userId: mem.userId,
      role: mem.role as 'ADMIN' | 'MEMBER',
      joinedAt: mem.joinedAt.toISOString(),
      user: { id: mem.user.id, name: mem.user.name, email: mem.user.email },
    }));

    const formattedSettlements: SettlementRecordDetail[] = directTrip.settlements.map((s) => ({
      id: s.id,
      tripId: s.tripId,
      fromUserId: s.fromUserId,
      fromUser: { id: s.fromUser.id, name: s.fromUser.name, email: s.fromUser.email },
      toUserId: s.toUserId,
      toUser: { id: s.toUser.id, name: s.toUser.name, email: s.toUser.email },
      amount: s.amount,
      status: s.status as SettlementRecordDetail['status'],
      note: s.note,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    const memberBalances = calculateMemberBalances(formattedMembers, formattedExpenses, formattedSettlements);
    const userBalanceRec = memberBalances.find((b) => b.user.id === userId);
    const paid = userBalanceRec?.paid || 0;
    const share = userBalanceRec?.share || 0;
    const userBalance = userBalanceRec?.netBalance || 0;

    const allEditRequests = directTrip.expenses.flatMap((e) =>
      (e.editRequests || []).map((req) => ({
        id: req.id,
        expenseId: req.expenseId,
        requestedById: req.requestedById,
        requestedBy: { id: req.requestedBy.id, name: req.requestedBy.name, email: req.requestedBy.email },
        requestType: req.requestType as 'EDIT' | 'DELETE',
        proposedData: req.proposedData,
        reason: req.reason,
        status: req.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
      }))
    );

    return {
      id: directTrip.id,
      name: directTrip.name,
      description: directTrip.description,
      code: directTrip.code,
      currency: directTrip.currency,
      budget: directTrip.budget || null,
      startDate: directTrip.startDate ? directTrip.startDate.toISOString() : null,
      endDate: directTrip.endDate ? directTrip.endDate.toISOString() : null,
      createdById: directTrip.createdById || '',
      isLocked: directTrip.isLocked,
      approvalMode: directTrip.approvalMode,
      createdAt: directTrip.createdAt.toISOString(),
      members: formattedMembers,
      expenses: formattedExpenses,
      editRequests: allEditRequests,
      activities: directTrip.activities.map((a) => ({
        id: a.id,
        tripId: a.tripId,
        userId: a.userId,
        user: { id: a.user.id, name: a.user.name, email: a.user.email },
        actionType: a.actionType as any,
        details: a.details,
        amount: a.amount,
        category: a.category,
        createdAt: a.createdAt.toISOString(),
      })),
      settlementRecords: formattedSettlements,
      myWallet,
      allWallets: formattedUserWallets,
      itinerary: directTrip.itinerary.map((item) => ({
        id: item.id,
        tripId: item.tripId,
        dayNumber: item.dayNumber,
        date: item.date ? item.date.toISOString() : null,
        title: item.title,
        description: item.description,
        location: item.location,
        startTime: item.startTime,
        endTime: item.endTime,
        category: item.category,
        order: item.order,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      stays: directTrip.stays.map((stay) => ({
        id: stay.id,
        tripId: stay.tripId,
        name: stay.name,
        address: stay.address,
        checkIn: stay.checkIn ? stay.checkIn.toISOString() : null,
        checkOut: stay.checkOut ? stay.checkOut.toISOString() : null,
        checkInTime: stay.checkInTime,
        checkOutTime: stay.checkOutTime,
        bookingRef: stay.bookingRef,
        bookingUrl: stay.bookingUrl,
        contactPhone: stay.contactPhone,
        notes: stay.notes,
        createdAt: stay.createdAt.toISOString(),
        updatedAt: stay.updatedAt.toISOString(),
      })),
      totalExpense: Math.round(totalExpense * 100) / 100,
      userBalance,
      userTotalPaid: paid,
      userTotalShare: share,
    };
  },

  async createTrip(
    userId: string,
    name: string,
    description: string = '',
    currency: string = '₹',
    startDate?: string,
    endDate?: string
  ): Promise<TripSummary> {
    await ensureDatabaseSeeded();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Authenticated user record not found in database.');

    const code = generateTripCode();
    const tripObjectId = generateObjectId();
    const memberObjectId = generateObjectId();

    const trip = await prisma.trip.create({
      data: {
        id: tripObjectId,
        name,
        description,
        code,
        currency,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: userId,
        members: {
          create: {
            id: memberObjectId,
            userId,
            role: 'ADMIN',
          },
        },
      },
    });

    await logActivity(
      trip.id,
      userId,
      'TRIP_CREATED',
      `${user.name} created the trip "${name}" (Code: ${code})`
    );

    const fetchedTrip = await this.getTripById(trip.id, userId);
    if (!fetchedTrip) throw new Error(`Failed to fetch newly created trip ${trip.id}`);
    return fetchedTrip;
  },

  async joinTripByCode(userId: string, code: string): Promise<TripSummary> {
    await ensureDatabaseSeeded();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const uppercaseCode = code.trim().toUpperCase();

    const existingTrip = await prisma.trip.findUnique({ where: { code: uppercaseCode } });
    if (!existingTrip) {
      throw new Error('Invalid trip code. Please verify and try again.');
    }

    const existingMember = await prisma.tripMember.findFirst({
      where: { tripId: existingTrip.id, userId },
    });

    if (!existingMember) {
      await prisma.tripMember.create({
        data: {
          id: generateObjectId(),
          tripId: existingTrip.id,
          userId,
          role: 'MEMBER',
        },
      });

      await logActivity(
        existingTrip.id,
        userId,
        'MEMBER_JOINED',
        `${user.name} joined the trip`
      );
    }

    const fetchedTrip = await this.getTripById(existingTrip.id, userId);
    if (!fetchedTrip) throw new Error('Failed to retrieve trip after joining.');
    return fetchedTrip;
  },

  async getOrCreateUserWallet(userId: string, tripId: string): Promise<UserWalletDetail> {
    await ensureDatabaseSeeded();

    const userSelect = { select: { id: true, name: true, email: true } };

    let wallet = await prisma.userWallet.findUnique({
      where: { userId_tripId: { userId, tripId } },
      include: {
        advances: { include: { user: userSelect, approvedBy: userSelect }, orderBy: { createdAt: 'desc' } },
        transactions: { include: { createdBy: userSelect }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          id: generateObjectId(),
          userId,
          tripId,
          balance: 0,
          totalAdded: 0,
          totalSpent: 0,
        },
        include: {
          advances: { include: { user: userSelect, approvedBy: userSelect }, orderBy: { createdAt: 'desc' } },
          transactions: { include: { createdBy: userSelect }, orderBy: { createdAt: 'desc' } },
        },
      });
    }

    return {
      id: wallet.id,
      userId: wallet.userId,
      tripId: wallet.tripId,
      balance: wallet.balance,
      totalAdded: wallet.totalAdded,
      totalSpent: wallet.totalSpent,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
      advances: wallet.advances.map((a) => ({
        id: a.id,
        walletId: a.walletId,
        userId: a.userId,
        tripId: a.tripId,
        user: { id: a.user.id, name: a.user.name, email: a.user.email },
        amount: a.amount,
        status: a.status as WalletAdvanceDetail['status'],
        note: a.note,
        approvedById: a.approvedById,
        approvedBy: a.approvedBy ? { id: a.approvedBy.id, name: a.approvedBy.name, email: a.approvedBy.email } : null,
        approvedAt: a.approvedAt ? a.approvedAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      transactions: wallet.transactions.map((t) => ({
        id: t.id,
        walletId: t.walletId,
        type: t.type as WalletTransactionDetail['type'],
        amount: t.amount,
        description: t.description,
        expenseId: t.expenseId,
        advanceId: t.advanceId,
        createdById: t.createdById,
        createdBy: { id: t.createdBy.id, name: t.createdBy.name, email: t.createdBy.email },
        createdAt: t.createdAt.toISOString(),
      })),
    };
  },

  async requestWalletAdvance(
    userId: string,
    tripId: string,
    amount: number,
    note?: string
  ): Promise<WalletAdvanceDetail> {
    await ensureDatabaseSeeded();

    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Advance amount must be greater than zero.');
    }

    const userSelect = { select: { id: true, name: true, email: true } };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const wallet = await this.getOrCreateUserWallet(userId, tripId);

    const advance = await prisma.walletAdvance.create({
      data: {
        id: generateObjectId(),
        walletId: wallet.id,
        userId,
        tripId,
        amount: Math.round(amount * 100) / 100,
        status: 'PENDING',
        note: note ? note.trim() : null,
      },
      include: { user: userSelect, approvedBy: userSelect },
    });

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    await logActivity(
      tripId,
      userId,
      'WALLET_ADVANCE_SUBMITTED',
      `${user.name} submitted a personal advance request of ${trip?.currency || '₹'}${advance.amount} (Pending Host approval)`,
      advance.amount
    );

    return {
      id: advance.id,
      walletId: advance.walletId,
      userId: advance.userId,
      tripId: advance.tripId,
      user: { id: advance.user.id, name: advance.user.name, email: advance.user.email },
      amount: advance.amount,
      status: advance.status as WalletAdvanceDetail['status'],
      note: advance.note,
      approvedById: advance.approvedById,
      approvedBy: advance.approvedBy ? { id: advance.approvedBy.id, name: advance.approvedBy.name, email: advance.approvedBy.email } : null,
      approvedAt: advance.approvedAt ? advance.approvedAt.toISOString() : null,
      createdAt: advance.createdAt.toISOString(),
      updatedAt: advance.updatedAt.toISOString(),
    };
  },

  async processWalletAdvance(
    advanceId: string,
    hostUserId: string,
    action: 'APPROVE' | 'REJECT'
  ): Promise<WalletAdvanceDetail> {
    await ensureDatabaseSeeded();

    const userSelect = { select: { id: true, name: true, email: true } };
    const hostUser = await prisma.user.findUnique({ where: { id: hostUserId } });
    if (!hostUser) throw new Error('User not found');

    const advance = await prisma.walletAdvance.findUnique({
      where: { id: advanceId },
      include: { user: userSelect, wallet: true },
    });
    if (!advance) throw new Error('Wallet advance request not found.');

    const trip = await prisma.trip.findUnique({
      where: { id: advance.tripId },
      include: { members: true },
    });
    if (!trip) throw new Error('Trip not found');

    const hostMember = trip.members.find((m) => m.userId === hostUserId);
    const isHost = hostMember?.role === 'ADMIN' || trip.createdById === hostUserId;
    if (!isHost) {
      throw new Error('Forbidden: Only the Trip Host/Admin can approve or reject wallet advances.');
    }

    if (advance.status !== 'PENDING') {
      throw new Error(`Advance request has already been ${advance.status.toLowerCase()}.`);
    }

    if (action === 'REJECT') {
      const updated = await prisma.walletAdvance.update({
        where: { id: advanceId },
        data: { status: 'REJECTED', approvedById: hostUserId, approvedAt: new Date() },
        include: { user: userSelect, approvedBy: userSelect },
      });

      await logActivity(
        trip.id,
        hostUserId,
        'WALLET_ADVANCE_REJECTED',
        `${hostUser.name} rejected ${advance.user.name}'s advance request of ${trip.currency}${advance.amount}`
      );

      return {
        id: updated.id,
        walletId: updated.walletId,
        userId: updated.userId,
        tripId: updated.tripId,
        user: { id: updated.user.id, name: updated.user.name, email: updated.user.email },
        amount: updated.amount,
        status: updated.status as WalletAdvanceDetail['status'],
        note: updated.note,
        approvedById: updated.approvedById,
        approvedBy: updated.approvedBy ? { id: updated.approvedBy.id, name: updated.approvedBy.name, email: updated.approvedBy.email } : null,
        approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const freshAdvance = await tx.walletAdvance.findUnique({ where: { id: advanceId } });
      if (!freshAdvance || freshAdvance.status !== 'PENDING') {
        throw new Error('Advance request has already been processed.');
      }

      const updatedAdvance = await tx.walletAdvance.update({
        where: { id: advanceId },
        data: { status: 'APPROVED', approvedById: hostUserId, approvedAt: new Date() },
        include: { user: userSelect, approvedBy: userSelect },
      });

      await tx.userWallet.update({
        where: { id: advance.walletId },
        data: {
          balance: { increment: advance.amount },
          totalAdded: { increment: advance.amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          id: generateObjectId(),
          walletId: advance.walletId,
          type: 'ADVANCE_CREDIT',
          amount: advance.amount,
          description: `Advance added (${advance.note || 'Approved by Host'})`,
          advanceId: advance.id,
          createdById: hostUserId,
        },
      });

      return updatedAdvance;
    });

    await logActivity(
      trip.id,
      hostUserId,
      'WALLET_ADVANCE_APPROVED',
      `${hostUser.name} approved ${advance.user.name}'s advance request of ${trip.currency}${advance.amount}`,
      advance.amount
    );

    return {
      id: result.id,
      walletId: result.walletId,
      userId: result.userId,
      tripId: result.tripId,
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
      amount: result.amount,
      status: result.status as WalletAdvanceDetail['status'],
      note: result.note,
      approvedById: result.approvedById,
      approvedBy: result.approvedBy ? { id: result.approvedBy.id, name: result.approvedBy.name, email: result.approvedBy.email } : null,
      approvedAt: result.approvedAt ? result.approvedAt.toISOString() : null,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  },

  async addExpense(
    tripId: string,
    title: string,
    amount: number,
    category: CategoryType,
    paidById: string,
    createdById: string,
    participantUserIds: string[],
    receiptUrl?: string | null,
    paymentMode: 'PERSONALLY' | 'WALLET' = 'PERSONALLY'
  ): Promise<ExpenseDetail> {
    await ensureDatabaseSeeded();

    const creatorUser = await prisma.user.findUnique({ where: { id: createdById } });
    if (!creatorUser) throw new Error('Creator user record not found');

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error('Trip not found');

    if (trip.isLocked) {
      throw new Error('Trip is locked by the organizer. New expenses cannot be added.');
    }

    if (paymentMode === 'WALLET') {
      const payerWallet = await this.getOrCreateUserWallet(paidById, tripId);
      if (payerWallet.balance < amount - 0.01) {
        throw new Error(
          `Insufficient advance balance in ${paidById === createdById ? 'your' : 'payer\'s'} personal wallet. Available: ${trip.currency}${payerWallet.balance}, required: ${trip.currency}${amount}.`
        );
      }
    }

    const shareAmount = participantUserIds.length > 0 ? amount / participantUserIds.length : 0;
    const expenseObjectId = generateObjectId();

    const creatorMember = await prisma.tripMember.findFirst({
      where: { tripId, userId: createdById },
    });
    const isCreatorAdmin = creatorMember?.role === 'ADMIN' || trip.createdById === createdById;
    const status = trip.approvalMode && !isCreatorAdmin ? 'PENDING_APPROVAL' : 'APPROVED';

    const result = await prisma.$transaction(async (tx) => {
      let walletTxId: string | null = null;
      if (paymentMode === 'WALLET') {
        const freshWallet = await tx.userWallet.findUnique({
          where: { userId_tripId: { userId: paidById, tripId } },
        });
        if (!freshWallet || freshWallet.balance < amount - 0.01) {
          throw new Error('Insufficient wallet balance.');
        }

        const walletTx = await tx.walletTransaction.create({
          data: {
            id: generateObjectId(),
            walletId: freshWallet.id,
            type: 'EXPENSE_DEBIT',
            amount,
            description: `Used for expense: ${title}`,
            expenseId: expenseObjectId,
            createdById,
          },
        });
        walletTxId = walletTx.id;

        await tx.userWallet.update({
          where: { id: freshWallet.id },
          data: {
            balance: { decrement: amount },
            totalSpent: { increment: amount },
          },
        });
      }

      const expense = await tx.expense.create({
        data: {
          id: expenseObjectId,
          tripId,
          title,
          amount,
          category,
          paidById,
          createdById,
          status,
          paymentMode,
          walletTransactionId: walletTxId,
          receiptUrl: receiptUrl || null,
          date: new Date(),
          participants: {
            create: participantUserIds.map((uid) => ({
              id: generateObjectId(),
              userId: uid,
              shareAmount,
            })),
          },
        },
        include: {
          paidBy: true,
          createdBy: true,
          participants: { include: { user: true } },
        },
      });

      return expense;
    });

    await logActivity(
      tripId,
      createdById,
      'EXPENSE_ADDED',
      `${creatorUser.name} added expense "${title}" (${trip.currency}${amount})${paymentMode === 'WALLET' ? ' [Paid from Advance Wallet]' : ''}`,
      amount,
      category
    );

    return {
      id: result.id,
      tripId: result.tripId,
      title: result.title,
      amount: result.amount,
      category: result.category as CategoryType,
      paidById: result.paidById,
      paidBy: { id: result.paidBy.id, name: result.paidBy.name, email: result.paidBy.email },
      createdById: result.createdById,
      createdBy: { id: creatorUser.id, name: creatorUser.name, email: creatorUser.email },
      lastUpdatedById: result.lastUpdatedById,
      status: result.status as 'APPROVED' | 'PENDING_APPROVAL',
      paymentMode: (result.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY',
      walletTransactionId: result.walletTransactionId,
      date: result.date.toISOString(),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      receiptUrl: result.receiptUrl,
      participants: result.participants.map((p) => ({
        id: p.id,
        expenseId: p.expenseId,
        userId: p.userId,
        shareAmount: p.shareAmount,
        user: { id: p.user.id, name: p.user.name, email: p.user.email },
      })),
    };
  },

  async updateExpense(
    expenseId: string,
    currentUserId: string,
    title: string,
    amount: number,
    category: CategoryType,
    paidById: string,
    participantUserIds: string[],
    receiptUrl?: string | null,
    paymentMode: 'PERSONALLY' | 'WALLET' = 'PERSONALLY'
  ): Promise<ExpenseDetail> {
    await ensureDatabaseSeeded();

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: { include: { members: true } } },
    });
    if (!existingExpense) throw new Error('Expense not found');

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser) throw new Error('User not found');

    const memberRole = existingExpense.trip.members.find((m) => m.userId === currentUserId)?.role;
    const isCreator = existingExpense.createdById === currentUserId;
    const isAdmin = memberRole === 'ADMIN';

    if (!isCreator && !isAdmin) {
      throw new Error('Forbidden: Only the expense creator or trip organizer can edit this expense.');
    }

    if (existingExpense.trip.isLocked) {
      throw new Error('Trip is locked by the organizer. Expenses cannot be updated.');
    }

    const oldMode = (existingExpense.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY';
    const oldAmount = existingExpense.amount;
    const shareAmount = participantUserIds.length > 0 ? amount / participantUserIds.length : 0;

    const updated = await prisma.$transaction(async (tx) => {
      let walletTxId = existingExpense.walletTransactionId;

      if (oldMode === 'WALLET' && paymentMode === 'WALLET') {
        const diff = amount - oldAmount;
        if (diff !== 0) {
          const wallet = await tx.userWallet.findUnique({
            where: { userId_tripId: { userId: paidById, tripId: existingExpense.tripId } },
          });
          if (diff > 0 && (!wallet || wallet.balance < diff - 0.01)) {
            throw new Error(`Insufficient personal wallet balance for updated amount.`);
          }
          if (wallet) {
            await tx.userWallet.update({
              where: { id: wallet.id },
              data: {
                balance: { decrement: diff },
                totalSpent: { increment: diff },
              },
            });
            const adjTx = await tx.walletTransaction.create({
              data: {
                id: generateObjectId(),
                walletId: wallet.id,
                type: 'ADJUSTMENT',
                amount: Math.abs(diff),
                description: `Adjustment for expense: ${title} (${diff > 0 ? '+' : '-'}${existingExpense.trip.currency}${Math.abs(diff)})`,
                expenseId,
                createdById: currentUserId,
              },
            });
            walletTxId = adjTx.id;
          }
        }
      } else if (oldMode === 'PERSONALLY' && paymentMode === 'WALLET') {
        const wallet = await tx.userWallet.findUnique({
          where: { userId_tripId: { userId: paidById, tripId: existingExpense.tripId } },
        });
        if (!wallet || wallet.balance < amount - 0.01) {
          throw new Error(`Insufficient personal wallet balance to switch payment source to Advance Wallet.`);
        }
        await tx.userWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: amount },
            totalSpent: { increment: amount },
          },
        });
        const wTx = await tx.walletTransaction.create({
          data: {
            id: generateObjectId(),
            walletId: wallet.id,
            type: 'EXPENSE_DEBIT',
            amount,
            description: `Used for expense: ${title}`,
            expenseId,
            createdById: currentUserId,
          },
        });
        walletTxId = wTx.id;
      } else if (oldMode === 'WALLET' && paymentMode === 'PERSONALLY') {
        const wallet = await tx.userWallet.findUnique({
          where: { userId_tripId: { userId: existingExpense.paidById, tripId: existingExpense.tripId } },
        });
        if (wallet) {
          await tx.userWallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: oldAmount },
              totalSpent: { decrement: oldAmount },
            },
          });
          await tx.walletTransaction.create({
            data: {
              id: generateObjectId(),
              walletId: wallet.id,
              type: 'REFUND',
              amount: oldAmount,
              description: `Reversal for expense switched to personal money: ${title}`,
              expenseId,
              createdById: currentUserId,
            },
          });
        }
        walletTxId = null;
      }

      await tx.expenseParticipant.deleteMany({ where: { expenseId } });

      const updatedExp = await tx.expense.update({
        where: { id: expenseId },
        data: {
          title,
          amount,
          category,
          paidById,
          paymentMode,
          walletTransactionId: walletTxId,
          lastUpdatedById: currentUserId,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : existingExpense.receiptUrl,
          participants: {
            create: participantUserIds.map((uid) => ({
              id: generateObjectId(),
              userId: uid,
              shareAmount,
            })),
          },
        },
        include: {
          paidBy: true,
          createdBy: true,
          participants: { include: { user: true } },
        },
      });

      return updatedExp;
    });

    await logActivity(
      existingExpense.tripId,
      currentUserId,
      'EXPENSE_UPDATED',
      `${currentUser.name} updated expense "${title}" (${existingExpense.trip.currency}${oldAmount} → ${existingExpense.trip.currency}${amount})`,
      amount,
      category
    );

    return {
      id: updated.id,
      tripId: updated.tripId,
      title: updated.title,
      amount: updated.amount,
      category: updated.category as CategoryType,
      paidById: updated.paidById,
      paidBy: { id: updated.paidBy.id, name: updated.paidBy.name, email: updated.paidBy.email },
      createdById: updated.createdById,
      createdBy: updated.createdBy ? { id: updated.createdBy.id, name: updated.createdBy.name, email: updated.createdBy.email } : undefined,
      lastUpdatedById: updated.lastUpdatedById,
      status: updated.status as 'APPROVED' | 'PENDING_APPROVAL',
      paymentMode: (updated.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY',
      walletTransactionId: updated.walletTransactionId,
      date: updated.date.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      receiptUrl: updated.receiptUrl,
      participants: updated.participants.map((p) => ({
        id: p.id,
        expenseId: p.expenseId,
        userId: p.userId,
        shareAmount: p.shareAmount,
        user: { id: p.user.id, name: p.user.name, email: p.user.email },
      })),
    };
  },

  async deleteExpense(expenseId: string, currentUserId: string): Promise<boolean> {
    await ensureDatabaseSeeded();

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: { include: { members: true } } },
    });
    if (!existingExpense) return false;

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser) throw new Error('User not found');

    const memberRole = existingExpense.trip.members.find((m) => m.userId === currentUserId)?.role;
    const isCreator = existingExpense.createdById === currentUserId;
    const isAdmin = memberRole === 'ADMIN';

    if (!isCreator && !isAdmin) {
      throw new Error('Forbidden: Only the expense creator or trip organizer can delete this expense.');
    }

    if (existingExpense.trip.isLocked) {
      throw new Error('Trip is locked by the organizer.');
    }

    await prisma.$transaction(async (tx) => {
      if (existingExpense.paymentMode === 'WALLET') {
        const wallet = await tx.userWallet.findUnique({
          where: { userId_tripId: { userId: existingExpense.paidById, tripId: existingExpense.tripId } },
        });
        if (wallet) {
          await tx.userWallet.update({
            where: { id: wallet.id },
            data: {
              balance: { increment: existingExpense.amount },
              totalSpent: { decrement: existingExpense.amount },
            },
          });
          await tx.walletTransaction.create({
            data: {
              id: generateObjectId(),
              walletId: wallet.id,
              type: 'REFUND',
              amount: existingExpense.amount,
              description: `Restored advance for deleted expense: ${existingExpense.title}`,
              expenseId,
              createdById: currentUserId,
            },
          });
        }
      }

      await tx.expense.delete({ where: { id: expenseId } });
    });

    await logActivity(
      existingExpense.tripId,
      currentUserId,
      'EXPENSE_DELETED',
      `${currentUser.name} deleted expense "${existingExpense.title}" (${existingExpense.trip.currency}${existingExpense.amount})`,
      existingExpense.amount,
      existingExpense.category
    );

    return true;
  },

  async createOrUpdateSettlement(
    tripId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    status: SettlementRecordDetail['status'] = 'PENDING',
    note?: string
  ): Promise<SettlementRecordDetail> {
    await ensureDatabaseSeeded();

    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Settlement amount must be greater than zero.');
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const userSelect = { select: { id: true, name: true, email: true } };

    const fromUser = await prisma.user.findUnique({ where: { id: fromUserId } });
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!fromUser || !toUser) throw new Error('Users not found');

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: { include: { user: userSelect } },
        expenses: {
          include: {
            paidBy: userSelect,
            createdBy: userSelect,
            participants: { include: { user: userSelect } },
          },
        },
        settlements: { include: { fromUser: userSelect, toUser: userSelect } },
      },
    });
    if (!trip) throw new Error('Trip not found');

    const approvedExpenses: ExpenseDetail[] = trip.expenses
      .filter((e) => e.status === 'APPROVED')
      .map((e) => ({
        ...e,
        category: e.category as CategoryType,
        paymentMode: (e.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY',
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        status: e.status as any,
        participants: e.participants.map((p) => ({ ...p, user: p.user })),
      }));

    const settlementRecords: SettlementRecordDetail[] = trip.settlements.map((s) => ({
      ...s,
      status: s.status as any,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    const mappedMembers = trip.members.map((m) => ({
      user: { id: m.user.id, name: m.user.name, email: m.user.email },
    }));

    const computedSettlements = computeSettlements(mappedMembers, approvedExpenses, settlementRecords);
    const pairTx = computedSettlements.find((tx) => tx.fromUser.id === fromUserId && tx.toUser.id === toUserId);
    const currentOutstanding = pairTx ? pairTx.amount : 0;

    if (roundedAmount > currentOutstanding + 0.01) {
      throw new Error(
        `Settlement amount (${trip.currency}${roundedAmount}) cannot exceed current outstanding debt (${trip.currency}${currentOutstanding}).`
      );
    }

    const existingPending = await prisma.settlement.findFirst({
      where: { tripId, fromUserId, toUserId, status: 'PENDING' },
    });
    if (existingPending && status === 'PENDING') {
      throw new Error('A settlement approval request is already pending for this payment. Please wait for host approval.');
    }

    const existingRollback = await prisma.settlement.findFirst({
      where: { tripId, fromUserId, toUserId, status: 'ROLLBACK_REQUESTED' },
    });
    if (existingRollback && status === 'PENDING') {
      throw new Error('A settlement rollback request is currently pending for this payment.');
    }

    const settlement = await prisma.settlement.create({
      data: {
        id: generateObjectId(),
        tripId,
        fromUserId,
        toUserId,
        amount: roundedAmount,
        status,
        note: note ? note.trim() : null,
      },
      include: { fromUser: true, toUser: true },
    });

    const actionType = status === 'CONFIRMED' ? 'SETTLEMENT_CONFIRMED' : 'SETTLEMENT_MARKED';
    await logActivity(
      tripId,
      fromUserId,
      actionType,
      `${fromUser.name} ${status === 'CONFIRMED' ? 'confirmed' : 'requested'} settlement of ${trip.currency}${roundedAmount} to ${toUser.name}${status === 'PENDING' ? ' (Pending Host approval)' : ''}`,
      roundedAmount
    );

    return {
      id: settlement.id,
      tripId: settlement.tripId,
      fromUserId: settlement.fromUserId,
      fromUser: { id: settlement.fromUser.id, name: settlement.fromUser.name, email: settlement.fromUser.email },
      toUserId: settlement.toUserId,
      toUser: { id: settlement.toUser.id, name: settlement.toUser.name, email: settlement.toUser.email },
      amount: settlement.amount,
      status: settlement.status as SettlementRecordDetail['status'],
      note: settlement.note,
      createdAt: settlement.createdAt.toISOString(),
      updatedAt: settlement.updatedAt.toISOString(),
    };
  },

  async updateSettlementStatus(
    tripId: string,
    settlementId: string,
    currentUserId: string,
    targetStatus: 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'ROLLBACK_REQUESTED' | 'ROLLED_BACK',
    note?: string
  ): Promise<SettlementRecordDetail> {
    await ensureDatabaseSeeded();

    const userSelect = { select: { id: true, name: true, email: true } };
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: { trip: { include: { members: true } }, fromUser: true, toUser: true },
    });
    if (!settlement || settlement.tripId !== tripId) throw new Error('Settlement record not found');

    const currentMember = settlement.trip.members.find((m) => m.userId === currentUserId);
    const isAdmin = currentMember?.role === 'ADMIN' || settlement.trip.createdById === currentUserId;
    const isReceiver = settlement.toUserId === currentUserId;
    const isPayer = settlement.fromUserId === currentUserId;

    // Re-validate against current outstanding balance on approval
    if (targetStatus === 'CONFIRMED' && settlement.status === 'PENDING') {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          members: { include: { user: userSelect } },
          expenses: {
            include: {
              paidBy: userSelect,
              createdBy: userSelect,
              participants: { include: { user: userSelect } },
            },
          },
          settlements: { include: { fromUser: userSelect, toUser: userSelect } },
        },
      });
      if (trip) {
        const approvedExpenses: ExpenseDetail[] = trip.expenses
          .filter((e) => e.status === 'APPROVED')
          .map((e) => ({
            ...e,
            category: e.category as CategoryType,
            paymentMode: (e.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY',
            date: e.date.toISOString(),
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            status: e.status as any,
            participants: e.participants.map((p) => ({ ...p, user: p.user })),
          }));

        const settlementRecords: SettlementRecordDetail[] = trip.settlements.map((s) => ({
          ...s,
          status: s.status as any,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }));

        const mappedMembers = trip.members.map((m) => ({
          user: { id: m.user.id, name: m.user.name, email: m.user.email },
        }));

        const computedSettlements = computeSettlements(mappedMembers, approvedExpenses, settlementRecords);
        const pairTx = computedSettlements.find(
          (tx) => tx.fromUser.id === settlement.fromUserId && tx.toUser.id === settlement.toUserId
        );
        const currentOutstanding = pairTx ? pairTx.amount : 0;

        if (settlement.amount > currentOutstanding + 0.01) {
          throw new Error(
            `Cannot approve settlement: requested amount (${trip.currency}${settlement.amount}) exceeds current outstanding debt (${trip.currency}${currentOutstanding}).`
          );
        }
      }
    }

    // Validate state transitions & permissions
    if (targetStatus === 'CONFIRMED' || targetStatus === 'REJECTED') {
      if (settlement.status === 'ROLLBACK_REQUESTED') {
        if (!isPayer && !isAdmin) {
          throw new Error('Forbidden: Only the client (payer) or Super Host/Admin can reject a rollback request.');
        }
      } else {
        if (!isReceiver && !isAdmin) {
          throw new Error('Forbidden: Only the payment recipient or Super Host/Admin can approve/reject settlement requests.');
        }
      }
    } else if (targetStatus === 'ROLLBACK_REQUESTED') {
      if (!isReceiver && !isAdmin) {
        throw new Error('Forbidden: Only the Super Host/Admin or recipient can request a settlement rollback.');
      }
      if (settlement.status !== 'CONFIRMED' && settlement.status !== 'COMPLETED') {
        throw new Error('Invalid action: Only confirmed settlements can be requested for rollback.');
      }
    } else if (targetStatus === 'ROLLED_BACK') {
      if (!isPayer && !isAdmin) {
        throw new Error('Forbidden: Only the client (payer) or Super Host/Admin can approve a settlement rollback.');
      }
      if (settlement.status !== 'ROLLBACK_REQUESTED') {
        throw new Error('Invalid action: No rollback request is currently pending for this settlement.');
      }
    }

    const updated = await prisma.settlement.update({
      where: { id: settlementId },
      data: { status: targetStatus, note: note !== undefined ? note : settlement.note, updatedAt: new Date() },
      include: { fromUser: true, toUser: true },
    });

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    let actionType: ActivityDetail['actionType'] = 'SETTLEMENT_CONFIRMED';
    let activityText = '';

    if (targetStatus === 'CONFIRMED') {
      if (settlement.status === 'ROLLBACK_REQUESTED') {
        actionType = 'SETTLEMENT_ROLLBACK_REJECTED';
        activityText = `${currentUser?.name || 'User'} rejected settlement rollback. Settlement of ${settlement.trip.currency || '₹'}${settlement.amount} between ${settlement.fromUser.name} and ${settlement.toUser.name} remains valid.`;
      } else {
        actionType = 'SETTLEMENT_CONFIRMED';
        activityText = `${currentUser?.name || 'User'} approved settlement of ${settlement.trip.currency || '₹'}${settlement.amount} from ${settlement.fromUser.name} to ${settlement.toUser.name}`;
      }
    } else if (targetStatus === 'REJECTED') {
      actionType = 'SETTLEMENT_REJECTED';
      activityText = `${currentUser?.name || 'User'} rejected settlement request of ${settlement.trip.currency || '₹'}${settlement.amount} from ${settlement.fromUser.name} to ${settlement.toUser.name}`;
    } else if (targetStatus === 'ROLLBACK_REQUESTED') {
      actionType = 'SETTLEMENT_ROLLBACK_REQUESTED';
      activityText = `${currentUser?.name || 'User'} requested rollback of settlement (${settlement.trip.currency || '₹'}${settlement.amount}) with ${settlement.fromUser.name} (Pending client approval)`;
    } else if (targetStatus === 'ROLLED_BACK') {
      actionType = 'SETTLEMENT_ROLLBACK_APPROVED';
      activityText = `${currentUser?.name || 'User'} approved rollback of settlement (${settlement.trip.currency || '₹'}${settlement.amount}). Settlement reversed to unsettled.`;
    }

    await logActivity(
      tripId,
      currentUserId,
      actionType,
      activityText,
      settlement.amount
    );

    return {
      id: updated.id,
      tripId: updated.tripId,
      fromUserId: updated.fromUserId,
      fromUser: { id: updated.fromUser.id, name: updated.fromUser.name, email: updated.fromUser.email },
      toUserId: updated.toUserId,
      toUser: { id: updated.toUser.id, name: updated.toUser.name, email: updated.toUser.email },
      amount: updated.amount,
      status: updated.status as SettlementRecordDetail['status'],
      note: updated.note,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async checkMemberRemovalStatus(
    tripId: string,
    targetUserId: string
  ) {
    await ensureDatabaseSeeded();
    const tripSummary = await this.getTripById(tripId, targetUserId);
    if (!tripSummary) throw new Error('Trip not found');

    const targetMember = tripSummary.members.find((m) => m.userId === targetUserId);
    if (!targetMember) throw new Error('Member not found in trip');

    // Compute member net balance incorporating settlements
    const balances = calculateMemberBalances(tripSummary.members, tripSummary.expenses, tripSummary.settlementRecords);
    const targetBalanceRecord = balances.find((b: MemberBalance) => b.user.id === targetUserId);
    const netBalance = targetBalanceRecord ? targetBalanceRecord.netBalance : 0;

    // Check pending settlement records involving targetUserId
    const pendingSettlements = (tripSummary.settlementRecords || []).filter(
      (s) => (s.fromUserId === targetUserId || s.toUserId === targetUserId) && s.status === 'PENDING'
    );

    // Check pending expense approvals
    const pendingExpenses = tripSummary.expenses.filter(
      (e) => e.status === 'PENDING_APPROVAL' && (e.paidById === targetUserId || e.participants.some((p) => p.userId === targetUserId))
    );

    // Check pending edit requests
    const pendingEditRequests = (tripSummary.editRequests || []).filter(
      (r) => r.requestedById === targetUserId && r.status === 'PENDING'
    );

    const canRemoveDirectly = netBalance === 0 && pendingSettlements.length === 0 && pendingExpenses.length === 0 && pendingEditRequests.length === 0;

    return {
      targetUser: targetMember.user,
      role: targetMember.role,
      canRemoveDirectly,
      netBalance,
      pendingSettlementsCount: pendingSettlements.length,
      pendingExpensesCount: pendingExpenses.length,
      pendingEditRequestsCount: pendingEditRequests.length,
      details: {
        paidAmount: targetBalanceRecord?.paid || 0,
        shareAmount: targetBalanceRecord?.share || 0,
        owes: netBalance < 0 ? Math.abs(netBalance) : 0,
        getsBack: netBalance > 0 ? netBalance : 0,
      },
    };
  },

  async removeTripMember(
    tripId: string,
    adminUserId: string,
    targetUserId: string,
    action: 'REMOVE' | 'SETTLE_AND_REMOVE' | 'REASSIGN_AND_REMOVE' = 'REMOVE',
    reassignToUserId?: string
  ) {
    await ensureDatabaseSeeded();
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: { include: { user: true } } },
    });
    if (!trip) throw new Error('Trip not found');

    const adminMember = trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can remove members.');

    if (targetUserId === trip.createdById) {
      throw new Error('Forbidden: Super Host / Primary Trip Creator cannot be removed.');
    }
    if (adminUserId === targetUserId) {
      throw new Error('Trip Admin cannot remove themselves via member removal.');
    }

    const targetMember = trip.members.find((m) => m.userId === targetUserId);
    if (!targetMember) throw new Error('Target user is not a member of this trip.');

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
    const targetUser = targetMember.user;

    if (action === 'SETTLE_AND_REMOVE') {
      const checkStatus = await this.checkMemberRemovalStatus(tripId, targetUserId);
      const net = checkStatus.netBalance;

      if (net < 0) {
        // Target user owes money: Create confirmed settlement from targetUser to adminUserId
        await prisma.settlement.create({
          data: {
            id: generateObjectId(),
            tripId,
            fromUserId: targetUserId,
            toUserId: adminUserId,
            amount: Math.abs(net),
            status: 'CONFIRMED',
            note: 'Auto-settled by Host upon member removal',
          },
        });
      } else if (net > 0) {
        // Target user gets back money: Create confirmed settlement from adminUserId to targetUser
        await prisma.settlement.create({
          data: {
            id: generateObjectId(),
            tripId,
            fromUserId: adminUserId,
            toUserId: targetUserId,
            amount: net,
            status: 'CONFIRMED',
            note: 'Auto-settled by Host upon member removal',
          },
        });
      }

      // Reject all pending settlement requests involving targetUser
      await prisma.settlement.updateMany({
        where: { tripId, OR: [{ fromUserId: targetUserId }, { toUserId: targetUserId }], status: 'PENDING' },
        data: { status: 'REJECTED' },
      });
    } else if (action === 'REASSIGN_AND_REMOVE') {
      const fallbackUserId = reassignToUserId || adminUserId;
      // Reassign paid expenses
      await prisma.expense.updateMany({
        where: { tripId, paidById: targetUserId },
        data: { paidById: fallbackUserId },
      });

      // Remove targetUser from expense participants and re-split
      const targetParticipants = await prisma.expenseParticipant.findMany({
        where: { userId: targetUserId, expense: { tripId } },
        include: { expense: { include: { participants: true } } },
      });

      for (const p of targetParticipants) {
        await prisma.expenseParticipant.delete({ where: { id: p.id } });
        const remainingParticipants = p.expense.participants.filter((part) => part.userId !== targetUserId);
        if (remainingParticipants.length > 0) {
          const newShare = p.expense.amount / remainingParticipants.length;
          await prisma.expenseParticipant.updateMany({
            where: { expenseId: p.expenseId },
            data: { shareAmount: newShare },
          });
        }
      }

      // Reject pending settlements
      await prisma.settlement.updateMany({
        where: { tripId, OR: [{ fromUserId: targetUserId }, { toUserId: targetUserId }], status: 'PENDING' },
        data: { status: 'REJECTED' },
      });
    } else {
      const checkStatus = await this.checkMemberRemovalStatus(tripId, targetUserId);
      if (!checkStatus.canRemoveDirectly) {
        throw new Error(
          `Cannot remove member directly. Unsettled balance: ${checkStatus.netBalance}, Pending settlements: ${checkStatus.pendingSettlementsCount}, Pending expenses: ${checkStatus.pendingExpensesCount}.`
        );
      }
    }

    await prisma.tripMember.delete({
      where: { id: targetMember.id },
    });

    await logActivity(
      tripId,
      adminUserId,
      'MEMBER_REMOVED',
      `${adminUser?.name || 'Admin'} removed ${targetUser.name} from the trip`
    );

    return true;
  },

  async getMemberAnalytics(tripId: string): Promise<MemberAnalytics[]> {
    await ensureDatabaseSeeded();

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: { include: { user: true } },
        expenses: { include: { paidBy: true, participants: { include: { user: true } } } },
      },
    });

    if (!trip) return [];

    const approvedExpenses = trip.expenses.filter((e) => e.status === 'APPROVED');
    const totalTripSpent = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    return trip.members.map((mem) => {
      const u = mem.user;
      let totalPaid = 0;
      let totalOwed = 0;
      let expensesAddedCount = 0;
      let largestExpenseAmount = 0;
      const categoryCounts: Record<string, number> = {};

      approvedExpenses.forEach((e) => {
        if (e.paidById === u.id) {
          totalPaid += e.amount;
        }
        if (e.createdById === u.id) {
          expensesAddedCount++;
          if (e.amount > largestExpenseAmount) largestExpenseAmount = e.amount;
        }
        e.participants.forEach((p) => {
          if (p.userId === u.id) {
            totalOwed += p.shareAmount;
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
          }
        });
      });

      let mostFrequentCategory = 'None';
      let maxCatCount = 0;
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count;
          mostFrequentCategory = cat;
        }
      });

      const percentageSpending = totalTripSpent > 0 ? Math.round((totalPaid / totalTripSpent) * 100) : 0;
      const netBalance = Math.round((totalPaid - totalOwed) * 100) / 100;

      return {
        user: { id: u.id, name: u.name, email: u.email },
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOwed: Math.round(totalOwed * 100) / 100,
        netBalance,
        expensesAddedCount,
        largestExpenseAmount,
        mostFrequentCategory,
        percentageSpending,
      };
    });
  },

  async getUserDocuments(userId: string): Promise<UserDocumentDetail[]> {
    await ensureDatabaseSeeded();
    const docs = await prisma.userDocument.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return docs.map((d) => ({
      id: d.id,
      userId: d.userId,
      documentType: d.documentType as DocumentType,
      documentNo: d.idNumber,
      fileUrl: d.documentUrl,
      fileName: null,
      uploadedAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  },

  async upsertUserDocument(
    userId: string,
    documentType: DocumentType,
    documentNo: string,
    fileUrl: string,
    fileName?: string
  ): Promise<UserDocumentDetail> {
    await ensureDatabaseSeeded();
    const existing = await prisma.userDocument.findFirst({
      where: { userId, documentType },
    });

    let doc;
    if (existing) {
      doc = await prisma.userDocument.update({
        where: { id: existing.id },
        data: {
          idNumber: documentNo,
          documentUrl: fileUrl,
        },
      });
    } else {
      doc = await prisma.userDocument.create({
        data: {
          id: generateObjectId(),
          userId,
          documentType,
          idNumber: documentNo,
          documentUrl: fileUrl,
        },
      });
    }

    return {
      id: doc.id,
      userId: doc.userId,
      documentType: doc.documentType as DocumentType,
      documentNo: doc.idNumber,
      fileUrl: doc.documentUrl,
      fileName: null,
      uploadedAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  },

  async deleteUserDocument(documentId: string, userId: string): Promise<boolean> {
    await ensureDatabaseSeeded();
    const doc = await prisma.userDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.userId !== userId) return false;
    await prisma.userDocument.delete({ where: { id: documentId } });
    return true;
  },

  async getMemberDocumentsForAdmin(
    requesterUserId: string,
    targetUserId: string,
    tripId: string
  ): Promise<UserDocumentDetail[]> {
    await ensureDatabaseSeeded();
    // Security Authorization Rule: Requester must be target user OR requester must be ADMIN/Super Host in the specified trip
    if (requesterUserId !== targetUserId) {
      const requesterMembership = await prisma.tripMember.findFirst({
        where: { tripId, userId: requesterUserId },
      });
      if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
        throw new Error('Forbidden: Only Super Host / Trip Admin can access member documents.');
      }
      const targetMembership = await prisma.tripMember.findFirst({
        where: { tripId, userId: targetUserId },
      });
      if (!targetMembership) {
        throw new Error('Member not found in this trip.');
      }
    }
    return this.getUserDocuments(targetUserId);
  },

  async approveExpense(expenseId: string, adminUserId: string): Promise<boolean> {
    await ensureDatabaseSeeded();
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: { include: { members: true } } },
    });
    if (!expense) throw new Error('Expense not found');

    const adminMember = expense.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || expense.trip.createdById === adminUserId;
    if (!isAdmin) {
      throw new Error('Forbidden: Only Super Host / Trip Admin can approve expenses.');
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED', rejectionReason: null },
    });

    await logActivity(
      expense.tripId,
      adminUserId,
      'EXPENSE_APPROVED',
      `${adminUser?.name || 'Admin'} approved expense "${expense.title}" (${expense.trip.currency}${expense.amount})`,
      expense.amount,
      expense.category
    );

    return true;
  },

  async rejectExpense(expenseId: string, adminUserId: string, reason?: string): Promise<boolean> {
    await ensureDatabaseSeeded();
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: { include: { members: true } } },
    });
    if (!expense) throw new Error('Expense not found');

    const adminMember = expense.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || expense.trip.createdById === adminUserId;
    if (!isAdmin) {
      throw new Error('Forbidden: Only Super Host / Trip Admin can reject expenses.');
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED', rejectionReason: reason || null },
    });

    await logActivity(
      expense.tripId,
      adminUserId,
      'EXPENSE_REJECTED',
      `${adminUser?.name || 'Admin'} rejected expense "${expense.title}"${reason ? ` (Reason: ${reason})` : ''}`,
      expense.amount,
      expense.category
    );

    return true;
  },

  async resubmitExpense(
    expenseId: string,
    currentUserId: string,
    title: string,
    amount: number,
    category: CategoryType,
    paidById: string,
    participantUserIds: string[],
    receiptUrl?: string | null
  ): Promise<ExpenseDetail> {
    await ensureDatabaseSeeded();

    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: { include: { members: true } } },
    });
    if (!existingExpense) throw new Error('Expense not found');

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser) throw new Error('User not found');

    const memberRole = existingExpense.trip.members.find((m) => m.userId === currentUserId)?.role;
    const isCreator = existingExpense.createdById === currentUserId;
    const isAdmin = memberRole === 'ADMIN' || existingExpense.trip.createdById === currentUserId;

    if (!isCreator && !isAdmin) {
      throw new Error('Forbidden: Only the expense creator can resubmit this expense.');
    }

    const shareAmount = participantUserIds.length > 0 ? amount / participantUserIds.length : 0;
    await prisma.expenseParticipant.deleteMany({ where: { expenseId } });

    const status = isAdmin ? 'APPROVED' : 'PENDING_APPROVAL';

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount,
        category,
        paidById,
        status,
        rejectionReason: null,
        lastUpdatedById: currentUserId,
        receiptUrl: receiptUrl !== undefined ? receiptUrl : existingExpense.receiptUrl,
        participants: {
          create: participantUserIds.map((uid) => ({
            id: generateObjectId(),
            userId: uid,
            shareAmount,
          })),
        },
      },
      include: {
        paidBy: true,
        createdBy: true,
        participants: { include: { user: true } },
      },
    });

    await logActivity(
      existingExpense.tripId,
      currentUserId,
      'EXPENSE_RESUBMITTED',
      `${currentUser.name} resubmitted expense "${title}" (${existingExpense.trip.currency}${amount}) for approval`,
      amount,
      category
    );

    return {
      id: updated.id,
      tripId: updated.tripId,
      title: updated.title,
      amount: updated.amount,
      category: updated.category as CategoryType,
      paidById: updated.paidById,
      paidBy: { id: updated.paidBy.id, name: updated.paidBy.name, email: updated.paidBy.email },
      createdById: updated.createdById,
      createdBy: updated.createdBy ? { id: updated.createdBy.id, name: updated.createdBy.name, email: updated.createdBy.email } : undefined,
      lastUpdatedById: updated.lastUpdatedById,
      status: updated.status as 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED',
      paymentMode: (updated.paymentMode as 'PERSONALLY' | 'WALLET') || 'PERSONALLY',
      rejectionReason: updated.rejectionReason,
      date: updated.date.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      receiptUrl: updated.receiptUrl,
      participants: updated.participants.map((p) => ({
        id: p.id,
        expenseId: p.expenseId,
        userId: p.userId,
        shareAmount: p.shareAmount,
        user: { id: p.user.id, name: p.user.name, email: p.user.email },
      })),
    };
  },

  async submitEditRequest(
    expenseId: string,
    requestedById: string,
    requestType: 'EDIT' | 'DELETE',
    proposedData?: any,
    reason?: string
  ) {
    await ensureDatabaseSeeded();
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: true },
    });
    if (!expense) throw new Error('Expense not found');

    const user = await prisma.user.findUnique({ where: { id: requestedById } });
    if (!user) throw new Error('User not found');

    const requestId = generateObjectId();
    const editReq = await prisma.expenseEditRequest.create({
      data: {
        id: requestId,
        expenseId,
        tripId: expense.tripId,
        requestedById,
        requestType,
        proposedData: proposedData ? JSON.stringify(proposedData) : null,
        reason: reason || null,
        status: 'PENDING',
      },
    });

    await logActivity(
      expense.tripId,
      requestedById,
      'EDIT_REQUEST_SUBMITTED',
      `${user.name} submitted a ${requestType.toLowerCase()} request for approved expense "${expense.title}"`
    );

    return editReq;
  },

  async approveEditRequest(requestId: string, adminUserId: string) {
    await ensureDatabaseSeeded();
    const editReq = await prisma.expenseEditRequest.findUnique({
      where: { id: requestId },
      include: { expense: { include: { trip: { include: { members: true } } } } },
    });
    if (!editReq) throw new Error('Edit request not found');

    const adminMember = editReq.expense.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || editReq.expense.trip.createdById === adminUserId;
    if (!isAdmin) {
      throw new Error('Forbidden: Only Super Host / Trip Admin can approve edit requests.');
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    if (editReq.requestType === 'DELETE') {
      await prisma.expense.delete({ where: { id: editReq.expenseId } });
      await prisma.expenseEditRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      await logActivity(
        editReq.expense.tripId,
        adminUserId,
        'EDIT_REQUEST_APPROVED',
        `${adminUser?.name || 'Admin'} approved deletion request for expense "${editReq.expense.title}"`
      );
    } else if (editReq.requestType === 'EDIT' && editReq.proposedData) {
      const data = JSON.parse(editReq.proposedData);
      const { title, amount, category, paidById, splitBetween, receiptUrl } = data;
      const shareAmount = splitBetween && splitBetween.length > 0 ? amount / splitBetween.length : 0;

      await prisma.expenseParticipant.deleteMany({ where: { expenseId: editReq.expenseId } });

      await prisma.expense.update({
        where: { id: editReq.expenseId },
        data: {
          title,
          amount,
          category,
          paidById,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : editReq.expense.receiptUrl,
          lastUpdatedById: adminUserId,
          participants: {
            create: splitBetween.map((uid: string) => ({
              id: generateObjectId(),
              userId: uid,
              shareAmount,
            })),
          },
        },
      });

      await prisma.expenseEditRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      await logActivity(
        editReq.expense.tripId,
        adminUserId,
        'EDIT_REQUEST_APPROVED',
        `${adminUser?.name || 'Admin'} approved edit request for expense "${title}" (${editReq.expense.trip.currency}${editReq.expense.amount} → ${editReq.expense.trip.currency}${amount})`
      );
    }

    return true;
  },

  async rejectEditRequest(requestId: string, adminUserId: string, reason?: string) {
    await ensureDatabaseSeeded();
    const editReq = await prisma.expenseEditRequest.findUnique({
      where: { id: requestId },
      include: { expense: { include: { trip: { include: { members: true } } } } },
    });
    if (!editReq) throw new Error('Edit request not found');

    const adminMember = editReq.expense.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || editReq.expense.trip.createdById === adminUserId;
    if (!isAdmin) {
      throw new Error('Forbidden: Only Super Host / Trip Admin can reject edit requests.');
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    await prisma.expenseEditRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    await logActivity(
      editReq.expense.tripId,
      adminUserId,
      'EDIT_REQUEST_REJECTED',
      `${adminUser?.name || 'Admin'} rejected ${editReq.requestType.toLowerCase()} request for expense "${editReq.expense.title}"`
    );

    return true;
  },

  async updateTripBudget(tripId: string, adminUserId: string, budget: number | null) {
    return this.updateTripSettings(tripId, adminUserId, { budget });
  },

  async updateTripSettings(
    tripId: string,
    adminUserId: string,
    data: { budget?: number | null; approvalMode?: boolean }
  ) {
    await ensureDatabaseSeeded();
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw new Error('Trip not found');

    const adminMember = trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || trip.createdById === adminUserId;
    if (!isAdmin) {
      throw new Error('Forbidden: Only Super Host / Trip Admin can update trip settings.');
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    const updateData: { budget?: number | null; approvalMode?: boolean } = {};

    if (data.budget !== undefined) {
      updateData.budget = data.budget !== null && data.budget > 0 ? data.budget : null;
    }

    if (data.approvalMode !== undefined) {
      updateData.approvalMode = data.approvalMode;
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
    });

    if (data.approvalMode !== undefined && data.approvalMode !== trip.approvalMode) {
      await logActivity(
        tripId,
        adminUserId,
        'TRIP_UPDATED',
        `${adminUser?.name || 'Admin'} ${data.approvalMode ? 'enabled' : 'disabled'} expense verification workflow`
      );
    }

    if (data.budget !== undefined && data.budget !== trip.budget) {
      await logActivity(
        tripId,
        adminUserId,
        'BUDGET_UPDATED',
        `${adminUser?.name || 'Admin'} updated total trip budget to ${data.budget && data.budget > 0 ? `${trip.currency}${data.budget}` : 'Unlimited'}`
      );
    }

    return true;
  },

  // --- ITINERARY METHODS ---
  async addItineraryItem(
    tripId: string,
    adminUserId: string,
    data: {
      dayNumber?: number;
      date?: string;
      title: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      category?: string;
      order?: number;
    }
  ): Promise<ItineraryItemDetail> {
    await ensureDatabaseSeeded();
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw new Error('Trip not found');

    const adminMember = trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can manage itinerary.');

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    const item = await prisma.itineraryItem.create({
      data: {
        id: generateObjectId(),
        tripId,
        dayNumber: data.dayNumber || 1,
        date: data.date ? new Date(data.date) : null,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        category: data.category || 'Sightseeing',
        order: data.order || 0,
      },
    });

    await logActivity(
      tripId,
      adminUserId,
      'TRIP_UPDATED',
      `${adminUser?.name || 'Admin'} added Day ${item.dayNumber} itinerary item "${item.title}"`
    );

    return {
      id: item.id,
      tripId: item.tripId,
      dayNumber: item.dayNumber,
      date: item.date ? item.date.toISOString() : null,
      title: item.title,
      description: item.description,
      location: item.location,
      startTime: item.startTime,
      endTime: item.endTime,
      category: item.category,
      order: item.order,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  },

  async updateItineraryItem(
    itemId: string,
    adminUserId: string,
    data: {
      dayNumber?: number;
      date?: string;
      title?: string;
      description?: string;
      location?: string;
      startTime?: string;
      endTime?: string;
      category?: string;
      order?: number;
    }
  ): Promise<ItineraryItemDetail> {
    await ensureDatabaseSeeded();
    const item = await prisma.itineraryItem.findUnique({
      where: { id: itemId },
      include: { trip: { include: { members: true } } },
    });
    if (!item) throw new Error('Itinerary item not found');

    const adminMember = item.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || item.trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can edit itinerary.');

    const updated = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        dayNumber: data.dayNumber !== undefined ? data.dayNumber : item.dayNumber,
        date: data.date !== undefined ? (data.date ? new Date(data.date) : null) : item.date,
        title: data.title !== undefined ? data.title : item.title,
        description: data.description !== undefined ? data.description : item.description,
        location: data.location !== undefined ? data.location : item.location,
        startTime: data.startTime !== undefined ? data.startTime : item.startTime,
        endTime: data.endTime !== undefined ? data.endTime : item.endTime,
        category: data.category !== undefined ? data.category : item.category,
        order: data.order !== undefined ? data.order : item.order,
      },
    });

    return {
      id: updated.id,
      tripId: updated.tripId,
      dayNumber: updated.dayNumber,
      date: updated.date ? updated.date.toISOString() : null,
      title: updated.title,
      description: updated.description,
      location: updated.location,
      startTime: updated.startTime,
      endTime: updated.endTime,
      category: updated.category,
      order: updated.order,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async deleteItineraryItem(itemId: string, adminUserId: string): Promise<boolean> {
    await ensureDatabaseSeeded();
    const item = await prisma.itineraryItem.findUnique({
      where: { id: itemId },
      include: { trip: { include: { members: true } } },
    });
    if (!item) return false;

    const adminMember = item.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || item.trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can delete itinerary item.');

    await prisma.itineraryItem.delete({ where: { id: itemId } });
    return true;
  },

  // --- STAY METHODS ---
  async addStayDetail(
    tripId: string,
    adminUserId: string,
    data: {
      name: string;
      address?: string;
      checkIn?: string;
      checkOut?: string;
      checkInTime?: string;
      checkOutTime?: string;
      bookingRef?: string;
      bookingUrl?: string;
      contactPhone?: string;
      notes?: string;
    }
  ): Promise<StayDetail> {
    await ensureDatabaseSeeded();
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw new Error('Trip not found');

    const adminMember = trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can manage stay details.');

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    const stay = await prisma.stayDetail.create({
      data: {
        id: generateObjectId(),
        tripId,
        name: data.name,
        address: data.address || null,
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
        checkInTime: data.checkInTime || null,
        checkOutTime: data.checkOutTime || null,
        bookingRef: data.bookingRef || null,
        bookingUrl: data.bookingUrl || null,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
      },
    });

    await logActivity(
      tripId,
      adminUserId,
      'TRIP_UPDATED',
      `${adminUser?.name || 'Admin'} added stay accommodation details for "${stay.name}"`
    );

    return {
      id: stay.id,
      tripId: stay.tripId,
      name: stay.name,
      address: stay.address,
      checkIn: stay.checkIn ? stay.checkIn.toISOString() : null,
      checkOut: stay.checkOut ? stay.checkOut.toISOString() : null,
      checkInTime: stay.checkInTime,
      checkOutTime: stay.checkOutTime,
      bookingRef: stay.bookingRef,
      bookingUrl: stay.bookingUrl,
      contactPhone: stay.contactPhone,
      notes: stay.notes,
      createdAt: stay.createdAt.toISOString(),
      updatedAt: stay.updatedAt.toISOString(),
    };
  },

  async updateStayDetail(
    stayId: string,
    adminUserId: string,
    data: {
      name?: string;
      address?: string;
      checkIn?: string;
      checkOut?: string;
      checkInTime?: string;
      checkOutTime?: string;
      bookingRef?: string;
      bookingUrl?: string;
      contactPhone?: string;
      notes?: string;
    }
  ): Promise<StayDetail> {
    await ensureDatabaseSeeded();
    const stay = await prisma.stayDetail.findUnique({
      where: { id: stayId },
      include: { trip: { include: { members: true } } },
    });
    if (!stay) throw new Error('Stay detail record not found');

    const adminMember = stay.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || stay.trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can edit stay details.');

    const updated = await prisma.stayDetail.update({
      where: { id: stayId },
      data: {
        name: data.name !== undefined ? data.name : stay.name,
        address: data.address !== undefined ? data.address : stay.address,
        checkIn: data.checkIn !== undefined ? (data.checkIn ? new Date(data.checkIn) : null) : stay.checkIn,
        checkOut: data.checkOut !== undefined ? (data.checkOut ? new Date(data.checkOut) : null) : stay.checkOut,
        checkInTime: data.checkInTime !== undefined ? data.checkInTime : stay.checkInTime,
        checkOutTime: data.checkOutTime !== undefined ? data.checkOutTime : stay.checkOutTime,
        bookingRef: data.bookingRef !== undefined ? data.bookingRef : stay.bookingRef,
        bookingUrl: data.bookingUrl !== undefined ? data.bookingUrl : stay.bookingUrl,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone : stay.contactPhone,
        notes: data.notes !== undefined ? data.notes : stay.notes,
      },
    });

    return {
      id: updated.id,
      tripId: updated.tripId,
      name: updated.name,
      address: updated.address,
      checkIn: updated.checkIn ? updated.checkIn.toISOString() : null,
      checkOut: updated.checkOut ? updated.checkOut.toISOString() : null,
      checkInTime: updated.checkInTime,
      checkOutTime: updated.checkOutTime,
      bookingRef: updated.bookingRef,
      bookingUrl: updated.bookingUrl,
      contactPhone: updated.contactPhone,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async deleteStayDetail(stayId: string, adminUserId: string): Promise<boolean> {
    await ensureDatabaseSeeded();
    const stay = await prisma.stayDetail.findUnique({
      where: { id: stayId },
      include: { trip: { include: { members: true } } },
    });
    if (!stay) return false;

    const adminMember = stay.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || stay.trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can delete stay details.');

    await prisma.stayDetail.delete({ where: { id: stayId } });
    return true;
  },



  // --- LIVE POLLS METHODS ---
  async createPoll(
    tripId: string,
    adminUserId: string,
    question: string,
    category: string = 'General',
    optionsTextArray: string[]
  ): Promise<PollDetail> {
    await ensureDatabaseSeeded();
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw new Error('Trip not found');

    const adminMember = trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can create live polls.');

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!adminUser) throw new Error('Admin user not found');

    if (!question || !question.trim()) {
      throw new Error('Poll question / title cannot be empty.');
    }

    const validOptions = optionsTextArray.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      throw new Error('A live poll must have at least 2 valid options.');
    }

    const pollId = generateObjectId();

    const poll = await prisma.poll.create({
      data: {
        id: pollId,
        tripId,
        createdById: adminUserId,
        question: question.trim(),
        category: category.trim() || 'General',
        isClosed: false,
        options: {
          create: validOptions.map((text) => ({
            id: generateObjectId(),
            text,
          })),
        },
      },
      include: {
        createdBy: true,
        options: { include: { votes: { include: { user: true } } } },
      },
    });

    await logActivity(
      tripId,
      adminUserId,
      'POLL_CREATED',
      `${adminUser.name} created live poll "${question.trim()}" (${validOptions.length} options)`
    );

    return {
      id: poll.id,
      tripId: poll.tripId,
      createdById: poll.createdById,
      createdBy: { id: adminUser.id, name: adminUser.name, email: adminUser.email },
      question: poll.question,
      category: poll.category,
      isClosed: poll.isClosed,
      totalVotes: 0,
      options: poll.options.map((o) => ({
        id: o.id,
        pollId: o.pollId,
        text: o.text,
        voteCount: 0,
        percentage: 0,
        votes: [],
        votedByCurrentUser: false,
      })),
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    };
  },

  async voteInPoll(
    tripId: string,
    userId: string,
    pollId: string,
    optionId: string
  ): Promise<boolean> {
    await ensureDatabaseSeeded();
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });
    if (!poll || poll.tripId !== tripId) throw new Error('Poll not found');

    if (poll.isClosed) {
      throw new Error('This live poll has been closed by the organizer. Further voting is disabled.');
    }

    const targetOption = poll.options.find((o) => o.id === optionId);
    if (!targetOption) throw new Error('Invalid option selected');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Upsert vote (User can change their vote to another option in the same poll)
    const existingVote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });

    if (existingVote) {
      await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId },
      });
    } else {
      await prisma.pollVote.create({
        data: {
          id: generateObjectId(),
          pollId,
          optionId,
          userId,
        },
      });
    }

    await logActivity(
      tripId,
      userId,
      'POLL_VOTED',
      `${user.name} voted for "${targetOption.text}" in poll "${poll.question}"`
    );

    return true;
  },

  async closePoll(tripId: string, adminUserId: string, pollId: string, isClosed: boolean = true): Promise<boolean> {
    await ensureDatabaseSeeded();
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { trip: { include: { members: true } } },
    });
    if (!poll || poll.tripId !== tripId) throw new Error('Poll not found');

    const adminMember = poll.trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || poll.trip.createdById === adminUserId;
    if (!isAdmin) throw new Error('Forbidden: Only Super Host / Trip Admin can close or reopen polls.');

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    await prisma.poll.update({
      where: { id: pollId },
      data: { isClosed, updatedAt: new Date() },
    });

    await logActivity(
      tripId,
      adminUserId,
      'POLL_CLOSED',
      `${adminUser?.name || 'Admin'} ${isClosed ? 'closed' : 'reopened'} live poll "${poll.question}"`
    );

    return true;
  },

  async getTripPolls(tripId: string, currentUserId?: string): Promise<PollDetail[]> {
    await ensureDatabaseSeeded();
    const polls = await prisma.poll.findMany({
      where: { tripId },
      include: {
        createdBy: true,
        options: {
          include: {
            votes: { include: { user: true } },
          },
        },
        votes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return polls.map((p) => {
      const totalVotes = p.votes.length;
      const userVote = currentUserId ? p.votes.find((v) => v.userId === currentUserId) : null;

      const mappedOptions: PollOptionDetail[] = p.options.map((opt) => {
        const optionVoteCount = opt.votes.length;
        const percentage = totalVotes > 0 ? Math.round((optionVoteCount / totalVotes) * 100) : 0;
        const votedByCurrentUser = currentUserId ? opt.votes.some((v) => v.userId === currentUserId) : false;

        return {
          id: opt.id,
          pollId: opt.pollId,
          text: opt.text,
          voteCount: optionVoteCount,
          percentage,
          votes: opt.votes.map((v) => ({
            id: v.id,
            pollId: v.pollId,
            optionId: v.optionId,
            userId: v.userId,
            user: { id: v.user.id, name: v.user.name, email: v.user.email },
            createdAt: v.createdAt.toISOString(),
          })),
          votedByCurrentUser,
        };
      });

      return {
        id: p.id,
        tripId: p.tripId,
        createdById: p.createdById,
        createdBy: { id: p.createdBy.id, name: p.createdBy.name, email: p.createdBy.email },
        question: p.question,
        category: p.category,
        isClosed: p.isClosed,
        totalVotes,
        options: mappedOptions,
        userVotedOptionId: userVote?.optionId || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  },

  // --- LIVE LOCATION METHODS ---
  async updateMemberLocation(
    tripId: string,
    userId: string,
    latitude: number,
    longitude: number,
    accuracy?: number,
    isSharing: boolean = true
  ): Promise<MemberLocationDetail> {
    await ensureDatabaseSeeded();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const existing = await prisma.memberLocation.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });

    let loc;
    if (existing) {
      loc = await prisma.memberLocation.update({
        where: { id: existing.id },
        data: {
          latitude,
          longitude,
          accuracy: accuracy || null,
          isSharing,
          updatedAt: new Date(),
        },
        include: { user: true },
      });
    } else {
      loc = await prisma.memberLocation.create({
        data: {
          id: generateObjectId(),
          tripId,
          userId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          isSharing,
        },
        include: { user: true },
      });
    }

    if (isSharing && (!existing || !existing.isSharing)) {
      await logActivity(
        tripId,
        userId,
        'LOCATION_SHARED',
        `${user.name} enabled live GPS location sharing`
      );
    }

    return {
      id: loc.id,
      tripId: loc.tripId,
      userId: loc.userId,
      user: { id: loc.user.id, name: loc.user.name, email: loc.user.email },
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      isSharing: loc.isSharing,
      updatedAt: loc.updatedAt.toISOString(),
    };
  },

  async getTripMemberLocations(tripId: string, currentUserId?: string): Promise<MemberLocationDetail[]> {
    await ensureDatabaseSeeded();
    const locations = await prisma.memberLocation.findMany({
      where: { tripId, isSharing: true },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
    });

    let currentUserLoc = currentUserId
      ? locations.find((l) => l.userId === currentUserId)
      : null;

    return locations.map((l) => {
      let distanceKm: number | null = null;

      if (currentUserLoc && currentUserLoc.userId !== l.userId) {
        distanceKm = calculateHaversineDistanceKm(
          currentUserLoc.latitude,
          currentUserLoc.longitude,
          l.latitude,
          l.longitude
        );
      }

      return {
        id: l.id,
        tripId: l.tripId,
        userId: l.userId,
        user: { id: l.user.id, name: l.user.name, email: l.user.email },
        latitude: l.latitude,
        longitude: l.longitude,
        accuracy: l.accuracy,
        isSharing: l.isSharing,
        distanceKm,
        updatedAt: l.updatedAt.toISOString(),
      };
    });
  },

  async getUserProfile(userId: string) {
    await ensureDatabaseSeeded();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      dob: user.dob,
      gender: user.gender,
      isEmailVerified: user.isEmailVerified,
      isMobileVerified: user.isMobileVerified,
      nationality: user.nationality,
      preferredCurrency: user.preferredCurrency || '₹',
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
      travelPreferences: user.travelPreferences,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  },

  async updateUserProfile(userId: string, data: Record<string, any>) {
    await ensureDatabaseSeeded();
    
    // Filter allowed fields
    const allowedKeys = [
      'name',
      'email',
      'mobile',
      'dob',
      'gender',
      'isEmailVerified',
      'isMobileVerified',
      'nationality',
      'preferredCurrency',
      'emergencyContactName',
      'emergencyContactPhone',
      'travelPreferences',
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    if (updateData.email) {
      const existing = await prisma.user.findFirst({
        where: { email: updateData.email, NOT: { id: userId } },
      });
      if (existing) {
        throw new Error('Email address is already in use by another account.');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      mobile: updated.mobile,
      dob: updated.dob,
      gender: updated.gender,
      isEmailVerified: updated.isEmailVerified,
      isMobileVerified: updated.isMobileVerified,
      nationality: updated.nationality,
      preferredCurrency: updated.preferredCurrency || '₹',
      emergencyContactName: updated.emergencyContactName,
      emergencyContactPhone: updated.emergencyContactPhone,
      travelPreferences: updated.travelPreferences,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    await ensureDatabaseSeeded();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect.');

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  },

  async deleteUserAccount(userId: string) {
    await ensureDatabaseSeeded();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Cascades take care of user documents, member locations, etc.
    await prisma.user.delete({ where: { id: userId } });
    return true;
  },
};

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}


