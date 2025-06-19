import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ExpenseList from './components/ExpenseList';
import ProjectDetails from './components/ProjectDetails';
import PaymentList from './components/PaymentList';
import { getProjects } from './api';
import { Project } from './types';
import { Building, BarChart3, FileText, Settings, DollarSign } from 'lucide-react';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const refreshProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };
  useEffect(() => {
    refreshProjects();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <Building className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">Construction Tracker</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link to="/projects" className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  <Building className="h-4 w-4 mr-2" />
                  Projects
                </Link>
                <Link to="/expenses" className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  <FileText className="h-4 w-4 mr-2" />
                  Expenses
                </Link>
                <Link to="/payments" className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payments
                </Link>
                <Link to="/settings" className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Dashboard projects={projects} />} />
            <Route path="/projects" element={<ProjectList projects={projects} refreshProjects={refreshProjects} />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/expenses" element={<ExpenseList projects={projects} />} />
            <Route path="/payments" element={<PaymentList projects={projects} />} />
            <Route path="/settings" element={<div className="p-6 text-center">Settings page coming soon...</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 