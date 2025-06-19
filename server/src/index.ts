import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { projects, expenses, payments, addProject, addExpense, addPayment } from './data';
import { Project, Expense, Payment, ProjectSummary } from './types';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Helper function to calculate project summary
const calculateProjectSummary = (projectId: string): ProjectSummary => {
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const projectExpenses = expenses.filter(e => e.projectId === projectId);
  const projectPayments = payments.filter(p => p.projectId === projectId);

  const totalExpenses = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPayments = projectPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBudget = project.budget - totalExpenses + totalPayments;

  return {
    project,
    totalExpenses,
    totalPayments,
    remainingBudget,
    expenseCount: projectExpenses.length,
    paymentCount: projectPayments.length
  };
};

// Routes

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
app.get('/api/projects/:id', (req, res) => {
  try {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
app.post('/api/projects', (req, res) => {
  try {
    const newProject = addProject(req.body);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project' });
  }
});

// Get project summary
app.get('/api/projects/:id/summary', (req, res) => {
  try {
    const summary = calculateProjectSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(404).json({ error: 'Project not found' });
  }
});

// Get expenses for a project
app.get('/api/projects/:id/expenses', (req, res) => {
  try {
    const projectExpenses = expenses.filter(e => e.projectId === req.params.id);
    res.json(projectExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Add expense to project
app.post('/api/projects/:id/expenses', (req, res) => {
  try {
    const newExpense = addExpense({
      ...req.body,
      projectId: req.params.id
    });
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create expense' });
  }
});

// Get payments for a project
app.get('/api/projects/:id/payments', (req, res) => {
  try {
    const projectPayments = payments.filter(p => p.projectId === req.params.id);
    res.json(projectPayments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Add payment to project
app.post('/api/projects/:id/payments', (req, res) => {
  try {
    const newPayment = addPayment({
      ...req.body,
      projectId: req.params.id
    });
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create payment' });
  }
});

// Get all expenses
app.get('/api/expenses', (req, res) => {
  try {
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get all payments
app.get('/api/payments', (req, res) => {
  try {
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Dashboard summary
app.get('/api/dashboard', (req, res) => {
  try {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const netCashFlow = totalPayments - totalExpenses;

    res.json({
      totalProjects,
      activeProjects,
      totalBudget,
      totalExpenses,
      totalPayments,
      netCashFlow
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Construction Tracker Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
}); 