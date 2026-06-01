import type { ReactNode, ComponentType } from "react";

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  type?: "INCOME" | "EXPENSE" | "INVESTMENT";
}

export interface Transaction {
  id: string;
  date: string;
  description: string | null;
  amount: number | string;
  type: "INCOME" | "EXPENSE";
  source: string | null;
  isAutoTracked: boolean;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  categoryId: string | null;
  category?: Category | null;
  isReminderEnabled?: boolean;
  paidAt?: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  categoryId: string | null;
  category?: Category | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ACHIEVED" | "CANCELLED";
  createdAt: string;
}

export interface Investment {
  id: string;
  userId?: string;
  categoryId: string;
  totalAmount: number | string;
  category: Category;
  createdAt: string;
}

export interface Allocation {
  id: string;
  categoryId: string;
  category: Category;
  amount: number | string;
  allocationDate: string;
  note: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface FriendUser {
  id: string;
  username: string;
  email: string;
}

export interface Friend {
  id: string;
  user1: FriendUser;
  user2: FriendUser;
  status: "PENDING" | "ACCEPTED";
  createdAt: string;
}

export interface SplitBill {
  id: string;
  creatorId: string;
  description: string;
  totalAmount: number;
  date: string;
  status: "PENDING" | "PARTIALLY_PAID" | "SETTLED";
  participants: Participant[];
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  amount: number;
  status: "PENDING" | "PAID";
}

export interface SavingPoint {
  id: string;
  budgetId: string;
  savingAmount: number;
  createdAt: string;
  budget?: { amount: number; category?: { name: string } };
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  amount: number;
  description: string;
  dueDate: string | null;
  status: "PENDING" | "PAID" | "OVERDUE";
  type: "OWED" | "OWING";
  createdAt: string;
}

export interface DebtPoint {
  id: string;
  budgetId: string;
  debtAmount: number;
  budget?: { id: string; categoryId: string | null; category: Category | null; amount: number };
}

export interface EmailTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  source: string;
  sourceId: string;
  isAutoTracked: boolean;
}

export interface ScannedItem {
  item: string;
  price: number;
  quantity?: number;
}

// UI Component Props
export interface SkeletonProps {
  className?: string;
}

export interface SkeletonCardProps {
  className?: string;
  children: ReactNode;
}

export interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  min?: string;
  max?: string;
}

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  image?: string;
}

export interface EmptyStateIllustrationProps {
  className?: string;
}

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  isSuccess?: boolean;
  successMessage?: string;
}

export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  textClassName?: string;
  showPercentage?: boolean;
}

export type Status = "paid" | "pending" | "overdue" | "cancelled";

export interface StatusBadgeProps {
  status: Status;
  className?: string;
}

// App / Domain Types
export interface User {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
  createdAt?: string;
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface InvestmentData {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  platform: string;
  totalValue: number;
  totalInvested: number;
  gainLoss: number;
  gainLossPercent: number;
  lastUpdated: string;
}

export interface InvestmentCardProps {
  data: InvestmentData;
  onAddTransaction?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface FriendRequest {
  id: string;
  sender: FriendUser;
  receiver: FriendUser;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  createdAt: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

// Validation
export interface ValidationError {
  field: string;
  message: string;
}

export type ValidatorFn = (value: unknown) => string | null;
