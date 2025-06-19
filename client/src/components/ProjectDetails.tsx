import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Expense, Payment } from '../types';
import { getProjects, getProjectExpenses, getProjectPayments } from '../api';
import { DollarSign, Calendar, User, CreditCard, CheckCircle, MapPin, FileText, ClipboardCheck, XCircle, Divide } from 'lucide-react';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const projects = await getProjects();
        setAllProjects(projects);
        const found = projects.find(p => p.id === id);
        setProject(found || null);
        if (found) {
          const expenses = await getProjectExpenses(found.id);
          setExpenses(expenses);
          const payments = await getProjectPayments(found.id);
          setPayments(payments);
        }
      } catch (err) {
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex flex-center" style={{ minHeight: '60vh' }}>Loading project details...</div>;
  if (error || !project) return <div className="flex flex-center" style={{ minHeight: '60vh', color: '#b91c1c' }}>{error || 'Project not found'}</div>;

  return (
    <div className="container" style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <Link to="/projects" style={{ color: '#2563eb', textDecoration: 'underline', marginBottom: 24, display: 'inline-block' }}>&larr; Back to Projects</Link>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>{project.name}</h1>
      <div style={{ fontSize: 18, color: '#555', marginBottom: 16 }}>{project.clientName}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        <div style={{ fontSize: 15, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}><MapPin style={{ width: 16, height: 16, color: '#2563eb' }} /><b>Location:</b> {project.location}</div>
        <div style={{ fontSize: 15, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardCheck style={{ width: 16, height: 16, color: '#059669' }} /><b>Status:</b> {project.status}</div>
        <div style={{ fontSize: 15, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar style={{ width: 16, height: 16, color: '#2563eb' }} /><b>Start Date:</b> {project.startDate}</div>
        {project.endDate && <div style={{ fontSize: 15, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar style={{ width: 16, height: 16, color: '#2563eb' }} /><b>End Date:</b> {project.endDate}</div>}
        <div style={{ fontSize: 15, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign style={{ width: 16, height: 16, color: '#059669' }} /><b>Budget:</b> ${project.budget.toLocaleString()}</div>
        <div style={{ fontSize: 15, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}><FileText style={{ width: 16, height: 16, color: '#a21caf' }} /><b>Description:</b> {project.description || <span style={{ color: '#aaa' }}>No description</span>}</div>
      </div>
      {project.fileUrl && <div style={{ marginBottom: 16 }}><a href={project.fileUrl} target="_blank" rel="noopener noreferrer">View Project File</a></div>}
      <h2 style={{ fontSize: 22, margin: '32px 0 12px' }}>Expenses</h2>
      {expenses.length === 0 ? (
        <div style={{ color: '#888' }}>No expenses for this project.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {expenses.map(exp => {
            console.log('Expense splits for', exp.id, exp.splits);
            return (
              <div key={exp.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 20, marginBottom: 0, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, marginBottom: 4, color: '#222' }}>
                    <User style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4, color: '#2563eb' }} />
                    <b>{exp.vendor || 'No vendor'}</b> spent
                    <DollarSign style={{ width: 16, height: 16, verticalAlign: 'middle', margin: '0 2px 0 8px', color: '#059669' }} />
                    <b>
                      {exp.splits && exp.splits.length > 0
                        ? (() => {
                            const split = exp.splits.find(s => s.projectId === id);
                            if (typeof split !== 'undefined' && split.amount != null) {
                              return `$${Number(split.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            } else if (typeof split !== 'undefined') {
                              return `$0.00`;
                            } else {
                              return '';
                            }
                          })()
                        : `$${exp.amount.toLocaleString()}`
                      }
                    </b>
                    {exp.splits && exp.splits.length > 0 && (() => {
                      const split = exp.splits.find(s => s.projectId === id);
                      return typeof split !== 'undefined' ? (
                        <span style={{ color: '#6b7280', fontSize: 14 }}>
                          {` (${split.percentage}% of $${exp.amount.toLocaleString()})`}
                        </span>
                      ) : null;
                    })()}
                    <span style={{ margin: '0 6px' }}>on</span>
                    <FileText style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 2, color: '#a21caf' }} />
                    <b>{exp.category}</b>
                    <span style={{ margin: '0 6px' }}>for</span>
                    <span style={{ fontWeight: 500 }}>{exp.description}</span>
                    <span style={{ margin: '0 6px' }}>on</span>
                    <Calendar style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 2, color: '#2563eb' }} />
                    <b>{exp.date}</b>
                  </div>
                  {exp.splits && exp.splits.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 14, color: '#4b5563', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                      <div style={{ marginBottom: 4, fontWeight: 500, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Divide style={{ width: 16, height: 16 }} /> Split between:
                      </div>
                      {exp.splits.map((split, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 24, marginBottom: 2 }}>
                          <span>{allProjects.find((p: Project) => p.id === split.projectId)?.name || 'Unknown Project'}</span>
                          <span style={{ color: '#059669' }}>${split.amount.toFixed(2)} ({split.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <h2 style={{ fontSize: 22, margin: '32px 0 12px' }}>Payments</h2>
      {payments.length === 0 ? (
        <div style={{ color: '#888' }}>No payments for this project.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {payments.map(pay => (
            <div key={pay.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 20, marginBottom: 0, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <CheckCircle style={{ color: '#10b981', width: 28, height: 28, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 16, marginBottom: 4, color: '#222' }}>
                  <User style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4, color: '#2563eb' }} />
                  <b>{pay.payer}</b> paid
                  <DollarSign style={{ width: 16, height: 16, verticalAlign: 'middle', margin: '0 2px 0 8px', color: '#059669' }} />
                  <b>${pay.amount.toLocaleString()}</b>
                  <span style={{ margin: '0 6px' }}>by</span>
                  <CreditCard style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 2, color: '#a21caf' }} />
                  <b>{pay.method}</b>
                  <span style={{ margin: '0 6px' }}>on</span>
                  <Calendar style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 2, color: '#2563eb' }} />
                  <b>{pay.date}</b>
                </div>
                {pay.note && <div style={{ color: '#666', fontSize: 15, fontStyle: 'italic', marginTop: 4 }}>{pay.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails; 