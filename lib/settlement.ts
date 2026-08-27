import { ExpenseDetail, MemberBalance, SettlementRecordDetail, SettlementTransaction, UserSummary } from '@/types';

export function calculateMemberBalances(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[]
): MemberBalance[] {
  const balanceMap = new Map<
    string,
    { user: UserSummary; paid: number; share: number; settlementsPaid: number; settlementsReceived: number }
  >();

  // Initialize for all members
  members.forEach((m) => {
    balanceMap.set(m.user.id, {
      user: m.user,
      paid: 0,
      share: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
    });
  });

  // Calculate paid amounts & share amounts (Only APPROVED expenses count towards financial balances)
  const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED');

  approvedExpenses.forEach((expense) => {
    // The payer is credited with having paid the expense amount (regardless of payment source)
    if (balanceMap.has(expense.paidById)) {
      const payerRecord = balanceMap.get(expense.paidById)!;
      payerRecord.paid += expense.amount;
    }

    // Add to share amount of each participant
    expense.participants?.forEach((p) => {
      if (balanceMap.has(p.userId)) {
        const participantRecord = balanceMap.get(p.userId)!;
        participantRecord.share += p.shareAmount;
      }
    });
  });

  // Track active settlements (CONFIRMED / SETTLED / COMPLETED / PENDING_REVERSAL / REVERSAL_DECLINED_PENDING_HOST)
  // Note: Settlements MUST NOT modify expense paid or share values. They ONLY adjust the net outstanding balance.
  // Reversal status 'REVERSED' automatically excludes the settlement, restoring debt & recalculating Advance Credit.
  if (settlements && settlements.length > 0) {
    const validSettlements = settlements.filter(
      (s) =>
        s.status === 'CONFIRMED' ||
        s.status === 'SETTLED' ||
        s.status === 'PARTIALLY_SETTLED' ||
        s.status === 'COMPLETED' ||
        s.status === 'PENDING_REVERSAL' ||
        s.status === 'REVERSAL_DECLINED_PENDING_HOST' ||
        s.status === 'ROLLBACK_REQUESTED'
    );

    validSettlements.forEach((s) => {
      const effectiveAmount = typeof s.settledAmount === 'number' && s.settledAmount > 0 ? s.settledAmount : s.amount;
      if (balanceMap.has(s.fromUserId)) {
        const fromRecord = balanceMap.get(s.fromUserId)!;
        fromRecord.settlementsPaid += effectiveAmount;
      }
      if (balanceMap.has(s.toUserId)) {
        const toRecord = balanceMap.get(s.toUserId)!;
        toRecord.settlementsReceived += effectiveAmount;
      }
    });
  }

  // Format into MemberBalance list
  const results: MemberBalance[] = [];
  balanceMap.forEach((record) => {
    const netDebtBeforeSettlements = Math.max(0, record.share - record.paid);
    const netSettlementPayments = record.settlementsPaid - record.settlementsReceived;

    let advanceCredit = 0;
    let netBalance = 0;

    if (record.paid > record.share) {
      // Member is an expense payer (gross receivable)
      netBalance = Math.round(((record.paid - record.share) - record.settlementsReceived + record.settlementsPaid) * 100) / 100;
    } else {
      // Member is an expense debtor or even
      if (netSettlementPayments > netDebtBeforeSettlements) {
        advanceCredit = Math.round((netSettlementPayments - netDebtBeforeSettlements) * 100) / 100;
        netBalance = 0;
      } else {
        netBalance = Math.round((-(netDebtBeforeSettlements - netSettlementPayments)) * 100) / 100;
      }
    }

    results.push({
      user: record.user,
      paid: Math.round(record.paid * 100) / 100,
      share: Math.round(record.share * 100) / 100,
      netBalance,
      settlementsPaid: Math.round(record.settlementsPaid * 100) / 100,
      settlementsReceived: Math.round(record.settlementsReceived * 100) / 100,
      advanceCredit,
    });
  });

  return results;
}

export function computeSettlements(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[]
): SettlementTransaction[] {
  const balances = calculateMemberBalances(members, expenses, settlements);

  const debtors: { user: UserSummary; amount: number }[] = [];
  const creditors: { user: UserSummary; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.netBalance < -0.01) {
      debtors.push({ user: b.user, amount: Math.abs(b.netBalance) });
    } else if (b.netBalance > 0.01) {
      creditors.push({ user: b.user, amount: b.netBalance });
    }
  });

  // Sort descending by amount for greedy minimal transfers
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amountToSettle = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(amountToSettle * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        id: `settle-${debtor.user.id}-${creditor.user.id}-${dIdx}-${cIdx}`,
        fromUser: debtor.user,
        toUser: creditor.user,
        amount: roundedAmount,
      });
    }

    debtor.amount -= amountToSettle;
    creditor.amount -= amountToSettle;

    if (debtor.amount < 0.01) {
      dIdx++;
    }
    if (creditor.amount < 0.01) {
      cIdx++;
    }
  }

  return transactions;
}
