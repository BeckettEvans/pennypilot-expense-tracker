src/App.jsximport { useState, useEffect, useRef } from 'react';

// Simple HTML-based implementation that doesn't require Firebase
const App = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      backgroundColor: '#0f172a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰 PennyPilot</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#94a3b8' }}>Expense Tracker</h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '2rem' }}>
          Your AI-powered personal finance and budget tracking app is loading.
        </p>
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <p style={{ marginBottom: '1rem' }}>✨ Features</p>
          <ul style={{
            textAlign: 'left',
            display: 'inline-block',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{ marginBottom: '0.5rem' }}>📊 Dashboard & Analytics</li>
            <li style={{ marginBottom: '0.5rem' }}>💳 Expense & Income Tracking</li>
            <li style={{ marginBottom: '0.5rem' }}>🎯 Smart Budget Management</li>
            <li style={{ marginBottom: '0.5rem' }}>🤖 AI Financial Coach</li>
            <li>📈 Spending Predictions</li>
          </ul>
        </div>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid #06b6d4',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading app...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
