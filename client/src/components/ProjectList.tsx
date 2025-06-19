import React, { useState, useEffect } from 'react';
import { Project, Expense } from '../types';
import { getProjects, getProjectExpenses, addProject, uploadProjectFile, deleteProject, getProjectPayments, editProject } from '../api';
import { Building, MapPin, Calendar, DollarSign, Plus, X, Edit, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const initialForm = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: '',
  status: 'active',
  clientName: '',
  location: '',
};

type FormState = typeof initialForm;

type ModalMode = 'add' | 'edit';

const PROJECTS_KEY = 'construction_projects';
function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

type ProjectListProps = { projects: Project[]; refreshProjects: () => Promise<void>; };
const ProjectList: React.FC<ProjectListProps> = ({ projects, refreshProjects }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [expensesByProject, setExpensesByProject] = useState<Record<string, { count: number; total: number }>>({});
  const [paymentsByProject, setPaymentsByProject] = useState<Record<string, { count: number; total: number }>>({});
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExpensesAndPayments = async () => {
      try {
        setLoading(true);
        // Fetch expenses and payments for each project
        const expensesSummary: Record<string, { count: number; total: number }> = {};
        const paymentsSummary: Record<string, { count: number; total: number }> = {};
        for (const project of projects) {
          const expenses: Expense[] = await getProjectExpenses(project.id, projects.map(p => p.id));
          expensesSummary[project.id] = {
            count: expenses.length,
            total: expenses.reduce((sum, e) => {
              if (e.splits && e.splits.length > 0) {
                const split = e.splits.find(s => s.projectId === project.id);
                return sum + (split ? split.amount : 0);
              }
              return sum + (e.projectId === project.id ? e.amount : 0);
            }, 0),
          };
          const payments = await getProjectPayments(project.id, projects.map(p => p.id));
          paymentsSummary[project.id] = {
            count: payments.length,
            total: payments.reduce((sum, p) => sum + p.amount, 0),
          };
        }
        setExpensesByProject(expensesSummary);
        setPaymentsByProject(paymentsSummary);
      } catch (err) {
        setError('Failed to load projects');
        console.error('Projects error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpensesAndPayments();
  }, [projects, adding, showModal]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { background: '#e0fbe0', color: '#187a1d' };
      case 'completed':
        return { background: '#e0e7ff', color: '#3730a3' };
      case 'on-hold':
        return { background: '#fef9c3', color: '#b45309' };
      default:
        return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleAddOrEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      if (modalMode === 'add') {
        let fileUrl: string | undefined = undefined;
        if (file) {
          fileUrl = await uploadProjectFile(Date.now().toString(), file);
        }
        const projectData: any = {
          name: form.name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          budget: Number(form.budget),
          status: form.status as Project['status'],
          clientName: form.clientName,
          location: form.location,
        };
        if (fileUrl) {
          projectData.fileUrl = fileUrl;
        }
        await addProject(projectData);
        await refreshProjects();
      } else if (modalMode === 'edit' && editId) {
        await editProject(editId, {
          name: form.name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          budget: Number(form.budget),
          status: form.status as Project['status'],
          clientName: form.clientName,
          location: form.location,
        });
        await refreshProjects();
      }
      setForm(initialForm);
      setFile(null);
      setShowModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Project save error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      } else {
        try {
          console.error('Error (stringified):', JSON.stringify(err));
        } catch (e) {
          console.error('Error (could not stringify):', err);
        }
      }
      alert('Failed to save project');
    } finally {
      setAdding(false);
      setEditId(null);
      setModalMode('add');
    }
  };

  const handleEdit = (project: Project) => {
    setForm({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate || '',
      budget: project.budget.toString(),
      status: project.status,
      clientName: project.clientName,
      location: project.location,
    });
    setEditId(project.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        await refreshProjects();
      } catch (err) {
        console.error('Failed to delete project:', err);
        alert('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-center" style={{ minHeight: '60vh' }}>
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ color: '#b91c1c' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32 }}>Projects</h1>
        <button
          className="button"
          onClick={() => {
            setShowModal(true);
            setModalMode('add');
            setForm(initialForm);
            setEditId(null);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus style={{ width: 20, height: 20 }} /> New Project
        </button>
      </div>

      {success && (
        <div className="success">Project saved successfully!</div>
      )}

      <div className="grid grid-3">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <div className="flex flex-between" style={{ marginBottom: 16 }}>
              <div className="flex" style={{ alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#e0e7ff', borderRadius: 8, padding: 8 }}>
                  <Building style={{ width: 22, height: 22, color: '#3730a3' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{project.name}</h3>
                  <div style={{ fontSize: 14, color: '#555' }}>{project.clientName}</div>
                </div>
              </div>
              <span style={{ ...getStatusColor(project.status), padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
                {project.status}
              </span>
            </div>
            <div style={{ color: '#444', fontSize: 15, marginBottom: 12 }}>{project.description}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <MapPin style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} /> {project.location}
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <Calendar style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} />
              {formatDate(project.startDate)}
              {project.endDate && ` - ${formatDate(project.endDate)}`}
            </div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
              <DollarSign style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} />
              Budget: {formatCurrency(project.budget)}
            </div>
            {/* Expense and Payment summary */}
            <div style={{ fontSize: 14, marginBottom: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText style={{ width: 16, height: 16 }} />
              {expensesByProject[project.id]?.count || 0} expenses, ${expensesByProject[project.id]?.total?.toLocaleString() || 0} total
              {` | `}
              {paymentsByProject[project.id]?.count || 0} payments, ${paymentsByProject[project.id]?.total?.toLocaleString() || 0} total
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <button className="button" style={{ background: '#f3f4f6', color: '#222' }} onClick={() => navigate(`/projects/${project.id}`)}>View Details</button>
              <button className="button" onClick={() => handleEdit(project)} style={{ background: '#fbbf24', color: '#222', display: 'flex', alignItems: 'center', gap: 4 }}><Edit style={{ width: 16, height: 16 }} />Edit</button>
              <button className="button" onClick={() => handleDelete(project.id)} style={{ background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 style={{ width: 16, height: 16 }} />Delete</button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Building style={{ width: 48, height: 48, color: '#d1d5db', marginBottom: 12 }} />
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No projects yet</h3>
          <div style={{ color: '#666', marginBottom: 16 }}>Get started by creating your first construction project.</div>
          <button className="button" onClick={() => setShowModal(true)}>
            Create Project
          </button>
        </div>
      )}

      {/* Modal for Adding/Editing Project */}
      {showModal && (
        <>
          <div className="modal-backdrop" />
          <div className="modal">
            <button className="close-btn" onClick={() => setShowModal(false)}><X /></button>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>{modalMode === 'add' ? 'Add New Project' : 'Edit Project'}</h2>
            <form onSubmit={handleAddOrEditProject}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInput}
                required
                className="input"
                placeholder="Project Name"
                autoComplete="off"
              />
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleInput}
                required
                className="input"
                placeholder="Client Name"
                autoComplete="off"
              />
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleInput}
                required
                className="input"
                placeholder="Location"
                autoComplete="off"
              />
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleInput}
                required
                className="input"
                placeholder="Start Date"
                autoComplete="off"
              />
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleInput}
                className="input"
                placeholder="End Date"
                autoComplete="off"
              />
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleInput}
                required
                min={0}
                className="input"
                placeholder="Budget (USD)"
                autoComplete="off"
              />
              <select
                name="status"
                value={form.status}
                onChange={handleInput}
                className="select"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows={3}
                className="textarea"
                placeholder="Description"
                autoComplete="off"
              />
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="input"
                style={{ marginTop: 8 }}
              />
              <div className="flex flex-center" style={{ marginTop: 18 }}>
                <button
                  type="submit"
                  disabled={adding}
                  className="button"
                  style={{ minWidth: 120 }}
                >
                  {adding ? (modalMode === 'add' ? 'Adding...' : 'Saving...') : (modalMode === 'add' ? 'Add Project' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectList; 