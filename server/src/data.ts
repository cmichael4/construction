import { Project, Expense, Payment } from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory data storage (in a real app, this would be a database)
export let projects: Project[] = [
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

export let expenses: Expense[] = [
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
    status: 'incurred',
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

export let payments: Payment[] = [
  {
    id: '1',
    projectId: '1',
    type: 'client-payment',
    description: 'Initial project payment',
    amount: 500000,
    date: '2024-01-15',
    recipient: 'Metro Development Corp',
    paymentMethod: 'bank-transfer',
    status: 'completed',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    type: 'vendor-payment',
    description: 'Payment to SteelCo Industries',
    amount: 45000,
    date: '2024-01-25',
    recipient: 'SteelCo Industries',
    paymentMethod: 'check',
    status: 'completed',
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-01-25T11:00:00Z'
  },
  {
    id: '3',
    projectId: '2',
    type: 'client-payment',
    description: 'Project milestone payment',
    amount: 300000,
    date: '2024-02-15',
    recipient: 'Greenfield Homes',
    paymentMethod: 'bank-transfer',
    status: 'completed',
    createdAt: '2024-02-15T13:00:00Z',
    updatedAt: '2024-02-15T13:00:00Z'
  }
];

// Helper functions for data manipulation
export const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
  const newProject: Project = {
    ...project,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.push(newProject);
  return newProject;
};

export const addExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense => {
  const newExpense: Expense = {
    ...expense,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  expenses.push(newExpense);
  return newExpense;
};

export const addPayment = (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Payment => {
  const newPayment: Payment = {
    ...payment,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  payments.push(newPayment);
  return newPayment;
}; 