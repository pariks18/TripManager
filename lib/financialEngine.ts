import { ExpenseDetail, MemberBalance, SettlementRecordDetail, SettlementTransaction, UserSummary } from '@/types';

export interface BilateralPairBalance {
  id: string;
  userA: UserSummary;
  userB: UserSummary;
  expensesAtoB: number; // A's share in expenses paid by B
  expensesBtoA: number; // B's share in expenses paid by A
  paymentsAtoB: number; // Settlements/advances paid by A to B
  paymentsBtoA: number; // Settlements/advances paid by B to A
  grossObligationAtoB: number; // expensesAtoB + paymentsBtoA
  grossObligationBtoA: number; // expensesBtoA + paymentsAtoB
  netBalance: number; // positive = A owes B, negative = B owes A
  debtorId: string | null;
  creditorId: string | null;
  amountOwed: number;
  advanceCreditA: number; // Advance credit A holds against B
  advanceCreditB: number; // Advance credit B holds against A
}

export interface TripFinancialState {
  totalSpending: number;
  totalPaidAcrossMembers: number;
  totalShareAcrossMembers: number;
  memberBalances: MemberBalance[];
  pairBalances: BilateralPairBalance[];
  optimalSettlements: SettlementTransaction[];
}

export function calculateTripFinancials(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[]
): TripFinancialState {
  const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED');
  const totalSpending = Math.round(approvedExpenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

  const validSettlements = (settlements || []).filter(
    (s) =>
      s.status === 'CONFIRMED' ||
      s.status === 'SETTLED' ||
      s.status === 'PARTIALLY_SETTLED' ||
      s.status === 'COMPLETED' ||
      s.status === 'PENDING_REVERSAL' ||
      s.status === 'REVERSAL_DECLINED_PENDING_HOST' ||
      s.status === 'ROLLBACK_REQUESTED'
  );

  // 1. Single Member Totals (Paid & Share)
  const memberTotalMap = new Map<string, { user: UserSummary; paid: number; share: number; settlementsPaid: number; settlementsReceived: number }>();
  members.forEach((m) => {
    memberTotalMap.set(m.user.id, {
      user: m.user,
      paid: 0,
      share: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
    });
  });

  approvedExpenses.forEach((exp) => {
    if (exp.payers && exp.payers.length > 0) {
      exp.payers.forEach((p) => {
        if (memberTotalMap.has(p.userId)) {
          memberTotalMap.get(p.userId)!.paid += p.amount;
        }
      });
    } else if (memberTotalMap.has(exp.paidById)) {
      memberTotalMap.get(exp.paidById)!.paid += exp.amount;
    }

    exp.participants?.forEach((p) => {
      if (memberTotalMap.has(p.userId)) {
        memberTotalMap.get(p.userId)!.share += p.shareAmount;
      }
    });
  });

  validSettlements.forEach((s) => {
    const effectiveAmount = typeof s.settledAmount === 'number' && s.settledAmount > 0 ? s.settledAmount : s.amount;
    if (memberTotalMap.has(s.fromUserId)) {
      memberTotalMap.get(s.fromUserId)!.settlementsPaid += effectiveAmount;
    }
    if (memberTotalMap.has(s.toUserId)) {
      memberTotalMap.get(s.toUserId)!.settlementsReceived += effectiveAmount;
    }
  });

  // 2. Pure Bilateral Pair Matrix (Strictly A ↔ B)
  const pairBalances: BilateralPairBalance[] = [];
  const optimalSettlements: SettlementTransaction[] = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const userA = members[i].user;
      const userB = members[j].user;

      let expensesAtoB = 0; // A's share in expenses paid by B
      let expensesBtoA = 0; // B's share in expenses paid by A

      approvedExpenses.forEach((exp) => {
        // Check if B paid this expense
        let bPaidAmount = 0;
        if (exp.payers && exp.payers.length > 0) {
          const bp = exp.payers.find((p) => p.userId === userB.id);
          if (bp) bPaidAmount = bp.amount;
        } else if (exp.paidById === userB.id) {
          bPaidAmount = exp.amount;
        }

        if (bPaidAmount > 0) {
          const ap = exp.participants?.find((p) => p.userId === userA.id);
          if (ap) expensesAtoB += ap.shareAmount;
        }

        // Check if A paid this expense
        let aPaidAmount = 0;
        if (exp.payers && exp.payers.length > 0) {
          const ap = exp.payers.find((p) => p.userId === userA.id);
          if (ap) aPaidAmount = ap.amount;
        } else if (exp.paidById === userA.id) {
          aPaidAmount = exp.amount;
        }

        if (aPaidAmount > 0) {
          const bp = exp.participants?.find((p) => p.userId === userB.id);
          if (bp) expensesBtoA += bp.shareAmount;
        }
      });

      // Sum direct payments between A and B
      let paymentsAtoB = 0;
      let paymentsBtoA = 0;

      validSettlements.forEach((s) => {
        const eff = typeof s.settledAmount === 'number' && s.settledAmount > 0 ? s.settledAmount : s.amount;
        if (s.fromUserId === userA.id && s.toUserId === userB.id) {
          paymentsAtoB += eff;
        } else if (s.fromUserId === userB.id && s.toUserId === userA.id) {
          paymentsBtoA += eff;
        }
      });

      expensesAtoB = Math.round(expensesAtoB * 100) / 100;
      expensesBtoA = Math.round(expensesBtoA * 100) / 100;
      paymentsAtoB = Math.round(paymentsAtoB * 100) / 100;
      paymentsBtoA = Math.round(paymentsBtoA * 100) / 100;

      const grossObligationAtoB = Math.round((expensesAtoB + paymentsBtoA) * 100) / 100;
      const grossObligationBtoA = Math.round((expensesBtoA + paymentsAtoB) * 100) / 100;

      const netBalance = Math.round((grossObligationAtoB - grossObligationBtoA) * 100) / 100;

      let debtorId: string | null = null;
      let creditorId: string | null = null;
      let amountOwed = Math.abs(netBalance);

      let advanceCreditA = 0;
      let advanceCreditB = 0;

      if (netBalance > 0.01) {
        // A owes B
        debtorId = userA.id;
        creditorId = userB.id;
      } else if (netBalance < -0.01) {
        // B owes A
        debtorId = userB.id;
        creditorId = userA.id;
      }

      // Compute pairwise Advance Credit surplus if payments exceed gross expense debt
      const netExpenseDebtAtoB = expensesAtoB - expensesBtoA;
      if (netExpenseDebtAtoB > 0) {
        // A owes B net expense debt
        if (paymentsAtoB > netExpenseDebtAtoB) {
          advanceCreditA = Math.round((paymentsAtoB - netExpenseDebtAtoB) * 100) / 100;
        }
      } else if (netExpenseDebtAtoB < 0) {
        // B owes A net expense debt
        const netExpenseDebtBtoA = Math.abs(netExpenseDebtAtoB);
        if (paymentsBtoA > netExpenseDebtBtoA) {
          advanceCreditB = Math.round((paymentsBtoA - netExpenseDebtBtoA) * 100) / 100;
        }
      } else {
        // Expense debt is zero between A and B
        if (paymentsAtoB > 0) advanceCreditA = paymentsAtoB;
        if (paymentsBtoA > 0) advanceCreditB = paymentsBtoA;
      }

      const pairRecord: BilateralPairBalance = {
        id: `pair-${userA.id}-${userB.id}`,
        userA,
        userB,
        expensesAtoB,
        expensesBtoA,
        paymentsAtoB,
        paymentsBtoA,
        grossObligationAtoB,
        grossObligationBtoA,
        netBalance,
        debtorId,
        creditorId,
        amountOwed,
        advanceCreditA,
        advanceCreditB,
      };

      pairBalances.push(pairRecord);

      if (amountOwed > 0.01 && debtorId && creditorId) {
        const debtorUser = debtorId === userA.id ? userA : userB;
        const creditorUser = creditorId === userA.id ? userA : userB;
        optimalSettlements.push({
          id: `settle-${debtorUser.id}-${creditorUser.id}`,
          fromUser: debtorUser,
          toUser: creditorUser,
          amount: amountOwed,
        });
      }
    }
  }

  // 3. Format MemberBalances list from bilateral state
  const memberBalances: MemberBalance[] = [];
  let totalPaidAcrossMembers = 0;
  let totalShareAcrossMembers = 0;

  memberTotalMap.forEach((record, userId) => {
    const roundedPaid = Math.round(record.paid * 100) / 100;
    const roundedShare = Math.round(record.share * 100) / 100;
    totalPaidAcrossMembers += roundedPaid;
    totalShareAcrossMembers += roundedShare;

    // Sum net position across all pairs involving this user
    let userNetPosition = 0;
    let userAdvanceCredit = 0;

    pairBalances.forEach((pb) => {
      if (pb.userA.id === userId) {
        // For User A: netBalance > 0 means A owes B (negative for A); netBalance < 0 means B owes A (positive for A)
        userNetPosition -= pb.netBalance;
        userAdvanceCredit += pb.advanceCreditA;
      } else if (pb.userB.id === userId) {
        // For User B: netBalance > 0 means A owes B (positive for B); netBalance < 0 means B owes A (negative for B)
        userNetPosition += pb.netBalance;
        userAdvanceCredit += pb.advanceCreditB;
      }
    });

    memberBalances.push({
      user: record.user,
      paid: roundedPaid,
      share: roundedShare,
      netBalance: Math.round(userNetPosition * 100) / 100,
      settlementsPaid: Math.round(record.settlementsPaid * 100) / 100,
      settlementsReceived: Math.round(record.settlementsReceived * 100) / 100,
      advanceCredit: Math.round(userAdvanceCredit * 100) / 100,
    });
  });

  return {
    totalSpending,
    totalPaidAcrossMembers: Math.round(totalPaidAcrossMembers * 100) / 100,
    totalShareAcrossMembers: Math.round(totalShareAcrossMembers * 100) / 100,
    memberBalances,
    pairBalances,
    optimalSettlements,
  };
}

export function validateSettlementPayment(
  fromUserId: string,
  toUserId: string,
  paymentAmount: number,
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlementRecords: SettlementRecordDetail[]
): {
  currentOutstanding: number;
  totalPendingAmount: number;
  remainingPayable: number;
  isValid: boolean;
  errorMessage?: string;
} {
  const financials = calculateTripFinancials(members, expenses, settlementRecords);

  const pairRecord = financials.pairBalances.find(
    (pb) => (pb.userA.id === fromUserId && pb.userB.id === toUserId) || (pb.userA.id === toUserId && pb.userB.id === fromUserId)
  );

  let currentOutstanding = 0;
  if (pairRecord) {
    if (pairRecord.debtorId === fromUserId && pairRecord.creditorId === toUserId) {
      currentOutstanding = pairRecord.amountOwed;
    }
  }

  const pendingRecords = settlementRecords.filter(
    (s) => s.fromUserId === fromUserId && s.toUserId === toUserId && s.status === 'PENDING'
  );
  const totalPendingAmount = Math.round(pendingRecords.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;

  const remainingPayable = Math.max(0, Math.round((currentOutstanding - totalPendingAmount) * 100) / 100);

  if (remainingPayable <= 0.01 && currentOutstanding > 0) {
    return {
      currentOutstanding,
      totalPendingAmount,
      remainingPayable: 0,
      isValid: false,
      errorMessage: `All remaining debt between these members (${currentOutstanding}) is already covered by pending approval requests.`,
    };
  }

  return {
    currentOutstanding,
    totalPendingAmount,
    remainingPayable,
    isValid: true,
  };
}
