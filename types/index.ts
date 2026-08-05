export type CategoryType = 
  | 'Food'
  | 'Travel'
  | 'Fuel'
  | 'Stay'
  | 'Entertainment'
  | 'Shopping'
  | 'Miscellaneous';

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface TripMemberDetail {
  id: string;
  tripId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: UserSummary;
}

export interface ExpenseParticipantDetail {
  id: string;
  expenseId: string;
  userId: string;
  shareAmount: number;
  user: UserSummary;
}

export interface ExpenseDetail {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  category: CategoryType;
  paidById: string;
  paidBy: UserSummary;
  createdById?: string | null;
  createdBy?: UserSummary | null;
  lastUpdatedById?: string | null;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  rejectionReason?: string | null;
  date: string;
  createdAt: string;
  updatedAt?: string;
  receiptUrl?: string | null;
  participants: ExpenseParticipantDetail[];
  editRequests?: ExpenseEditRequestDetail[];
}

export interface ExpenseEditRequestDetail {
  id: string;
  expenseId: string;
  requestedById: string;
  requestedBy: UserSummary;
  requestType: 'EDIT' | 'DELETE';
  proposedData?: string | null;
  reason?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  expense?: ExpenseDetail;
}

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'VOTER_ID'
  | 'DRIVING_LICENSE'
  | 'PASSPORT'
  | 'OTHER';

export interface UserDocumentDetail {
  id: string;
  userId: string;
  documentType: DocumentType;
  documentNo?: string | null;
  fileUrl: string;
  fileName?: string | null;
  uploadedAt: string;
  updatedAt?: string;
}

export interface ActivityDetail {
  id: string;
  tripId: string;
  userId: string;
  user: UserSummary;
  actionType: 
    | 'TRIP_CREATED' 
    | 'MEMBER_JOINED' 
    | 'EXPENSE_ADDED' 
    | 'EXPENSE_UPDATED' 
    | 'EXPENSE_DELETED' 
    | 'EXPENSE_APPROVED'
    | 'EXPENSE_REJECTED'
    | 'EXPENSE_RESUBMITTED'
    | 'EDIT_REQUEST_SUBMITTED'
    | 'EDIT_REQUEST_APPROVED'
    | 'EDIT_REQUEST_REJECTED'
    | 'BUDGET_UPDATED'
    | 'SETTLEMENT_MARKED' 
    | 'SETTLEMENT_CONFIRMED'
    | 'TRIP_LOCKED'
    | 'TRIP_UPDATED'
    | 'APPROVAL_MODE_UPDATED';
  details: string;
  amount?: number | null;
  category?: string | null;
  createdAt: string;
}

export interface SettlementRecordDetail {
  id: string;
  tripId: string;
  fromUserId: string;
  fromUser: UserSummary;
  toUserId: string;
  toUser: UserSummary;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED';
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripSummary {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  currency: string;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  createdById?: string | null;
  isLocked: boolean;
  approvalMode: boolean;
  createdAt: string;
  members: TripMemberDetail[];
  expenses: ExpenseDetail[];
  editRequests?: ExpenseEditRequestDetail[];
  activities?: ActivityDetail[];
  settlementRecords?: SettlementRecordDetail[];
  totalExpense: number;
  userBalance: number;
  userTotalPaid: number;
  userTotalShare: number;
}

export interface SettlementTransaction {
  id: string;
  fromUser: UserSummary;
  toUser: UserSummary;
  amount: number;
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
}

export interface MemberBalance {
  user: UserSummary;
  paid: number;
  share: number;
  netBalance: number;
}

export interface MemberAnalytics {
  user: UserSummary;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  expensesAddedCount: number;
  largestExpenseAmount: number;
  mostFrequentCategory: string;
  percentageSpending: number;
}
