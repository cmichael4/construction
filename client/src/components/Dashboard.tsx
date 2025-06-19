import React, { useState, useEffect } from 'react';
import { DashboardData, Project, Expense, Payment } from '../types';
import { getDashboardData, getProjects, getProjectExpenses, getProjectPayments } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC<{ projects?: Project[] }> = ({ projects: projectsProp }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>(projectsProp || []);
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (selectedProject && projects.length > 0) {
        // Show dashboard for just one project
        const project = projects.find(p => p.id === selectedProject);
        if (!project) return;
        const expenses = await getProjectExpenses(project.id);
        const payments = await getProjectPayments(project.id);

        // Calculate total expenses including splits
        const totalExpenses = expenses.reduce((sum, e) => {
          // If expense has splits, only count the portion for this project
          if (e.splits && e.splits.length > 0) {
            const projectSplit = e.splits.find(s => s.projectId === project.id);
            return sum + (projectSplit ? projectSplit.amount : 0);
          }
          // If no splits and this is the primary project, count full amount
          return sum + (e.projectId === project.id ? e.amount : 0);
        }, 0);

        const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Calculate upcoming and incurred expenses with splits
        const upcomingExpenses = expenses
          .filter(e => e.status === 'upcoming')
          .reduce((sum, e) => {
            if (e.splits && e.splits.length > 0) {
              const projectSplit = e.splits.find(s => s.projectId === project.id);
              return sum + (projectSplit ? projectSplit.amount : 0);
            }
            return sum + (e.projectId === project.id ? e.amount : 0);
          }, 0);

        const incurredExpenses = expenses
          .filter(e => e.status === 'incurred')
          .reduce((sum, e) => {
            if (e.splits && e.splits.length > 0) {
              const projectSplit = e.splits.find(s => s.projectId === project.id);
              return sum + (projectSplit ? projectSplit.amount : 0);
            }
            return sum + (e.projectId === project.id ? e.amount : 0);
          }, 0);
        
        setDashboard({
          totalProjects: 1,
          activeProjects: project.status === 'active' ? 1 : 0,
          totalBudget: project.budget,
          totalExpenses,
          totalPayments,
          netCashFlow: totalPayments - totalExpenses,
          upcomingExpenses,
          incurredExpenses
        });
      } else {
        // Show dashboard for all projects
        // First get all expenses and calculate splits correctly
        const allExpenses = await Promise.all(
          projects.map(p => getProjectExpenses(p.id))
        );
        
        // Flatten expenses array
        const flatExpenses = allExpenses.flat();
        
        // Calculate total expenses considering splits
        const totalExpenses = projects.reduce((total, project) => {
          const projectExpenses = flatExpenses.reduce((sum, e) => {
            if (e.splits && e.splits.length > 0) {
              const projectSplit = e.splits.find(s => s.projectId === project.id);
              return sum + (projectSplit ? projectSplit.amount : 0);
            }
            return sum + (e.projectId === project.id ? e.amount : 0);
          }, 0);
          return total + projectExpenses;
        }, 0);

        // Calculate upcoming and incurred expenses with splits
        const upcomingExpenses = projects.reduce((total, project) => {
          const projectUpcoming = flatExpenses
            .filter(e => e.status === 'upcoming')
            .reduce((sum, e) => {
              if (e.splits && e.splits.length > 0) {
                const projectSplit = e.splits.find(s => s.projectId === project.id);
                return sum + (projectSplit ? projectSplit.amount : 0);
              }
              return sum + (e.projectId === project.id ? e.amount : 0);
            }, 0);
          return total + projectUpcoming;
        }, 0);

        const incurredExpenses = projects.reduce((total, project) => {
          const projectIncurred = flatExpenses
            .filter(e => e.status === 'incurred')
            .reduce((sum, e) => {
              if (e.splits && e.splits.length > 0) {
                const projectSplit = e.splits.find(s => s.projectId === project.id);
                return sum + (projectSplit ? projectSplit.amount : 0);
              }
              return sum + (e.projectId === project.id ? e.amount : 0);
            }, 0);
          return total + projectIncurred;
        }, 0);

        // Get all payments
        const allPayments = await Promise.all(
          projects.map(p => getProjectPayments(p.id))
        );
        const totalPayments = allPayments.flat().reduce((sum, p) => sum + (p.amount || 0), 0);

        setDashboard({
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
          totalExpenses,
          totalPayments,
          netCashFlow: totalPayments - totalExpenses,
          upcomingExpenses,
          incurredExpenses
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedProject, projects]);

  useEffect(() => {
    if (!projectsProp) {
      getProjects().then(setProjects);
    }
  }, [projectsProp]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Failed to load dashboard</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const profit = dashboard.totalBudget - dashboard.totalExpenses;
  const profitability = dashboard.totalBudget > 0 ? (profit / dashboard.totalBudget) * 100 : 0;

  const cashFlowData = [
    { name: 'Total Budget', value: dashboard.totalBudget, color: '#3b82f6' },
    { name: 'Total Expenses', value: dashboard.totalExpenses, color: '#ef4444' },
    { name: 'Total Payments', value: dashboard.totalPayments, color: '#10b981' },
    { name: 'Profit', value: profit, color: '#f59e42' },
  ];

  const projectStatusData = [
    { name: 'Active', value: dashboard.activeProjects, color: '#10b981' },
    { name: 'Completed', value: dashboard.totalProjects - dashboard.activeProjects, color: '#6b7280' },
  ];

  const paymentProgressData = [
    { name: 'Paid', value: dashboard.totalPayments, color: '#10b981' },
    { name: 'Remaining', value: Math.max(0, dashboard.totalBudget - dashboard.totalPayments), color: '#e5e7eb' },
  ];

  const expenseStatusData = [
    { name: 'Incurred', value: dashboard.incurredExpenses, color: '#ef4444' },
    { name: 'Upcoming', value: dashboard.upcomingExpenses, color: '#f59e42' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Construction Dashboard</h1>
        
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ fontWeight: 500 }}>Project:</label>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="select">
            <option value="">All Projects (Aggregated)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${dashboard.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dashboard.netCashFlow)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cash Flow Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" yAxisId="left">
                  {cashFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Progress Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentProgressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Status Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(dashboard.totalBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payments Received</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(dashboard.totalPayments)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget Utilization</p>
              <p className="text-xl font-semibold text-gray-900">
                {((dashboard.totalExpenses / dashboard.totalBudget) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 