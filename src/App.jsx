import { useState, useEffect } from 'react';
import { Trash2, Plus, TrendingUp, Wallet } from 'lucide-react';

const App = () => {
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pennypilot_records') || '[]');
    } catch {
      return [];
    }
  });
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');

  useEffect(() => {
    localStorage.setItem('pennypilot_records', JSON.stringify(records));
  }, [records]);

  const addRecord = (e) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) return;
    
    const newRecord = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toLocaleDateString(),
    };
    
    setRecords([newRecord, ...records]);
    setDescription('');
    setAmount('');
  };

  const deleteRecord = (id) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const income = records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const expenses = records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const balance = income - expenses;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#fff',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💰 PennyPilot</h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Personal Finance Tracker</p>
        </div>

        {/* Dashboard Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Wallet size={24} style={{ color: '#10b981' }} />
              <span style={{ color: '#94a3b8' }}>Income</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              \${income.toFixed(2)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <TrendingUp size={24} style={{ color: '#ef4444' }} />
              <span style={{ color: '#94a3b8' }}>Expenses</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              \${expenses.toFixed(2)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Wallet size={24} style={{ color: balance >= 0 ? '#06b6d4' : '#ef4444' }} />
              <span style={{ color: '#94a3b8' }}>Balance</span>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: balance >= 0 ? '#06b6d4' : '#ef4444',
            }}>
              \${balance.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Add Record Form */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #334155',
          marginBottom: '40px',
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Add Transaction</h2>
          <form onSubmit={addRecord} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Entertainment</option>
                <option>Utilities</option>
                <option>Shopping</option>
                <option>Other</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#06b6d4',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={20} /> Add Transaction
            </button>
          </form>
        </div>

        {/* Transactions List */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '30px',
          borderRadius: '12px',
          border: '1px solid #334155',
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Recent Transactions</h2>
          {records.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
              No transactions yet. Add one to get started!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {records.map((record) => (
                <div
                  key={record.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {record.description}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      {record.category} • {record.date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: record.type === 'income' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {record.type === 'income' ? '+' : '-'}\${record.amount.toFixed(2)}
                    </div>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '5px',
                      }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
