import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Minus, Wallet, PieChart, Bell, TrendingUp, TrendingDown, 
  Calendar, DollarSign, Target, AlertCircle, X, Save, Trash2, 
  ChevronRight, ArrowUpRight, ArrowDownLeft, Settings, Sparkles, 
  MessageSquare, Loader2, Camera, Upload, Search, Tag, ShoppingBag, 
  BrainCircuit, Download, Copy, RefreshCw, MoreHorizontal, CreditCard, 
  MessageCircle, Send, Wand2, Calculator, Check, User, Moon, Sun,
  LogOut, Shield, Award, Repeat, Cloud, CloudOff, Palette
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, 
  updateProfile, setPersistence, browserLocalPersistence 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, 
  deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, setDoc, getDoc 
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const apiKey = ""; // Injected by runtime

// --- Helper Functions & API ---
const callGemini = async (prompt, options = {}) => {
  const { imageBase64, useSearch, systemInstruction } = options;
  try {
    const parts = [{ text: prompt }];
    if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
    
    const payload = {
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    };
    if (useSearch) payload.tools = [{ google_search: {} }];
    if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw error;
  }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

// --- Constants ---
const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Food & Dining', color: '#EF4444', icon: '🍔' },
    { id: 'transport', name: 'Transportation', color: '#F59E0B', icon: '🚗' },
    { id: 'housing', name: 'Housing & Utilities', color: '#3B82F6', icon: '🏠' },
    { id: 'entertainment', name: 'Entertainment', color: '#8B5CF6', icon: '🎬' },
    { id: 'shopping', name: 'Shopping', color: '#EC4899', icon: '🛍️' },
    { id: 'health', name: 'Health', color: '#10B981', icon: '💊' },
    { id: 'subscriptions', name: 'Subscriptions', color: '#6366F1', icon: '🔄' },
    { id: 'other', name: 'Other', color: '#6B7280', icon: '📦' },
  ],
  income: [
    { id: 'salary', name: 'Salary', color: '#10B981', icon: '💰' },
    { id: 'freelance', name: 'Freelance', color: '#3B82F6', icon: '💻' },
    { id: 'gift', name: 'Gifts', color: '#F59E0B', icon: '🎁' },
    { id: 'other_income', name: 'Other', color: '#6B7280', icon: '💵' },
  ]
};

const CURRENCIES = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$'
};

const COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B'];

const formatCurrency = (amount, currencyCode = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

// --- Components ---

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all animate-in slide-in-from-top-5 duration-300 ${
    type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
  }`}>
    {type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
    <p className="font-medium text-sm">{message}</p>
    <button onClick={onClose} className="opacity-80 hover:opacity-100"><X size={16} /></button>
  </div>
);

const SimplePieChart = ({ data, dark }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let currentAngle = 0;

  if (total === 0) return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-300 dark:text-slate-600">
      <PieChart size={32} className="mb-2 opacity-50" />
      <p className="text-xs">No data yet</p>
    </div>
  );

  return (
    <div className="relative h-56 w-full flex items-center justify-center">
      <svg viewBox="-100 -100 200 200" className="h-full w-full max-w-[200px] transform -rotate-90 filter drop-shadow-lg">
        {data.map((item) => {
          const sliceAngle = (item.value / total) * 360;
          const x1 = Math.cos((currentAngle * Math.PI) / 180) * 80;
          const y1 = Math.sin((currentAngle * Math.PI) / 180) * 80;
          const x2 = Math.cos(((currentAngle + sliceAngle) * Math.PI) / 180) * 80;
          const y2 = Math.sin(((currentAngle + sliceAngle) * Math.PI) / 180) * 80;
          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          const pathData = `M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          const slice = <path key={item.name} d={pathData} fill={item.color} stroke={dark ? '#0f172a' : 'white'} strokeWidth="3" className="hover:opacity-80 transition-opacity cursor-pointer" />;
          currentAngle += sliceAngle;
          return slice;
        })}
        <circle cx="0" cy="0" r="55" fill={dark ? '#1e293b' : 'white'} />
      </svg>
      <div className="absolute text-center">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Total</p>
        <p className="text-lg font-extrabold text-slate-800 dark:text-white">{formatCurrency(total)}</p>
      </div>
    </div>
  );
};

// 4. Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [currency, setCurrency] = useState('USD');
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced');

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [goals, setGoals] = useState([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSmartBudgetModalOpen, setIsSmartBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({ amount: '', desc: '', cat: 'food', type: 'expense' });
  const [magicInput, setMagicInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Budget States
  const [budgetLimit, setBudgetLimit] = useState('');
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState('');
  const [totalMonthlyLimit, setTotalMonthlyLimit] = useState('');
  const [proposedBudgets, setProposedBudgets] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: "Hi! I'm Penny. I can help you analyze spending or plan a budget." }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Settings
  const [userSettings, setUserSettings] = useState({ 
    displayName: 'Pilot', 
    avatarColor: '#10B981',
    monthlyBudget: '' 
  });

  // --- Auth & Initial Load ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error(e); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if(u) {
          setUserSettings(prev => ({
              ...prev, 
              displayName: u.displayName || 'Pilot'
          }));
      }
      if (!u) setLoading(false);
    });
  }, []);

  // --- Data Listeners ---
  useEffect(() => {
    if (!user) return;

    // Load Settings
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    const unsubSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTheme(data.theme || 'light');
        setCurrency(data.currency || 'USD');
        setUserSettings(prev => ({ ...prev, ...data }));
      }
    });

    // Load Transactions
    const qTrx = query(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
    const unsubTrx = onSnapshot(qTrx, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSyncStatus(snap.metadata.hasPendingWrites ? 'syncing' : 'synced');
      setLoading(false);
    });

    // Load Budgets
    const unsubBudgets = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'budgets'), (snap) => {
      const b = {}; snap.docs.forEach(d => b[d.id] = d.data().limit);
      setBudgets(b);
    });

    // Load Goals
    const unsubGoals = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSettings(); unsubTrx(); unsubBudgets(); unsubGoals(); };
  }, [user]);

  // --- Effects ---
  useEffect(() => {
    // Apply Theme
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (activeTab === 'coach') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  // --- Helpers ---
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSetting = async (key, value) => {
    if (!user) return;
    const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'config');
    await setDoc(ref, { [key]: value }, { merge: true });
  };

  const updateDisplayName = async (name) => {
    if(!user) return;
    try {
        await updateProfile(user, { displayName: name });
        await updateSetting('displayName', name);
        showToast("Profile updated");
    } catch(e) {
        console.error(e);
        showToast("Failed to update profile", 'error');
    }
  };

  // --- Calculated Values ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = useMemo(() => {
    const data = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + Number(t.amount);
    });
    return Object.keys(data).map(key => {
      const def = CATEGORIES.expense.find(c => c.id === key) || { name: key, color: '#ccc', icon: '📦' };
      return { ...def, value: data[key], id: key };
    }).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // --- Action Handlers ---
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.desc) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        amount: parseFloat(formData.amount),
        description: formData.desc,
        category: formData.cat,
        type: formData.type,
        date: serverTimestamp()
      });
      setFormData({ amount: '', desc: '', cat: 'food', type: 'expense' });
      setIsAddModalOpen(false);
      showToast("Transaction saved!");
      
      // Check Budget
      if (formData.type === 'expense') {
        const limit = budgets[formData.cat] || 0;
        const current = expensesByCategory.find(c => c.id === formData.cat)?.value || 0;
        if (limit > 0 && (current + parseFloat(formData.amount)) > limit) {
           showToast(`Budget exceeded for ${CATEGORIES.expense.find(c=>c.id===formData.cat)?.name}`, 'error');
        }
      }
    } catch (err) { console.error(err); showToast("Failed to save", 'error'); }
  };

  const handleMagicAdd = async (e) => {
    e.preventDefault();
    if (!magicInput) return;
    setIsProcessing(true);
    try {
      const prompt = `Extract transaction: "${magicInput}". JSON: {amount, description, category (food, transport, housing, entertainment, shopping, health, subscriptions, other, salary, freelance), type (expense/income)}.`;
      const res = await callGemini(prompt);
      const data = JSON.parse(res.replace(/```json\n?|\n?```/g, '').trim());
      setFormData({
        amount: data.amount || '',
        desc: data.description || '',
        cat: data.category || 'other',
        type: data.type || 'expense'
      });
      setIsMagicModalOpen(false);
      setIsAddModalOpen(true);
      setMagicInput('');
    } catch (e) { showToast("AI couldn't parse that", 'error'); } 
    finally { setIsProcessing(false); }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const name = e.target.goalName.value;
    const target = parseFloat(e.target.goalTarget.value);
    if (!name || !target) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), {
      name, target, current: 0, date: serverTimestamp()
    });
    setIsGoalModalOpen(false);
    showToast("Savings goal created!");
  };

  const deleteItem = async (col, id) => {
    if (confirm("Are you sure?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, col, id));
      showToast("Deleted");
    }
  };

  // --- Budget Handlers ---
  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!selectedBudgetCategory || !budgetLimit) return;
    try {
      const budgetRef = doc(db, 'artifacts', appId, 'users', user.uid, 'budgets', selectedBudgetCategory);
      // Upsert
      await setDoc(budgetRef, { limit: parseFloat(budgetLimit) }, { merge: true });
      setIsBudgetModalOpen(false);
      setBudgetLimit('');
      showToast("Budget updated");
    } catch (err) { console.error(err); showToast("Error saving budget", 'error'); }
  };

  const generateSmartBudgetPlan = async () => {
    if (!totalMonthlyLimit) return;
    setIsGeneratingPlan(true);
    try {
      const history = expensesByCategory.map(c => ({ id: c.id, name: c.name, avgSpent: c.value }));
      const prompt = `
        Total Monthly Budget Limit: $${totalMonthlyLimit}.
        Historical Spending: ${JSON.stringify(history)}.
        Distribute the budget optimally across categories (food, transport, housing, entertainment, shopping, health, subscriptions, other).
        Return JSON object where keys are category IDs and values are numeric limits.
      `;
      const result = await callGemini(prompt);
      const plan = JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
      setProposedBudgets(plan);
    } catch (e) { console.error(e); showToast("AI Plan failed", 'error'); } 
    finally { setIsGeneratingPlan(false); }
  };

  const applySmartBudgetPlan = async () => {
    if (!proposedBudgets) return;
    try {
       const batch = writeBatch(db);
       Object.entries(proposedBudgets).forEach(([catId, limit]) => {
          const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'budgets', catId);
          batch.set(ref, { limit: Number(limit) }, { merge: true });
       });
       await batch.commit();
       setIsSmartBudgetModalOpen(false);
       setProposedBudgets(null);
       setTotalMonthlyLimit('');
       showToast("Smart plan applied!");
    } catch(e) { console.error(e); showToast("Failed to apply plan", 'error'); }
  };

  // --- Chat Handler ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const context = {
        balance: formatCurrency(balance, currency),
        income: formatCurrency(totalIncome, currency),
        expense: formatCurrency(totalExpense, currency),
        topExpenses: expensesByCategory.slice(0, 3).map(e => `${e.name}: ${formatCurrency(e.value, currency)}`)
      };
      
      const prompt = `You are Penny, a financial coach.
      Context: ${JSON.stringify(context)}.
      User: "${userMsg}"
      Reply helpfully and briefly.`;

      const response = await callGemini(prompt);
      setChatMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Connection error." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Subscriptions Handler ---
  const processSubscriptions = async () => {
      // Find all recurring expenses in history (mock logic using 'subscriptions' category)
      const subs = transactions.filter(t => t.category === 'subscriptions');
      // Logic: add a new entry for this month if not present
      if(subs.length === 0) {
          showToast("No subscription history found.", "error");
          return;
      }
      // Demo: Just re-add the last subscription found as a new transaction for today
      const lastSub = subs[0];
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), {
        amount: lastSub.amount,
        description: lastSub.description,
        category: 'subscriptions',
        type: 'expense',
        date: serverTimestamp()
      });
      showToast(`Renewed: ${lastSub.description}`);
  };

  // --- Views ---
  
  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-emerald-600">
      <div className="flex flex-col items-center animate-pulse">
        <Wallet size={48} className="mb-4" />
        <h1 className="text-xl font-bold dark:text-white">PennyPilot</h1>
        <p className="text-xs text-slate-400">Secure Environment Loading...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
              <Wallet className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">PennyPilot</h1>
              <p className="text-[10px] opacity-60 font-medium uppercase tracking-wider mt-0.5">Ultimate Edition</p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             {['dashboard', 'analytics', 'budgets', 'goals', 'coach', 'profile'].map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)}
                 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                   activeTab === tab ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                 }`}
               >
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
               </button>
             ))}
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'}`}>
                {syncStatus === 'synced' ? <Cloud size={12} /> : <RefreshCw size={12} className="animate-spin" />}
                <span className="hidden sm:inline">{syncStatus === 'synced' ? 'Saved' : 'Syncing'}</span>
            </div>
            <button onClick={() => updateSetting('theme', theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-24">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-emerald-900 dark:to-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-slate-200 dark:shadow-none relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-slate-400 font-medium mb-1">Total Balance</p>
                  <h2 className="text-4xl font-extrabold tracking-tight mb-6">{formatCurrency(balance, currency)}</h2>
                  <div className="flex gap-3">
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20">
                      <Plus size={18} /> Record
                    </button>
                    <button onClick={() => setIsMagicModalOpen(true)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 backdrop-blur-sm transition-colors">
                      <Sparkles size={18} /> Magic
                    </button>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                  <Wallet size={200} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:w-80">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                    <ArrowDownLeft size={20} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Income</p>
                  <p className="text-xl font-bold">{formatCurrency(totalIncome, currency)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                  <div className="bg-red-100 dark:bg-red-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-red-500 dark:text-red-400 mb-3">
                    <ArrowUpRight size={20} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Expense</p>
                  <p className="text-xl font-bold">{formatCurrency(totalExpense, currency)}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Recent Activity</h3>
                  <button onClick={() => setActiveTab('analytics')} className="text-emerald-500 text-sm font-bold hover:underline">View All</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {transactions.length === 0 ? (
                    <div className="p-10 text-center opacity-50"><ShoppingBag className="mx-auto mb-2" />No transactions yet</div>
                  ) : (
                    transactions.slice(0, 10).map(t => {
                      const cat = CATEGORIES[t.type].find(c => c.id === t.category) || {};
                      return (
                        <div key={t.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group border-b border-slate-50 dark:border-slate-800 last:border-0">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              {cat.icon || '📦'}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{t.description}</p>
                              <p className="text-xs text-slate-400">{cat.name} • {formatDate(t.date)}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                             <span className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : ''}`}>
                               {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                             </span>
                             <button onClick={() => deleteItem('transactions', t.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Mini Goals */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Target className="text-indigo-500" size={20} /> Goals</h3>
                  {goals.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      <p>No goals set.</p>
                      <button onClick={() => setActiveTab('goals')} className="text-indigo-500 font-bold mt-2">Create Goal</button>
                    </div>
                  ) : (
                     goals.slice(0, 3).map(g => (
                       <div key={g.id} className="mb-4 last:mb-0">
                         <div className="flex justify-between text-xs mb-1 font-medium">
                           <span>{g.name}</span>
                           <span>{Math.round((g.current / g.target) * 100)}%</span>
                         </div>
                         <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(g.current / g.target) * 100}%` }}></div>
                         </div>
                       </div>
                     ))
                  )}
                </div>
                
                {/* Subscription Snippet */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-xl text-indigo-600 dark:text-indigo-300"><Repeat size={18} /></div>
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-100">Subscriptions</h3>
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-4">One-click add for monthly recurring bills.</p>
                  <button onClick={processSubscriptions} className="w-full py-2 bg-white dark:bg-indigo-900 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-300 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-800 transition-colors">Check & Renew</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
                <h3 className="font-bold text-lg mb-8 self-start">Spending Breakdown</h3>
                <SimplePieChart data={expensesByCategory} dark={theme === 'dark'} />
             </div>
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <h3 className="font-bold text-lg mb-6">Details</h3>
                <div className="space-y-3">
                  {expensesByCategory.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-white dark:bg-slate-800 shadow-sm">{cat.icon}</div>
                      <span className="flex-1 font-medium text-sm">{cat.name}</span>
                      <span className="font-bold text-sm">{formatCurrency(cat.value, currency)}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* BUDGETS */}
        {activeTab === 'budgets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
               <div className="flex justify-between items-start">
                 <div>
                   <h2 className="text-2xl font-bold mb-1">Monthly Budget</h2>
                   <p className="text-blue-100 text-sm">Total Allocated: {formatCurrency(Object.values(budgets).reduce((a,b)=>a+b,0), currency)}</p>
                 </div>
                 <div className="bg-white/20 p-3 rounded-2xl">
                   <PieChart size={24} />
                 </div>
               </div>
               <div className="mt-6 flex gap-3">
                 <button onClick={() => setIsSmartBudgetModalOpen(true)} className="flex-1 bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                    <Wand2 size={16} /> AI Plan
                 </button>
                 <button onClick={() => setIsBudgetModalOpen(true)} className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors">
                    <Plus size={16} /> Set Limit
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.expense.map(cat => {
                const limit = budgets[cat.id] || 0;
                if (limit === 0) return null;
                const spent = expensesByCategory.find(c => c.id === cat.id)?.value || 0;
                const pct = Math.min(100, (spent / limit) * 100);
                
                return (
                  <div key={cat.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                         <div className="text-2xl">{cat.icon}</div>
                         <div>
                           <h4 className="font-bold text-sm">{cat.name}</h4>
                           <p className="text-xs text-slate-400">{formatCurrency(limit - spent, currency)} left</p>
                         </div>
                       </div>
                       <button onClick={() => { setSelectedBudgetCategory(cat.id); setBudgetLimit(limit); setIsBudgetModalOpen(true); }} className="text-slate-300 hover:text-emerald-500"><Settings size={16}/></button>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${pct}%`}} />
                     </div>
                     <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                       <span>{formatCurrency(spent, currency)}</span>
                       <span>{formatCurrency(limit, currency)}</span>
                     </div>
                  </div>
                )
              })}
              {Object.keys(budgets).length === 0 && (
                 <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                   <p>No active budgets. Create one to start tracking!</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* COACH */}
        {activeTab === 'coach' && (
          <div className="max-w-2xl mx-auto h-[600px] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in">
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="font-bold">Penny</h3>
                <p className="text-xs text-indigo-200">AI Financial Assistant</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-800 shadow-sm flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your finances..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}

        {/* GOALS */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold">Savings Goals</h2>
               <button onClick={() => setIsGoalModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18} /> New Goal</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {goals.map(goal => (
                 <div key={goal.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                    <button onClick={() => deleteItem('goals', goal.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-500"><Award size={24} /></div>
                      <div>
                        <h3 className="font-bold text-lg">{goal.name}</h3>
                        <p className="text-xs text-slate-400">Target: {formatCurrency(goal.target, currency)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm font-bold mb-2">
                       <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(goal.current, currency)} Saved</span>
                       <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden mb-4">
                       <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}></div>
                    </div>

                    <div className="flex gap-2">
                       <button onClick={async () => {
                         const amt = prompt("Amount to add:");
                         if (amt) {
                           await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'goals', goal.id), { current: goal.current + parseFloat(amt) });
                           showToast("Added to savings!");
                         }
                       }} className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">Deposit</button>
                    </div>
                 </div>
               ))}
               {goals.length === 0 && (
                 <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                   <Target className="mx-auto text-slate-300 mb-2" size={48} />
                   <p className="text-slate-400">Visualize your dreams. Set a goal today.</p>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                <div 
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold shadow-lg transition-colors"
                  style={{ background: userSettings.avatarColor }}
                >
                  {userSettings.displayName.charAt(0)}
                </div>
                
                <h2 className="text-2xl font-bold mb-1">{userSettings.displayName}</h2>
                <div className="text-sm text-slate-400 mb-6 flex items-center justify-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">ID: {user?.uid?.slice(0, 6)}</span>
                    <span>•</span>
                    <span>Joined {new Date(user?.metadata?.creationTime).toLocaleDateString()}</span>
                </div>
                
                <div className="space-y-6 text-left">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Display Name</label>
                    <input 
                      type="text" 
                      value={userSettings.displayName}
                      onChange={(e) => {
                        setUserSettings({...userSettings, displayName: e.target.value});
                        updateDisplayName(e.target.value);
                      }}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase ml-1">Avatar Color</label>
                     <div className="flex gap-2 mt-2">
                        {COLORS.map(c => (
                            <button 
                                key={c}
                                onClick={() => { setUserSettings({...userSettings, avatarColor: c}); updateSetting('avatarColor', c); }}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${userSettings.avatarColor === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                     </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Currency Symbol</label>
                    <div className="flex gap-2 mt-1">
                      {Object.keys(CURRENCIES).map(c => (
                        <button key={c} onClick={() => { setCurrency(c); updateSetting('currency', c); }} 
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${currency === c ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl flex items-center justify-between border border-emerald-100 dark:border-emerald-900/30">
               <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                 <Shield size={20} />
                 <div>
                    <p className="font-bold text-sm">Account Status: Active</p>
                    <p className="text-xs opacity-80">Last login: {new Date(user?.metadata?.lastSignInTime).toLocaleString()}</p>
                 </div>
               </div>
               <Check size={20} />
             </div>
          </div>
        )}

      </main>

      {/* --- Modals --- */}
      
      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold">Add Record</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-5">
               {/* Type Toggle */}
               <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                 {['expense', 'income'].map(t => (
                   <button key={t} type="button" onClick={() => setFormData({...formData, type: t})}
                     className={`py-2 rounded-lg text-sm font-bold capitalize transition-all ${formData.type === t ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                   >
                     {t}
                   </button>
                 ))}
               </div>
               
               {/* Amount */}
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Amount</label>
                 <div className="relative mt-1">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">{CURRENCIES[currency]}</span>
                   <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                     className="w-full pl-10 pr-4 py-4 text-2xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                     placeholder="0.00"
                   />
                 </div>
               </div>

               {/* Description */}
               <input type="text" required value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})}
                 className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                 placeholder="Description (e.g. Taco Bell)"
               />

               {/* Category Grid */}
               <div className="grid grid-cols-4 gap-2">
                 {CATEGORIES[formData.type].map(cat => (
                   <button key={cat.id} type="button" onClick={() => setFormData({...formData, cat: cat.id})}
                     className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${formData.cat === cat.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 opacity-60 hover:opacity-100'}`}
                   >
                     <span className="text-xl mb-1">{cat.icon}</span>
                   </button>
                 ))}
               </div>

               <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 transition-transform active:scale-95">
                 Save Transaction
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Magic Modal */}
      {isMagicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
             <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles size={20} /> Magic Add</h3>
                 <button onClick={() => setIsMagicModalOpen(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30"><X size={16} /></button>
               </div>
               <p className="text-indigo-100 text-sm">Type naturally, e.g., "Spent 50 bucks on gas"</p>
             </div>
             
             <div className="p-6 space-y-6">
                <textarea 
                  value={magicInput} onChange={(e) => setMagicInput(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                  placeholder="Enter transaction details..."
                />
                <button 
                  onClick={handleMagicAdd} disabled={isProcessing}
                  className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:opacity-90 flex justify-center items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : 'Process with AI'}
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-6">Create Savings Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <input name="goalName" required placeholder="Goal Name (e.g. Laptop)" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{CURRENCIES[currency]}</span>
                <input name="goalTarget" type="number" required placeholder="Target Amount" className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none" />
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Create Goal</button>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Set Category Limit</h3>
                <form onSubmit={handleSetBudget} className="space-y-4">
                  <select 
                    value={selectedBudgetCategory} onChange={e => setSelectedBudgetCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="" disabled>Select Category</option>
                    {CATEGORIES.expense.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>

                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                       type="number" required value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                       className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Monthly Limit"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Save</button>
                  </div>
                </form>
              </div>
           </div>
         </div>
      )}

      {/* Smart Budget Modal */}
      {isSmartBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Wand2 size={20} /> AI Budget Planner</h3>
                 <button onClick={() => setIsSmartBudgetModalOpen(false)} className="bg-white/20 p-1 rounded-full hover:bg-white/30"><X size={16} /></button>
               </div>
               <p className="text-blue-100 text-sm">Enter your total monthly spending limit. We'll distribute it optimally.</p>
             </div>
             
             <div className="p-6 space-y-6">
                {!proposedBudgets ? (
                  <>
                    <div className="relative">
                       <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Total Monthly Limit</label>
                       <input 
                         type="number" 
                         value={totalMonthlyLimit}
                         onChange={(e) => setTotalMonthlyLimit(e.target.value)}
                         className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="e.g. 3000"
                       />
                    </div>

                    <button 
                      onClick={generateSmartBudgetPlan}
                      disabled={isGeneratingPlan || !totalMonthlyLimit}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-transform active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                      {isGeneratingPlan ? <Loader2 className="animate-spin" /> : 'Generate Plan'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                     <h4 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Proposed Allocation</h4>
                     <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {Object.entries(proposedBudgets).map(([catId, limit]) => {
                           const cat = CATEGORIES.expense.find(c => c.id === catId);
                           if (!cat) return null;
                           return (
                             <div key={catId} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                               <div className="flex items-center gap-2">
                                 <span>{cat.icon}</span>
                                 <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{cat.name}</span>
                               </div>
                               <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(limit, currency)}</span>
                             </div>
                           )
                        })}
                     </div>
                     <div className="flex gap-3">
                       <button onClick={() => setProposedBudgets(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200">Back</button>
                       <button onClick={applySmartBudgetPlan} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200">Apply Plan</button>
                     </div>
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
        {['dashboard', 'analytics', 'budgets', 'coach', 'goals', 'profile'].map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab ? 'text-emerald-500' : 'text-slate-400'}`}>
             {tab === 'dashboard' && <Wallet size={24} />}
             {tab === 'analytics' && <PieChart size={24} />}
             {tab === 'budgets' && <Target size={24} />}
             {tab === 'coach' && <MessageCircle size={24} />}
             {tab === 'goals' && <Award size={24} />}
             {tab === 'profile' && <User size={24} />}
           </button>
        ))}
      </div>
    </div>
  );
}
