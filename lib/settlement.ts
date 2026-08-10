import { AdvanceContributionDetail, ExpenseDetail, MemberBalance, SettlementRecordDetail, SettlementTransaction, UserSummary } from '@/types';

export function calculateMemberBalances(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[],
  advanceContributions?: AdvanceContributionDetail[]
): MemberBalance[] {
  const balanceMap = new Map<string, { user: UserSummary; paid: number; share: number }>();

  // Initialize for all members
  members.forEach((m) => {
    balanceMap.set(m.user.id, {
      user: m.user,
      paid: 0,
      share: 0,
    });
  });

  // Calculate paid amounts & share amounts (Only APPROVED expenses count towards financial balances)
  const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED');

  approvedExpenses.forEach((expense) => {
    // Only credit paid amount if expense was paid out of personal money (not from Trip Wallet)
    if (expense.paymentSource !== 'WALLET' && balanceMap.has(expense.paidById)) {
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

  // Incorporate CONFIRMED / COMPLETED settlements
  if (settlements && settlements.length > 0) {
    const confirmedSettlements = settlements.filter(
      (s) => s.status === 'CONFIRMED' || s.status === 'COMPLETED'
    );

    confirmedSettlements.forEach((s) => {
      // fromUser paid money to toUser
      if (balanceMap.has(s.fromUserId)) {
        const fromRecord = balanceMap.get(s.fromUserId)!;
        fromRecord.paid += s.amount;
      }
      if (balanceMap.has(s.toUserId)) {
        const toRecord = balanceMap.get(s.toUserId)!;
        toRecord.share += s.amount;
      }
    });
  }

  // Incorporate APPROVED Advance Contributions
  if (advanceContributions && advanceContributions.length > 0) {
    const approvedContributions = advanceContributions.filter((c) => c.status === 'APPROVED');
    approvedContributions.forEach((c) => {
      if (balanceMap.has(c.userId)) {
        const record = balanceMap.get(c.userId)!;
        record.paid += c.amount;
      }
    });
  }

  // Format into MemberBalance list
  const results: MemberBalance[] = [];
  balanceMap.forEach((record) => {
    const netBalance = Math.round((record.paid - record.share) * 100) / 100;
    results.push({
      user: record.user,
      paid: Math.round(record.paid * 100) / 100,
      share: Math.round(record.share * 100) / 100,
      netBalance,
    });
  });

  return results;
}

export function computeSettlements(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[],
  advanceContributions?: AdvanceContributionDetail[]
): SettlementTransaction[] {
  const balances = calculateMemberBalances(members, expenses, settlements, advanceContributions);

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
