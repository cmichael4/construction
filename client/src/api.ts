import { Project, Expense, Payment, ProjectSummary, DashboardData } from './types';
import { db } from './firebase';
import { storage } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Local Storage Helpers ---
const PROJECTS_KEY = 'construction_projects';
const EXPENSES_KEY = 'construction_expenses';

function loadProjects(): Project[] {
  const data = localStorage.getItem(PROJECTS_KEY);
  if (data) return JSON.parse(data);
  return mockProjects;
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function loadExpenses(): Expense[] {
  const data = localStorage.getItem(EXPENSES_KEY);
  if (data) return JSON.parse(data);
  return mockExpenses;
}

function saveExpenses(expenses: Expense[]) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// Mock Data
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Downtown Office Complex',
    description: 'Construction of a 15-story office building in downtown area',
    startDate: '2024-01-15',
    budget: 2500000,
    status: 'active',
    clientName: 'Metro Development Corp',
    location: '123 Main St, Downtown',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    name: 'Residential Subdivision',
    description: 'Development of 50 single-family homes',
    startDate: '2024-02-01',
    budget: 1800000,
    status: 'active',
    clientName: 'Greenfield Homes',
    location: '456 Oak Ave, Suburbs',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Shopping Center Renovation',
    description: 'Complete renovation of existing shopping center',
    startDate: '2023-11-01',
    endDate: '2024-03-15',
    budget: 800000,
    status: 'completed',
    clientName: 'Retail Properties LLC',
    location: '789 Commerce Blvd',
    createdAt: '2023-10-15T09:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z'
  }
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    projectId: '1',
    category: 'materials',
    description: 'Steel beams for foundation',
    amount: 45000,
    date: '2024-01-20',
    vendor: 'SteelCo Industries',
    approved: true,
    status: 'incurred',
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-01-20T08:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    category: 'labor',
    description: 'Foundation crew - week 1',
    amount: 12000,
    date: '2024-01-22',
    approved: true,
    status: 'incurred',
    createdAt: '2024-01-22T17:00:00Z',
    updatedAt: '2024-01-22T17:00:00Z'
  },
  {
    id: '3',
    projectId: '2',
    category: 'equipment',
    description: 'Excavator rental - 2 weeks',
    amount: 8000,
    date: '2024-02-05',
    vendor: 'Heavy Equipment Rentals',
    approved: true,
    status: 'upcoming',
    createdAt: '2024-02-05T10:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z'
  },
  {
    id: '4',
    projectId: '3',
    category: 'permits',
    description: 'Building permits and inspections',
    amount: 15000,
    date: '2023-11-10',
    approved: true,
    status: 'incurred',
    createdAt: '2023-11-10T14:00:00Z',
    updatedAt: '2023-11-10T14:00:00Z'
  }
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    projectId: '1',
    amount: 500000,
    date: '2024-01-15',
    payer: 'Metro Development Corp',
    method: 'bank-transfer',
    note: 'Initial project payment',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    amount: 45000,
    date: '2024-01-25',
    payer: 'SteelCo Industries',
    method: 'check',
    note: 'Payment for steel beams',
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-01-25T11:00:00Z'
  },
  {
    id: '3',
    projectId: '2',
    amount: 300000,
    date: '2024-02-15',
    payer: 'Greenfield Homes',
    method: 'bank-transfer',
    note: 'Project milestone payment',
    createdAt: '2024-02-15T13:00:00Z',
    updatedAt: '2024-02-15T13:00:00Z'
  }
];

// PROJECTS
export const getProjects = async (): Promise<Project[]> => {
  const snapshot = await getDocs(collection(db, 'projects'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

export const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'projects'), {
    ...project,
    createdAt: now,
    updatedAt: now,
  });
  return { ...project, id: docRef.id, createdAt: now, updatedAt: now };
};

export const editProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  const ref = doc(db, 'projects', id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteProject = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'projects', id));
  // Also delete all expenses for this project
  const q = query(collection(db, 'expenses'), where('projectId', '==', id));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
};

// EXPENSES
export const getExpenses = async (validProjectIds?: string[]): Promise<Expense[]> => {
  let qRef = collection(db, 'expenses');
  let expenses: Expense[] = [];
  const snapshot = await getDocs(qRef);
  expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  if (validProjectIds) {
    expenses = expenses.filter(e => validProjectIds.includes(e.projectId));
  }
  return expenses;
};

export const getProjectExpenses = async (projectId: string, validProjectIds?: string[]): Promise<Expense[]> => {
  // First get all expenses
  const snapshot = await getDocs(collection(db, 'expenses'));
  let expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  
  // Filter expenses to include both:
  // 1. Direct expenses where projectId matches
  // 2. Split expenses where the project is included in splits
  expenses = expenses.filter(expense => {
    // Include if it's a direct expense for this project
    if (expense.projectId === projectId) {
      return true;
    }
    
    // Include if it has splits and this project is in the splits
    if (expense.splits && expense.splits.length > 0) {
      // Check if this project is included in the splits
      const hasSplit = expense.splits.some(split => split.projectId === projectId);
      if (hasSplit) {
        console.log('Found split expense for project', projectId, ':', expense);
      }
      return hasSplit;
    }
    
    return false;
  });

  // Additional validation if validProjectIds is provided
  if (validProjectIds) {
    expenses = expenses.filter(e => {
      // Keep expenses where the primary project is valid
      if (validProjectIds.includes(e.projectId)) return true;
      
      // For split expenses, keep if any split project is valid
      if (e.splits && e.splits.length > 0) {
        return e.splits.some(split => validProjectIds.includes(split.projectId));
      }
      
      return false;
    });
  }

  return expenses;
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> => {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'expenses'), {
    ...expense,
    createdAt: now,
    updatedAt: now,
  });
  return { ...expense, id: docRef.id, createdAt: now, updatedAt: now };
};

export const editExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
  const ref = doc(db, 'expenses', id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'expenses', id));
};

// PAYMENTS
export const getPayments = async (validProjectIds?: string[]): Promise<Payment[]> => {
  let qRef = collection(db, 'payments');
  let payments: Payment[] = [];
  const snapshot = await getDocs(qRef);
  payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  if (validProjectIds) {
    payments = payments.filter(p => validProjectIds.includes(p.projectId));
  }
  return payments;
};

export const getProjectPayments = async (projectId: string, validProjectIds?: string[]): Promise<Payment[]> => {
  const qRef = query(collection(db, 'payments'), where('projectId', '==', projectId));
  const snapshot = await getDocs(qRef);
  let payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  if (validProjectIds) {
    payments = payments.filter(p => validProjectIds.includes(p.projectId));
  }
  return payments;
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'payments'), {
    ...payment,
    createdAt: now,
    updatedAt: now,
  });
  return { ...payment, id: docRef.id, createdAt: now, updatedAt: now };
};

export const editPayment = async (id: string, updates: Partial<Payment>): Promise<void> => {
  const ref = doc(db, 'payments', id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
};

export const deletePayment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'payments', id));
};

export const getDashboardData = async (): Promise<DashboardData> => {
  // Fetch projects, expenses, and payments from Firestore
  const projectsSnap = await getDocs(collection(db, 'projects'));
  const expensesSnap = await getDocs(collection(db, 'expenses'));
  const paymentsSnap = await getDocs(collection(db, 'payments'));
  const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const netCashFlow = totalPayments - totalExpenses;
  const upcomingExpenses = expenses
    .filter(e => e.status === 'upcoming')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const incurredExpenses = expenses
    .filter(e => e.status === 'incurred')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    totalProjects,
    activeProjects,
    totalBudget,
    totalExpenses,
    totalPayments,
    netCashFlow,
    upcomingExpenses,
    incurredExpenses
  };
};

// Upload a file (e.g., project document or image) to Firebase Storage and return its download URL
export const uploadProjectFile = async (projectId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}; 