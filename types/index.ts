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
    | 'SETTLEMENT_REJECTED'
    | 'MEMBER_REMOVED'
    | 'ADVANCE_FUND_UPDATED'
    | 'ADVANCE_CONTRIBUTION_SUBMITTED'
    | 'ADVANCE_CONTRIBUTION_APPROVED'
    | 'ADVANCE_CONTRIBUTION_REJECTED'
    | 'WALLET_SPENT'
    | 'POLL_CREATED'
    | 'POLL_VOTED'
    | 'POLL_CLOSED'
    | 'LOCATION_SHARED'
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

export interface ItineraryItemDetail {
  id: string;
  tripId: string;
  dayNumber: number;
  date?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  category?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StayDetail {
  id: string;
  tripId: string;
  name: string;
  address?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  bookingRef?: string | null;
  bookingUrl?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
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
  advanceTargetPerMember?: number | null;
  requireAdvanceVerification?: boolean;
  createdAt: string;
  members: TripMemberDetail[];
  expenses: ExpenseDetail[];
  editRequests?: ExpenseEditRequestDetail[];
  activities?: ActivityDetail[];
  settlementRecords?: SettlementRecordDetail[];
  itinerary?: ItineraryItemDetail[];
  stays?: StayDetail[];
  advanceContributions?: AdvanceContributionDetail[];
  walletTransactions?: WalletTransactionDetail[];
  totalExpense: number;
  userBalance: number;
  userTotalPaid: number;
  userTotalShare: number;
}

export interface AdvanceContributionDetail {
  id: string;
  tripId: string;
  userId: string;
  user: UserSummary;
  amount: number;
  utr?: string | null;
  screenshotUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionDetail {
  id: string;
  tripId: string;
  createdById: string;
  createdBy: UserSummary;
  title: string;
  amount: number;
  category: CategoryType | string;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberAdvanceProgress {
  user: UserSummary;
  targetAmount: number;
  paidAmount: number;
  pendingAmount: number;
  remainingAmount: number;
  percentagePaid: number;
}

export interface TripWalletSummary {
  tripId: string;
  currency: string;
  advanceTargetPerMember: number | null;
  requireAdvanceVerification: boolean;
  totalCollected: number;
  totalSpent: number;
  availableBalance: number;
  memberProgress: MemberAdvanceProgress[];
  pendingContributions: AdvanceContributionDetail[];
  transactions: WalletTransactionDetail[];
  allContributions: AdvanceContributionDetail[];
}

export interface PollVoteDetail {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  user: UserSummary;
  createdAt: string;
}

export interface PollOptionDetail {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
  percentage: number;
  votes: PollVoteDetail[];
  votedByCurrentUser: boolean;
}

export interface PollDetail {
  id: string;
  tripId: string;
  createdById: string;
  createdBy: UserSummary;
  question: string;
  category?: string | null;
  isClosed: boolean;
  totalVotes: number;
  options: PollOptionDetail[];
  userVotedOptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberLocationDetail {
  id: string;
  tripId: string;
  userId: string;
  user: UserSummary;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  isSharing: boolean;
  distanceKm?: number | null;
  updatedAt: string;
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
