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
  mobile?: string | null;
  dob?: string | null;
  gender?: string | null;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  recoveryEmail?: string | null;
  isRecoveryEmailVerified?: boolean;
  nationality?: string | null;
  preferredCurrency?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  travelPreferences?: string | null;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  dob?: string | null;
  gender?: string | null;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  recoveryEmail?: string | null;
  isRecoveryEmailVerified?: boolean;
  nationality?: string | null;
  preferredCurrency?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  travelPreferences?: string | null;
}

export interface UserProfileDetail extends UserSummary {
  createdAt?: string;
  updatedAt?: string;
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
  paymentMode: 'PERSONALLY' | 'WALLET';
  walletTransactionId?: string | null;
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
    | 'SETTLEMENT_ROLLBACK_REQUESTED'
    | 'SETTLEMENT_ROLLBACK_APPROVED'
    | 'SETTLEMENT_ROLLBACK_REJECTED'
    | 'MEMBER_REMOVED'
    | 'POLL_CREATED'
    | 'POLL_VOTED'
    | 'POLL_CLOSED'
    | 'LOCATION_SHARED'
    | 'TRIP_LOCKED'
    | 'TRIP_UPDATED'
    | 'APPROVAL_MODE_UPDATED'
    | 'WALLET_ADVANCE_SUBMITTED'
    | 'WALLET_ADVANCE_APPROVED'
    | 'WALLET_ADVANCE_REJECTED';
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
  settledAmount?: number;
  remainingAmount?: number | null;
  paymentMethod?: 'PERSONAL' | 'WALLET';
  status: 'PENDING' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'ROLLBACK_REQUESTED' | 'ROLLED_BACK';
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletAdvanceDetail {
  id: string;
  walletId: string;
  userId: string;
  tripId: string;
  user: UserSummary;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string | null;
  approvedById?: string | null;
  approvedBy?: UserSummary | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionDetail {
  id: string;
  walletId: string;
  type: 'ADVANCE_CREDIT' | 'EXPENSE_DEBIT' | 'SETTLEMENT_PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  description?: string | null;
  expenseId?: string | null;
  advanceId?: string | null;
  settlementId?: string | null;
  createdById: string;
  createdBy: UserSummary;
  createdAt: string;
}

export interface UserWalletDetail {
  id: string;
  userId: string;
  tripId: string;
  balance: number;
  totalAdded: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  advances: WalletAdvanceDetail[];
  transactions: WalletTransactionDetail[];
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
  createdAt: string;
  members: TripMemberDetail[];
  expenses: ExpenseDetail[];
  editRequests?: ExpenseEditRequestDetail[];
  activities?: ActivityDetail[];
  settlementRecords?: SettlementRecordDetail[];
  myWallet?: UserWalletDetail | null;
  allWallets?: UserWalletDetail[];
  itinerary?: ItineraryItemDetail[];
  stays?: StayDetail[];
  totalExpense: number;
  userBalance: number;
  userTotalPaid: number;
  userTotalShare: number;
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
  settlementsPaid?: number;
  settlementsReceived?: number;
  advanceCredit?: number;
  totalCreditAdded?: number;
  creditUsed?: number;
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

export interface MessageDetail {
  id: string;
  tripId: string;
  senderId: string;
  sender: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}
