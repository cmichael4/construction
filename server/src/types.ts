export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  budget: number;
  status: 'active' | 'completed' | 'on-hold';
  clientName: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  projectId: string;
  amount: number;
  percentage: number;
}

export interface Expense {
  id: string;
  projectId: string;
  splits?: ExpenseSplit[];
  category: 'materials' | 'labor' | 'equipment' | 'permits' | 'utilities' | 'other';
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  receiptUrl?: string;
  approved: boolean;
  status: 'upcoming' | 'incurred';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  projectId: string;
  type: 'client-payment' | 'vendor-payment' | 'salary' | 'other';
  description: string;
  amount: number;
  date: string;
  recipient?: string;
  paymentMethod: 'cash' | 'check' | 'bank-transfer' | 'credit-card';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  project: Project;
  totalExpenses: number;
  totalPayments: number;
  remainingBudget: number;
  expenseCount: number;
  paymentCount: number;
} 