import React, { useEffect, useState } from 'react';
import { Payment, Project } from '../types';
import { getPayments, addPayment, editPayment, deletePayment } from '../api';

const initialForm = {
  projectId: '',
  amount: '',
  date: '',
  payer: '',
  method: '',
  note: '',
};

type FormState = typeof initialForm;

type ModalMode = 'add' | 'edit';

interface PaymentListProps {
  projects: Project[];
}

const PaymentList: React.FC<PaymentListProps> = ({ projects }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [adding, setAdding] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const validProjectIds = projects.map(p => p.id);
        const data = await getPayments(validProjectIds);
        setPayments(data);
      } catch (err) {
        setError('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [projects, showModal]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      if (modalMode === 'add') {
        await addPayment({
          projectId: form.projectId,
          amount: Number(form.amount),
          date: form.date,
          payer: form.payer,
          method: form.method,
          note: form.note,
        });
      } else if (modalMode === 'edit' && editId) {
        await editPayment(editId, {
          projectId: form.projectId,
          amount: Number(form.amount),
          date: form.date,
          payer: form.payer,
          method: form.method,
          note: form.note,
        });
      }
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
      setModalMode('add');
    } catch (err) {
      alert('Failed to save payment');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    setForm({
      projectId: payment.projectId,
      amount: payment.amount.toString(),
      date: payment.date,
      payer: payment.payer,
      method: payment.method,
      note: payment.note || '',
    });
    setEditId(payment.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await deletePayment(id);
        setPayments(payments.filter((p) => p.id !== id));
      } catch (err) {
        alert('Failed to delete payment');
      }
    }
  };

  const filteredPayments = filterProject
    ? payments.filter((p) => p.projectId === filterProject)
    : payments;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32 }}>Payments</h1>
        <button
          className="button"
          onClick={() => {
            setShowModal(true);
            setModalMode('add');
            setForm(initialForm);
            setEditId(null);
          }}
        >
          Add Payment
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ marginRight: 8 }}>Filter by Project:</label>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="select">
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      {/* Card layout for payments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>No payments found.</div>
        ) : (
          filteredPayments.map(payment => {
            const project = projects.find(p => p.id === payment.projectId);
            return (
              <div key={payment.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 6 }}>{project ? project.name : 'Unknown Project'}</div>
                {payment.note && <div style={{ color: '#444', fontSize: 15, marginBottom: 8 }}>{payment.note}</div>}
                <div style={{ fontSize: 15, marginBottom: 6 }}><span style={{ fontWeight: 500 }}>$ Amount:</span> {formatCurrency(payment.amount)}</div>
                <div style={{ fontSize: 15, marginBottom: 6 }}><span style={{ fontWeight: 500 }}>🗓️</span> {payment.date}</div>
                <div style={{ fontSize: 15, marginBottom: 6 }}><span style={{ fontWeight: 500 }}>Payer:</span> {payment.payer}</div>
                <div style={{ fontSize: 15, marginBottom: 6 }}><span style={{ fontWeight: 500 }}>Method:</span> {payment.method}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="button" style={{ background: '#fbbf24', color: '#222' }} onClick={() => handleEdit(payment)}>Edit</button>
                  <button className="button" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleDelete(payment.id)}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Modal for Add/Edit Payment */}
      {showModal && (
        <>
          <div className="modal-backdrop" />
          <div className="modal">
            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            <h2 style={{ fontSize: 22, marginBottom: 18 }}>{modalMode === 'add' ? 'Add Payment' : 'Edit Payment'}</h2>
            <form onSubmit={handleAddOrEditPayment}>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleInput}
                required
                className="select"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleInput}
                required
                min={0}
                className="input"
                placeholder="Amount (USD)"
                autoComplete="off"
              />
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleInput}
                required
                className="input"
                placeholder="Date"
                autoComplete="off"
              />
              <input
                type="text"
                name="payer"
                value={form.payer}
                onChange={handleInput}
                required
                className="input"
                placeholder="Payer"
                autoComplete="off"
              />
              <input
                type="text"
                name="method"
                value={form.method}
                onChange={handleInput}
                required
                className="input"
                placeholder="Payment Method (e.g. cash, check)"
                autoComplete="off"
              />
              <textarea
                name="note"
                value={form.note}
                onChange={handleInput}
                rows={2}
                className="textarea"
                placeholder="Note (optional)"
                autoComplete="off"
              />
              <div className="flex flex-center" style={{ marginTop: 18 }}>
                <button
                  type="submit"
                  disabled={adding}
                  className="button"
                  style={{ minWidth: 120 }}
                >
                  {adding ? (modalMode === 'add' ? 'Adding...' : 'Saving...') : (modalMode === 'add' ? 'Add Payment' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentList; 