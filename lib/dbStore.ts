import { prisma } from './prisma';
import { generateTripCode, generateObjectId } from './utils';
import { CategoryType, ExpenseDetail, TripSummary, UserSummary, ActivityDetail, SettlementRecordDetail, MemberAnalytics, DocumentType, UserDocumentDetail } from '@/types';

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
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      for (const u of SEED_USERS) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {},
          create: u,
        });
      }
      for (const t of SEED_TRIPS) {
        await prisma.trip.create({ data: t });
      }
      for (const m of SEED_MEMBERS) {
        await prisma.tripMember.create({ data: m });
      }
      for (const e of SEED_EXPENSES) {
        const shareAmount = e.amount / e.participantUserIds.length;
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
      // Seed initial activity
      await prisma.activity.create({
        data: {
          id: generateObjectId(),
          tripId: SEED_TRIPS[0].id,
          userId: SEED_USERS[0].id,
          actionType: 'TRIP_CREATED',
          details: 'Parikshit created Goa Trip 2026',
        },
      });
    }
    isSeedingCompleted = true;
  } catch (err) {
    console.error('[Database Seeder] Failed to seed initial database:', err);
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

  async getUserTrips(userId: string): Promise<TripSummary[]> {
    await ensureDatabaseSeeded();

    const userMemberships = await prisma.tripMember.findMany({
      where: { userId },
      include: {
        trip: {
          include: {
            members: { include: { user: true } },
            expenses: {
              include: {
                paidBy: true,
                createdBy: true,
                participants: { include: { user: true } },
                editRequests: { include: { requestedBy: true } },
              },
            },
            activities: { include: { user: true }, orderBy: { createdAt: 'desc' } },
            settlements: { include: { fromUser: true, toUser: true }, orderBy: { updatedAt: 'desc' } },
          },
        },
      },
    });

    return userMemberships.map((m) => {
      const trip = m.trip;
      const approvedExpenses = trip.expenses.filter((e) => e.status === 'APPROVED');
      const totalExpense = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

      let paid = 0;
      let share = 0;
      approvedExpenses.forEach((e) => {
        if (e.paidById === userId) paid += e.amount;
        e.participants.forEach((p) => {
          if (p.userId === userId) share += p.shareAmount;
        });
      });

      const allEditRequests = trip.expenses.flatMap((e) =>
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
        id: trip.id,
        name: trip.name,
        description: trip.description,
        code: trip.code,
        currency: trip.currency,
        budget: trip.budget || null,
        startDate: trip.startDate ? trip.startDate.toISOString() : null,
        endDate: trip.endDate ? trip.endDate.toISOString() : null,
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
          user: { id: mem.user.id, name: mem.user.name, email: mem.user.email },
        })),
        expenses: trip.expenses.map((e) => ({
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
        })),
        editRequests: allEditRequests,
        activities: trip.activities?.map((a) => ({
          id: a.id,
          tripId: a.tripId,
          userId: a.userId,
          user: { id: a.user.id, name: a.user.name, email: a.user.email },
          actionType: a.actionType as ActivityDetail['actionType'],
          details: a.details,
          amount: a.amount,
          category: a.category,
          createdAt: a.createdAt.toISOString(),
        })),
        settlementRecords: trip.settlements?.map((s) => ({
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
        })),
        totalExpense,
        userBalance: paid - share,
        userTotalPaid: paid,
        userTotalShare: share,
      };
    });
  },

  async getTripById(tripId: string, userId: string): Promise<TripSummary | null> {
    await ensureDatabaseSeeded();

    const directTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: { include: { user: true } },
        expenses: {
          include: {
            paidBy: true,
            createdBy: true,
            participants: { include: { user: true } },
            editRequests: { include: { requestedBy: true } },
          },
        },
        activities: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        settlements: { include: { fromUser: true, toUser: true }, orderBy: { updatedAt: 'desc' } },
      },
    });

    if (!directTrip) return null;

    const approvedExpenses = directTrip.expenses.filter((e) => e.status === 'APPROVED');
    const totalExpense = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    let paid = 0;
    let share = 0;
    approvedExpenses.forEach((e) => {
      if (e.paidById === userId) paid += e.amount;
      e.participants.forEach((p) => {
        if (p.userId === userId) share += p.shareAmount;
      });
    });

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
      members: directTrip.members.map((mem) => ({
        id: mem.id,
        tripId: mem.tripId,
        userId: mem.userId,
        role: mem.role as 'ADMIN' | 'MEMBER',
        joinedAt: mem.joinedAt.toISOString(),
        user: { id: mem.user.id, name: mem.user.name, email: mem.user.email },
      })),
      expenses: directTrip.expenses.map((e) => ({
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
      })),
      editRequests: allEditRequests,
      activities: directTrip.activities?.map((a) => ({
        id: a.id,
        tripId: a.tripId,
        userId: a.userId,
        user: { id: a.user.id, name: a.user.name, email: a.user.email },
        actionType: a.actionType as ActivityDetail['actionType'],
        details: a.details,
        amount: a.amount,
        category: a.category,
        createdAt: a.createdAt.toISOString(),
      })),
      settlementRecords: directTrip.settlements?.map((s) => ({
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
      })),
      totalExpense,
      userBalance: paid - share,
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

  async addExpense(
    tripId: string,
    title: string,
    amount: number,
    category: CategoryType,
    paidById: string,
    createdById: string,
    participantUserIds: string[],
    receiptUrl?: string | null
  ): Promise<ExpenseDetail> {
    await ensureDatabaseSeeded();

    const creatorUser = await prisma.user.findUnique({ where: { id: createdById } });
    if (!creatorUser) throw new Error('Creator user record not found');

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error('Trip not found');

    if (trip.isLocked) {
      throw new Error('Trip is locked by the organizer. New expenses cannot be added.');
    }

    const shareAmount = participantUserIds.length > 0 ? amount / participantUserIds.length : 0;
    const expenseObjectId = generateObjectId();

    // Check expense approval mode
    const status = trip.approvalMode && amount > 5000 ? 'PENDING_APPROVAL' : 'APPROVED';

    const expense = await prisma.expense.create({
      data: {
        id: expenseObjectId,
        tripId,
        title,
        amount,
        category,
        paidById,
        createdById,
        status,
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

    const paidByUser = expense.paidBy?.name || 'Member';
    await logActivity(
      tripId,
      createdById,
      'EXPENSE_ADDED',
      `${creatorUser.name} added expense "${title}" (${trip.currency}${amount}) paid by ${paidByUser}`,
      amount,
      category
    );

    return {
      id: expense.id,
      tripId: expense.tripId,
      title: expense.title,
      amount: expense.amount,
      category: expense.category as CategoryType,
      paidById: expense.paidById,
      paidBy: { id: expense.paidBy.id, name: expense.paidBy.name, email: expense.paidBy.email },
      createdById: expense.createdById,
      createdBy: { id: creatorUser.id, name: creatorUser.name, email: creatorUser.email },
      lastUpdatedById: expense.lastUpdatedById,
      status: expense.status as 'APPROVED' | 'PENDING_APPROVAL',
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      receiptUrl: expense.receiptUrl,
      participants: expense.participants.map((p) => ({
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

    // Security Rule: Only expense creator or Trip Admin can edit!
    const memberRole = existingExpense.trip.members.find((m) => m.userId === currentUserId)?.role;
    const isCreator = existingExpense.createdById === currentUserId;
    const isAdmin = memberRole === 'ADMIN';

    if (!isCreator && !isAdmin) {
      throw new Error('Forbidden: Only the expense creator or trip organizer can edit this expense.');
    }

    if (existingExpense.trip.isLocked) {
      throw new Error('Trip is locked by the organizer. Expenses cannot be updated.');
    }

    const shareAmount = participantUserIds.length > 0 ? amount / participantUserIds.length : 0;
    const oldAmount = existingExpense.amount;

    await prisma.expenseParticipant.deleteMany({ where: { expenseId } });

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount,
        category,
        paidById,
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

    await prisma.expense.delete({ where: { id: expenseId } });

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

    const fromUser = await prisma.user.findUnique({ where: { id: fromUserId } });
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!fromUser || !toUser) throw new Error('Users not found');

    const existing = await prisma.settlement.findFirst({
      where: { tripId, fromUserId, toUserId, status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    let settlement;
    if (existing) {
      settlement = await prisma.settlement.update({
        where: { id: existing.id },
        data: { amount, status, note, updatedAt: new Date() },
        include: { fromUser: true, toUser: true },
      });
    } else {
      settlement = await prisma.settlement.create({
        data: {
          id: generateObjectId(),
          tripId,
          fromUserId,
          toUserId,
          amount,
          status,
          note,
        },
        include: { fromUser: true, toUser: true },
      });
    }

    const actionType = status === 'CONFIRMED' ? 'SETTLEMENT_CONFIRMED' : 'SETTLEMENT_MARKED';
    await logActivity(
      tripId,
      fromUserId,
      actionType,
      `${fromUser.name} ${status === 'CONFIRMED' ? 'confirmed' : 'marked'} settlement of ${amount} to ${toUser.name}`,
      amount
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

    const totalTripSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

    return trip.members.map((mem) => {
      const u = mem.user;
      let totalPaid = 0;
      let totalOwed = 0;
      let expensesAddedCount = 0;
      let largestExpenseAmount = 0;
      const categoryCounts: Record<string, number> = {};

      trip.expenses.forEach((e) => {
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
      documentNo: d.documentNo,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt.toISOString(),
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
          documentNo,
          fileUrl,
          fileName: fileName || null,
        },
      });
    } else {
      doc = await prisma.userDocument.create({
        data: {
          id: generateObjectId(),
          userId,
          documentType,
          documentNo,
          fileUrl,
          fileName: fileName || null,
        },
      });
    }

    return {
      id: doc.id,
      userId: doc.userId,
      documentType: doc.documentType as DocumentType,
      documentNo: doc.documentNo,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      uploadedAt: doc.uploadedAt.toISOString(),
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
    await ensureDatabaseSeeded();
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw new Error('Trip not found');

    const adminMember = trip.members.find((m) => m.userId === adminUserId);
    const isAdmin = adminMember?.role === 'ADMIN' || trip.createdById === adminUserId;
    if (!isAdmin) {
      throw new Error('Forbidden: Only Super Host / Trip Admin can set trip budget.');
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    await prisma.trip.update({
      where: { id: tripId },
      data: { budget: budget && budget > 0 ? budget : null },
    });

    await logActivity(
      tripId,
      adminUserId,
      'BUDGET_UPDATED',
      `${adminUser?.name || 'Admin'} updated total trip budget to ${budget && budget > 0 ? `${trip.currency}${budget}` : 'Unlimited'}`
    );

    return true;
  },
};

