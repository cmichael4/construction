import React, { useState, useEffect } from 'react';
import { Expense, Project, ExpenseSplit } from '../types';
import { getExpenses, addExpense, editExpense, deleteExpense } from '../api';
import { DollarSign, Calendar, Edit, Trash2, Plus, X, Divide } from 'lucide-react';

const initialForm = {
  projectId: '',
  category: 'materials' as Expense['category'],
  description: '',
  amount: '',
  date: '',
  vendor: '',
  approved: false,
  status: 'upcoming' as 'upcoming' | 'incurred',
  splits: [] as ExpenseSplit[],
};

type FormState = typeof initialForm;
type ModalMode = 'add' | 'edit';

const ExpenseList: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState('');
  const [showSplitForm, setShowSplitForm] = useState(false);

  // Only allow valid project IDs
  const validProjectIds = projects.map(p => p.id);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      const data = await getExpenses(validProjectIds);
      setExpenses(data);
      setLoading(false);
    };
    fetchExpenses();
    // eslint-disable-next-line
  }, [showModal, projects.length]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else if (name === 'category') {
      setForm({ ...form, [name]: value as Expense['category'] });
    } else if (name === 'amount') {
      // When amount changes, update all split amounts
      const newAmount = Number(value);
      const updatedSplits = form.splits.map(split => ({
        ...split,
        amount: (newAmount * split.percentage) / 100
      }));
      setForm({ 
        ...form, 
        [name]: value,
        splits: updatedSplits
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSplitAdd = () => {
    const totalSplitPercentage = form.splits.reduce((sum, split) => sum + split.percentage, 0);
    if (totalSplitPercentage >= 100) {
      alert('Total split percentage cannot exceed 100%');
      return;
    }

    const amount = Number(form.amount);
    if (!amount) {
      alert('Please enter the total expense amount first');
      return;
    }

    // Add a new empty split for the secondary project
    setForm(prev => ({
      ...prev,
      splits: [
        ...prev.splits,
        {
          projectId: '',
          amount: 0,
          percentage: 0
        }
      ]
    }));
  };

  const handleSplitRemove = (index: number) => {
    setForm(prev => ({
      ...prev,
      splits: prev.splits.filter((_, i) => i !== index)
    }));
  };

  const handleSplitChange = (index: number, field: keyof ExpenseSplit, value: string) => {
    const splits = [...form.splits];
    const totalAmount = Number(form.amount);

    if (field === 'percentage') {
      // Calculate total percentage excluding the current split
      const otherSplitsTotal = form.splits
        .filter((_, i) => i !== index)
        .reduce((sum, split) => sum + split.percentage, 0);
      
      const maxAllowedPercentage = 100 - otherSplitsTotal;
      const percentage = Math.min(maxAllowedPercentage, Math.max(0, Number(value)));
      
      splits[index] = {
        ...splits[index],
        percentage,
        amount: (totalAmount * percentage) / 100
      };
    } else if (field === 'projectId') {
      splits[index] = {
        ...splits[index],
        projectId: value,
      };
    }

    setForm(prev => ({
      ...prev,
      splits
    }));
  };

  const handleAddOrEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !validProjectIds.includes(form.projectId)) return alert('Please select a valid project');
    
    // Validate splits if they exist
    if (form.splits.length > 0) {
      const totalPercentage = form.splits.reduce((sum, split) => sum + split.percentage, 0);
      if (totalPercentage > 100) {
        return alert('Total split percentage cannot exceed 100%');
      }
      
      // Validate all split projects are valid
      const invalidSplits = form.splits.some(split => !validProjectIds.includes(split.projectId));
      if (invalidSplits) {
        return alert('Please select a project for all splits');
      }

      // Validate that all splits have a project selected
      const emptySplits = form.splits.some(split => !split.projectId);
      if (emptySplits) {
        return alert('Please select a project for all splits');
      }

      // Validate no duplicate project splits
      const projectIds = form.splits.map(split => split.projectId);
      if (new Set(projectIds).size !== projectIds.length) {
        return alert('Each project can only be split once');
      }
    }

    try {
      // Calculate the primary project's split if there are any splits
      let splits = form.splits;
      if (splits.length > 0) {
        const totalSplitPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
        
        // Remove any existing primary project split
        splits = splits.filter(split => split.projectId !== form.projectId);
        
        // Add the primary project's split
        splits.push({
          projectId: form.projectId,
          percentage: 100 - totalSplitPercentage,
          amount: (Number(form.amount) * (100 - totalSplitPercentage)) / 100
        });
      }

      // Prepare the expense data with proper type conversions and optional fields
      const expenseData = {
        projectId: form.projectId,
        category: form.category as Expense['category'],
        description: form.description.trim(),
        amount: Number(form.amount),
        date: form.date,
        status: form.status || 'upcoming',
        approved: Boolean(form.approved),
        ...(form.vendor?.trim() ? { vendor: form.vendor.trim() } : {}),
        ...(splits.length ? {
          splits: splits.map(split => ({
            projectId: split.projectId,
            amount: Number(split.amount),
            percentage: Number(split.percentage)
          }))
        } : {})
      };

      if (modalMode === 'add') {
        await addExpense(expenseData);
      } else if (modalMode === 'edit' && editId) {
        await editExpense(editId, expenseData);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
      setModalMode('add');
      setShowSplitForm(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  const handleEdit = (expense: Expense) => {
    setForm({
      projectId: expense.projectId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      vendor: expense.vendor || '',
      approved: expense.approved,
      status: expense.status || 'upcoming',
      splits: expense.splits || [],
    });
    setEditId(expense.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this expense?')) {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const filteredExpenses = filterProject
    ? expenses.filter(e => e.projectId === filterProject)
    : expenses;

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32 }}>Expenses</h1>
        <button className="button" onClick={() => { setShowModal(true); setModalMode('add'); setForm(initialForm); setEditId(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus style={{ width: 20, height: 20 }} /> New Expense
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <select className="select" name="filterProject" id="filterProject" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="grid grid-3">
        {filteredExpenses.map(expense => (
          <div key={expense.id} className="card">
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{projects.find(p => p.id === expense.projectId)?.name || 'Unknown Project'}</div>
            <div style={{ color: '#444', fontSize: 15, marginBottom: 8 }}>{expense.description}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}><DollarSign style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} /> Amount: ${expense.amount.toLocaleString()}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}><Calendar style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} /> {expense.date}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Category: {expense.category}</div>
            {expense.vendor && <div style={{ fontSize: 14, marginBottom: 8 }}>Vendor: {expense.vendor}</div>}
            <div style={{ fontSize: 14, marginBottom: 8 }}>Status: <span className={`status-badge ${expense.status}`}>{expense.status}</span></div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Approved: {expense.approved ? 'Yes' : 'No'}</div>
            
            {expense.splits && expense.splits.length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#4f46e5', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Divide style={{ width: 16, height: 16 }} /> Split between:
                </div>
                {expense.splits.map((split, index) => (
                  <div key={index} style={{ fontSize: 13, color: '#666', marginLeft: 20, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{projects.find(p => p.id === split.projectId)?.name || 'Unknown Project'}</span>
                    <span style={{ color: '#059669' }}>${split.amount.toFixed(2)} ({split.percentage}%)</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex" style={{ gap: 8 }}>
              <button className="button" onClick={() => handleEdit(expense)} style={{ background: '#fbbf24', color: '#222', display: 'flex', alignItems: 'center', gap: 4 }}><Edit style={{ width: 16, height: 16 }} />Edit</button>
              <button className="button" onClick={() => handleDelete(expense.id)} style={{ background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 style={{ width: 16, height: 16 }} />Delete</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <>
          <div className="modal-backdrop" />
          <div className="modal">
            <button className="close-btn" onClick={() => setShowModal(false)}><X /></button>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>{modalMode === 'add' ? 'Add New Expense' : 'Edit Expense'}</h2>
            <form onSubmit={handleAddOrEditExpense} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Project and Category Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <select 
                    name="projectId" 
                    id="projectId" 
                    value={form.projectId} 
                    onChange={handleInput} 
                    className="select" 
                    style={{ marginBottom: 0 }}
                    required
                  >
                    <option value="">Select Primary Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select 
                    name="category" 
                    id="category" 
                    value={form.category} 
                    onChange={handleInput} 
                    className="select"
                    style={{ marginBottom: 0 }}
                  >
                    <option value="materials">Materials</option>
                    <option value="labor">Labor</option>
                    <option value="equipment">Equipment</option>
                    <option value="permits">Permits</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Description */}
                <input 
                  type="text" 
                  name="description" 
                  id="description" 
                  value={form.description} 
                  onChange={handleInput} 
                  className="input" 
                  style={{ marginBottom: 0 }}
                  placeholder="Description" 
                  required 
                  autoComplete="off" 
                />

                {/* Amount and Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <input 
                    type="number" 
                    name="amount" 
                    id="amount" 
                    value={form.amount} 
                    onChange={handleInput} 
                    className="input" 
                    style={{ marginBottom: 0 }}
                    placeholder="Amount" 
                    required 
                    min={0} 
                    autoComplete="off" 
                  />
                  <input 
                    type="date" 
                    name="date" 
                    id="date" 
                    value={form.date} 
                    onChange={handleInput} 
                    className="input" 
                    style={{ marginBottom: 0 }}
                    required 
                    autoComplete="off" 
                  />
                </div>

                {/* Vendor and Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <input 
                    type="text" 
                    name="vendor" 
                    id="vendor" 
                    value={form.vendor} 
                    onChange={handleInput} 
                    className="input" 
                    style={{ marginBottom: 0 }}
                    placeholder="Vendor (optional)" 
                    autoComplete="off" 
                  />
                  <select 
                    name="status" 
                    id="status" 
                    value={form.status} 
                    onChange={handleInput} 
                    className="select"
                    style={{ marginBottom: 0 }}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="incurred">Incurred</option>
                  </select>
                </div>

                {/* Split Button */}
                <button 
                  type="button" 
                  className="button" 
                  onClick={() => setShowSplitForm(!showSplitForm)}
                  style={{ 
                    background: '#4f46e5', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    justifyContent: 'center',
                    marginTop: 8
                  }}
                >
                  <Divide style={{ width: 16, height: 16 }} />
                  {showSplitForm ? 'Hide Split Form' : 'Split Between Projects'}
                </button>
              </div>

              {showSplitForm && (
                <div className="splits-container" style={{ 
                  marginBottom: 16,
                  background: '#fff',
                  borderRadius: 12,
                  padding: 20
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 12,
                    color: '#4f46e5',
                    fontSize: 16,
                    fontWeight: 500
                  }}>
                    <Divide style={{ width: 20, height: 20 }} />
                    Split Expense
                  </div>
                  
                  {/* Show total allocated percentage */}
                  <div style={{ 
                    marginBottom: 16, 
                    color: '#64748b',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span>Total Allocated:</span>
                    <span style={{ 
                      color: form.splits.reduce((sum, split) => sum + split.percentage, 0) > 100 ? '#ef4444' : '#059669',
                      fontWeight: 500
                    }}>
                      {form.splits.reduce((sum, split) => sum + split.percentage, 0)}%
                    </span>
                  </div>

                  {/* Secondary project splits */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    {form.splits.map((split, index) => (
                      <div key={index} style={{ 
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 100px 40px',
                        alignItems: 'center',
                        gap: 12,
                        padding: 16,
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0'
                      }}>
                        <select 
                          value={split.projectId} 
                          onChange={(e) => handleSplitChange(index, 'projectId', e.target.value)}
                          className="select"
                          style={{ 
                            marginBottom: 0,
                            background: '#fff'
                          }}
                        >
                          <option value="">Select Project</option>
                          {projects
                            .filter(p => p.id !== form.projectId && !form.splits.some((s, i) => i !== index && s.projectId === p.id))
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))
                          }
                        </select>
                        <input
                          type="number"
                          value={split.percentage}
                          onChange={(e) => handleSplitChange(index, 'percentage', e.target.value)}
                          placeholder="%"
                          className="input"
                          style={{ 
                            marginBottom: 0,
                            textAlign: 'right',
                            background: '#fff'
                          }}
                          min="0"
                          max="100"
                        />
                        <div style={{ 
                          color: '#059669',
                          fontSize: 16,
                          textAlign: 'right'
                        }}>
                          ${split.amount.toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSplitRemove(index)}
                          style={{ 
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fee2e2',
                            border: 'none',
                            borderRadius: 8,
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <X style={{ width: 20, height: 20 }} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Show primary project's split last */}
                  <div style={{ 
                    padding: 16,
                    background: '#f0f9ff',
                    borderRadius: 12,
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ 
                      color: '#0369a1',
                      marginBottom: 8,
                      fontSize: 16,
                      fontWeight: 500
                    }}>
                      Primary Project's Share
                    </div>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <div style={{ fontSize: 16 }}>
                        {projects.find(p => p.id === form.projectId)?.name}
                      </div>
                      <div style={{ 
                        color: '#0369a1',
                        fontSize: 16,
                        fontWeight: 500,
                        textAlign: 'right'
                      }}>
                        {100 - form.splits.reduce((sum, split) => sum + split.percentage, 0)}%
                      </div>
                      <div style={{ 
                        color: '#0369a1',
                        fontSize: 16,
                        fontWeight: 500,
                        textAlign: 'right'
                      }}>
                        ${((Number(form.amount) * (100 - form.splits.reduce((sum, split) => sum + split.percentage, 0))) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSplitAdd}
                    style={{ 
                      width: '100%',
                      padding: '12px',
                      marginTop: 16,
                      background: '#fff',
                      border: '1px dashed #94a3b8',
                      borderRadius: 12,
                      color: '#4f46e5',
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      opacity: form.splits.reduce((sum, split) => sum + split.percentage, 0) >= 100 ? 0.5 : 1
                    }}
                    disabled={form.splits.reduce((sum, split) => sum + split.percentage, 0) >= 100}
                  >
                    <Plus style={{ width: 20, height: 20 }} />
                    Add Another Split
                  </button>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 16,
                marginTop: 'auto',
                borderTop: '1px solid #e2e8f0',
                paddingTop: 16
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  padding: 8,
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  width: 'fit-content'
                }}>
                  <input 
                    type="checkbox" 
                    name="approved" 
                    id="approved" 
                    checked={form.approved} 
                    onChange={handleInput}
                  /> 
                  Approved
                </label>

                <button 
                  type="submit" 
                  className="button" 
                  style={{ 
                    width: '100%',
                    background: modalMode === 'add' ? '#059669' : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '16px',
                    fontSize: 16,
                    fontWeight: 500,
                    borderRadius: 12
                  }}
                >
                  {modalMode === 'add' ? (
                    <>
                      <Plus style={{ width: 20, height: 20 }} />
                      Save Expense
                    </>
                  ) : (
                    <>
                      <Edit style={{ width: 20, height: 20 }} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseList; 