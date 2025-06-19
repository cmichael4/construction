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
  fileUrl?: string;
}

export interface ExpenseSplit {
  projectId: string;
  amount: number;
  percentage: number;
}

export interface Expense {
  id: string;
  projectId: string;  // Primary project (for backwards compatibility)
  splits?: ExpenseSplit[];  // Optional splits between projects
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
  amount: number;
  date: string;
  payer: string;
  method: string;
  note?: string;
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

export interface DashboardData {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalExpenses: number;
  totalPayments: number;
  netCashFlow: number;
  upcomingExpenses: number;
  incurredExpenses: number;
} 