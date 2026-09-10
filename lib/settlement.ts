import { ExpenseDetail, MemberBalance, SettlementRecordDetail, SettlementTransaction, UserSummary } from '@/types';
import { calculateTripFinancials } from './financialEngine';

export function calculateMemberBalances(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[]
): MemberBalance[] {
  return calculateTripFinancials(members, expenses, settlements).memberBalances;
}

export function computeSettlements(
  members: { user: UserSummary }[],
  expenses: ExpenseDetail[],
  settlements?: SettlementRecordDetail[]
): SettlementTransaction[] {
  return calculateTripFinancials(members, expenses, settlements).optimalSettlements;
}
