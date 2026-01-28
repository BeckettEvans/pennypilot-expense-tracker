import React, { useState, useEffect } from 'react';
import { Plus, Trash2, BarChart3, Settings, MessageCircle, Award, TrendingUp, Wallet } from 'lucide-react';

const PennyPilot = () => {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('pp_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('pp_budget');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('pp_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('pp_budget', JSON.stringify(budget));
  }, [budget]);

  const addRecord = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) return;

    const newRecord = {
      id: Date.now(),
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
    };

    setRecords([newRecord, ...records]);
    setDescription('');
    setAmount('');
  };

  const deleteRecord = (id) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const totalIncome = records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalExpenses = records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const balance = totalIncome - totalExpenses;

  const expensesByCategory = records
    .filter(r => r.type === 'expense')
    .reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
      return acc;
    }, {});

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '140px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ paddingTop: '24px', paddingBottom: '96px' }}>
            <div style={{ textAlign: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>💰 PennyPilot</h1>
              <p style={{ color: '#06b6d4', fontSize: '18px' }}>Your Personal Finance Companion</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', borderRadius: '12px', padding: '24px', color: '#fff' }}>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>Total Balance</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>CA${balance.toFixed(2)}</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', padding: '24px', color: '#fff' }}>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>Income</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>CA${totalIncome.toFixed(2)}</p>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '12px', padding: '24px', color: '#fff' }}>
                <p style={{ fontSize: '12px', opacity: 0.8 }}>Expenses</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>CA${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{ paddingTop: '24px', paddingBottom: '96px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Expense Breakdown</h2>
            {Object.keys(expensesByCategory).length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: '32px', paddingBottom: '32px' }}>No expenses yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(expensesByCategory).map(([cat, amt]) => (
                  <div key={cat} style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ fontWeight: '600' }}>{cat}</p>
                      <p style={{ color: '#f87171' }}>CA${amt.toFixed(2)}</p>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#475569', borderRadius: '9999px', height: '8px' }}>
                      <div style={{ backgroundColor: '#ef4444', height: '8px', borderRadius: '9999px', width: `${(amt / totalExpenses) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <div style={{ paddingTop: '24px', paddingBottom: '96px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Budgets</h2>
            <input
              type="number"
              placeholder="Set monthly budget limit"
              defaultValue={budget.limit || ''}
              onChange={(e) => setBudget({ ...budget, limit: parseFloat(e.target.value) })}
              style={{ width: '100%', backgroundColor: '#1e293b', color: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #475569', fontSize: '16px', marginBottom: '16px' }}
            />
            {budget.limit && (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <p>Spent vs Budget</p>
                  <p style={{ color: '#06b6d4' }}>CA${totalExpenses.toFixed(2)} / CA${budget.limit.toFixed(2)}</p>
                </div>
                <div style={{ width: '100%', backgroundColor: '#475569', borderRadius: '9999px', height: '12px' }}>
                  <div
                    style={{
                      height: '12px',
                      borderRadius: '9999px',
                      backgroundColor: totalExpenses > budget.limit ? '#ef4444' : '#10b981',
                      width: `${Math.min((totalExpenses / budget.limit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coach Tab */}
        {activeTab === 'coach' && (
          <div style={{ paddingTop: '24px', paddingBottom: '96px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>💡 Financial Insights</h2>
            <div style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)', borderRadius: '8px', padding: '24px', color: '#fff' }}>
              {balance > 0 ? (
                <>
                  <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Great job! 🎉</p>
                  <p style={{ fontSize: '14px' }}>You have a positive balance of CA${balance.toFixed(2)}. Keep up the good savings habits!</p>
                </>
              ) : balance === 0 ? (
                <>
                  <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Perfect Balance</p>
                  <p style={{ fontSize: '14px' }}>Your income equals your expenses. Consider saving for the future!</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Budget Alert</p>
                  <p style={{ fontSize: '14px' }}>You're spending more than you earn. Review your expenses and adjust your budget.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Form */}
      <div style={{
        position: 'fixed',
        bottom: '96px',
        left: 0,
        right: 0,
        backgroundColor: '#0f172a',
        padding: '16px',
        borderTop: '1px solid #334155',
      }}>
        <form onSubmit={addRecord} style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>📝 Add Transaction</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #475569', fontSize: '14px' }} />
            <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" style={{ backgroundColor: '#0f172a', color: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #475569', fontSize: '14px' }} />
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #475569', fontSize: '14px' }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #475569', fontSize: '14px' }}>
              <option>Food</option>
              <option>Transport</option>
              <option>Entertainment</option>
              <option>Utilities</option>
              <option>Shopping</option>
              <option>Other</option>
            </select>
            <button type="submit" style={{ backgroundColor: '#06b6d4', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', padding: '10px' }}>➕ Add</button>
          </div>
        </form>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0f172a',
        borderTop: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-around',
        height: '96px',
        alignItems: 'center',
      }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'analytics', label: '📈 Analytics' },
          { id: 'budgets', label: '💳 Budgets' },
          { id: 'coach', label: '🤖 Coach' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: activeTab === id ? '#06b6d4' : '#6b7280',
              cursor: 'pointer',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === id ? '600' : '400',
              borderBottom: activeTab === id ? '3px solid #06b6d4' : 'none',
              flex: 1,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PennyPilot;
