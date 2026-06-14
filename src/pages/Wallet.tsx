import React, { useState, useEffect, useRef } from 'react';
import HamburgerButton from '../components/HamburgerButton';
import { motion } from 'motion/react';
import { 
  CheckCircle2, AlertTriangle, ArrowUpRight, 
  Clock, Download, Filter, Landmark, Plus, ArrowRight, Wallet as WalletIcon, ShieldCheck, FileText,
  Phone, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DeferredChart from '../components/DeferredChart';

const Wallet = () => {
  const { user, setActiveTab, updateProfile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null);

  const [isSetupPinModalOpen, setIsSetupPinModalOpen] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [isPinVerifying, setIsPinVerifying] = useState(false);
  const pinInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const confirmPinInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const [isForgotPinModalOpen, setIsForgotPinModalOpen] = useState(false);
  const [resetContact, setResetContact] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetMethod, setResetMethod] = useState<'phone' | 'email'>('phone');

  const BankLogo = ({ bankName }: { bankName: string }) => {
    const [useFallback, setUseFallback] = useState(false);
    const n = bankName.toLowerCase();
    
    let domain = '';
    let style = { bg: 'bg-slate-800', text: 'text-white', label: bankName.slice(0, 2).toUpperCase() };
    
    if (n.includes('access')) {
      domain = 'accessbankplc.com';
      style = { bg: 'bg-orange-600', text: 'text-white', label: 'Access' };
    } else if (n.includes('zenith')) {
      domain = 'zenithbank.com';
      style = { bg: 'bg-red-700', text: 'text-white', label: 'Zenith' };
    } else if (n.includes('gtb') || n.includes('guaranty')) {
      domain = 'gtbank.com';
      style = { bg: 'bg-orange-500', text: 'text-white', label: 'GTB' };
    } else if (n.includes('first')) {
      domain = 'firstbanknigeria.com';
      style = { bg: 'bg-blue-900', text: 'text-amber-400', label: 'FBN' };
    } else if (n.includes('uba') || n.includes('united')) {
      domain = 'ubagroup.com';
      style = { bg: 'bg-red-600', text: 'text-white', label: 'UBA' };
    } else if (n.includes('fidelity')) {
      domain = 'fidelitybank.ng';
      style = { bg: 'bg-green-800', text: 'text-white', label: 'Fid' };
    } else if (n.includes('opay')) {
      domain = 'opayweb.com';
      style = { bg: 'bg-emerald-500', text: 'text-white', label: 'OPay' };
    } else if (n.includes('palmpay')) {
      domain = 'palmpay.com';
      style = { bg: 'bg-indigo-600', text: 'text-white', label: 'Palm' };
    } else if (n.includes('moniepoint')) {
      domain = 'moniepoint.com';
      style = { bg: 'bg-sky-500', text: 'text-white', label: 'MP' };
    } else if (n.includes('kuda')) {
      domain = 'kuda.com';
      style = { bg: 'bg-[#40196D]', text: 'text-white', label: 'Kuda' };
    } else if (n.includes('wema')) {
      domain = 'wemabank.com';
      style = { bg: 'bg-purple-800', text: 'text-white', label: 'Wema' };
    } else if (n.includes('polaris')) {
      domain = 'polarisbanklimited.com';
      style = { bg: 'bg-indigo-900', text: 'text-white', label: 'Pol' };
    } else if (n.includes('sterling')) {
      domain = 'sterling.ng';
      style = { bg: 'bg-red-500', text: 'text-white', label: 'Ster' };
    } else if (n.includes('stanbic')) {
      domain = 'stanbicibtcbank.com';
      style = { bg: 'bg-blue-800', text: 'text-white', label: 'Stan' };
    } else if (n.includes('union')) {
      domain = 'unionbankng.com';
      style = { bg: 'bg-blue-700', text: 'text-white', label: 'Union' };
    } else if (n.includes('fcmb') || n.includes('city monument')) {
      domain = 'fcmb.com';
      style = { bg: 'bg-amber-500', text: 'text-slate-900', label: 'FCMB' };
    } else if (n.includes('providus')) {
      domain = 'providusbank.com';
      style = { bg: 'bg-amber-900', text: 'text-white', label: 'Prov' };
    } else if (n.includes('keystone')) {
      domain = 'keystonebankng.com';
      style = { bg: 'bg-blue-950', text: 'text-white', label: 'Key' };
    } else {
      const words = bankName.split(' ');
      const initials = words.length > 1 ? (words[0][0] + words[1][0]) : bankName.slice(0, 2);
      style = { bg: 'bg-slate-705', text: 'text-slate-201', label: initials.toUpperCase() };
    }

    const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';

    if (!logoUrl || useFallback) {
      return (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs tracking-tight shadow-inner border border-white/10 shrink-0 ${style.bg} ${style.text}`}>
          {style.label}
        </div>
      );
    }

    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 bg-white flex items-center justify-center border border-slate-200 dark:border-slate-700/50">
        <img
          src={logoUrl}
          alt={bankName}
          className="w-8 h-8 object-contain transition-transform"
          onError={() => setUseFallback(true)}
        />
      </div>
    );
  };
  useEffect(() => {
    fetch('/api/banks')
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          const uniqueBanks: any[] = [];
          const seenCodes = new Set<string>();
          data.data.forEach((bank: any) => {
            if (bank.code && !seenCodes.has(bank.code)) {
              seenCodes.add(bank.code);
              uniqueBanks.push(bank);
            }
          });
          uniqueBanks.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setBanksList(uniqueBanks);
        }
      })
      .catch(err => console.error("Could not load banks", err));
  }, []);

  useEffect(() => {
    if (accountNumber.length === 10 && bankCode) {
      setIsResolving(true);
      fetch(`/api/banks/resolve?account_number=${accountNumber}&bank_code=${bankCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.status && data.data?.account_name) {
            setAccountName(data.data.account_name);
            const selectedBankObj = banksList.find(b => b.code === bankCode);
            setBankName(selectedBankObj?.name || '');
          } else {
            console.error("Resolve failed:", data);
            setAccountName("RESOLVE FAILED");
          }
        })
        .catch(err => {
          console.error("Failed to resolve account", err);
          setAccountName("ERROR FETCHING ACCOUNT");
        })
        .finally(() => {
          setIsResolving(false);
        });
    } else {
      setAccountName('');
    }
  }, [accountNumber, bankCode, banksList]);

  const handleWithdrawClick = () => {
    setPinError('');
    setPin(['', '', '', '']);
    if (!user?.hasWalletPin) {
      setSetupStep('create');
      setConfirmPin(['', '', '', '']);
      setIsSetupPinModalOpen(true);
    } else {
      setIsWithdrawModalOpen(true);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !selectedBankAccountId || !user) return;
    
    const enteredPin = pin.join('');
    if (!enteredPin || enteredPin.length < 4) {
      setPinError("Please enter your 4-digit PIN.");
      return;
    }
    
    if (enteredPin !== user.walletPin) {
      setPinError("Incorrect PIN. Please try again.");
      setPin(['', '', '', '']);
      pinInputRefs[0]?.current?.focus();
      return;
    }

    setPinError('');
    setIsWithdrawing(true);
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            amount: withdrawAmount, 
            bankAccountId: selectedBankAccountId,
            agentId: user.id
        })
      });
      const data = await response.json();
      if (data.status) {
        setPin(['', '', '', '']);
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        setSelectedBankAccountId('');
      } else {
        console.error("Withdrawal failed:", data.message);
        alert(data.message || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Failed to withdraw", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    setPinError('');
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      pinInputRefs[index + 1]?.current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1]?.current?.focus();
    }
  };

  const handleConfirmPinChange = (index: number, value: string) => {
    setPinError('');
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newPin = [...confirmPin];
    newPin[index] = value;
    setConfirmPin(newPin);
    if (value && index < 3) {
      confirmPinInputRefs[index + 1]?.current?.focus();
    }
  };

  const handleConfirmPinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !confirmPin[index] && index > 0) {
      confirmPinInputRefs[index - 1]?.current?.focus();
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupStep === 'create') {
      if (pin.some(p => !p)) {
        setPinError("Please enter a 4-digit PIN.");
        return;
      }
      setSetupStep('confirm');
      setPinError('');
      setTimeout(() => confirmPinInputRefs[0]?.current?.focus(), 100);
      return;
    }

    if (confirmPin.some(p => !p)) {
      setPinError("Please confirm your PIN.");
      return;
    }

    if (pin.join('') !== confirmPin.join('')) {
      setPinError("PINs do not match. Please try again.");
      setConfirmPin(['', '', '', '']);
      confirmPinInputRefs[0]?.current?.focus();
      return;
    }

    setIsPinVerifying(true);
    setPinError('');
    try {
      await updateProfile({
        hasWalletPin: true,
        walletPin: pin.join('')
      });
      setIsSetupPinModalOpen(false);
      setIsWithdrawModalOpen(true);
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setSetupStep('create');
    } catch (err) {
      console.error(err);
      setPinError('Failed to set PIN. Try again.');
    } finally {
      setIsPinVerifying(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountName) return;
    setIsAddingAccount(true);
    try {
      const newAccount = { bankName, accountNumber, accountName, id: Date.now().toString() };
      const currentAccounts = user?.bankAccounts || [];
      await updateProfile({ bankAccounts: [...currentAccounts, newAccount] });
      setIsAddAccountModalOpen(false);
      setBankName('');
      setAccountNumber('');
      setAccountName('');
    } catch (error) {
      console.error("Failed to add account", error);
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleRemoveAccountClick = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    setAccountToRemove(accountId);
  };

  const confirmRemoveAccount = async () => {
    if (!user || !accountToRemove) return;
    try {
      const updatedAccounts = (user.bankAccounts || []).filter((acc: any) => acc.id !== accountToRemove);
      await updateProfile({ bankAccounts: updatedAccounts });
      setAccountToRemove(null);
    } catch (error) {
      console.error("Failed to remove bank account", error);
    }
  };

  useEffect(() => {
    if (!user) return;
    const docsRef = collection(db, 'transactions');
    
    // Wallet is primarily for agents receiving funds
    if (user.role === 'tenant') return;

    const qAgent = query(docsRef, where('agentId', '==', user.id));
    const unsubscribe = onSnapshot(qAgent, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }));
      fetched.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const tB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return tB - tA;
      });
      setTransactions(fetched);
    }, (error: any) => {
      if (error?.code !== 'permission-denied' && !error?.message?.includes('permission')) {
        console.error("Wallet transactions error:", error);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || user.role !== 'agent') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Wallet Unavailable</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">Tenant accounts utilize direct Paystack checkout for transactions. Agents receive wallet settlements.</p>
        <button onClick={() => setActiveTab('home')} className="mt-8 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]">Return to Home</button>
      </div>
    );
  }

  const totalEarnings = transactions.filter(t => t.status === 'released' || t.status === 'completed').reduce((sum, t) => sum + (t.rentAmount || t.priceValue || t.amountValue || t.amount || 0), 0);
  const totalPayouts = transactions.filter(t => t.status === 'withdrawn').reduce((sum, t) => sum + (t.amount || 0), 0);
  const availableBalance = totalEarnings - totalPayouts;
  const pendingEscrow = transactions.filter(t => t.status === 'locked').reduce((sum, t) => sum + (t.totalPaid || t.priceValue || t.amount || 0), 0);

  const chartData = React.useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const data = months.map(name => ({ name, earnings: 0 }));
    transactions.forEach(t => {
      if (t.status === 'released' || t.status === 'completed') {
        const dateObj = t.createdAt?.toDate?.() || t.date?.toDate?.() || new Date(t.createdAt?.seconds ? t.createdAt.seconds * 1000 : t.createdAt || Date.now());
        if (dateObj && !isNaN(dateObj.getTime())) {
          const mIdx = dateObj.getMonth();
          data[mIdx].earnings += (t.rentAmount || t.priceValue || t.amountValue || t.amount || 0);
        }
      }
    });
    return data;
  }, [transactions]);

  const processingBalance = transactions.filter(t => ['processing', 'pending_payout', 'pending'].includes(t.status)).reduce((sum, t) => sum + (t.rentAmount || t.priceValue || t.amount || 0), 0);
  const totalBalanceForPerc = availableBalance + pendingEscrow + processingBalance;
  const getPercent = (val: number) => totalBalanceForPerc > 0 ? Math.round((val / totalBalanceForPerc) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl border border-slate-700">
          <p>{`₦${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-0 transition-colors duration-300 animate-fade-in">
      <header className={`sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between lg:hidden`}>
        <div className="flex items-center gap-2">
          <HamburgerButton />
          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Payments</h1>
        </div>
        <div className="w-8"></div>
      </header>

      <main className="w-full max-w-full sm:max-w-none px-[15px] pt-[15px] pb-[15px] mb-[15px] space-y-[15px]">
        
        {/* Top Balance Card */}
        <div className="bg-[#0B1015] dark:bg-black rounded-3xl p-[15px] md:p-6 text-white relative shadow-xl overflow-hidden flex flex-col justify-between">
          {/* Background Accent */}
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <div className="w-96 h-96 bg-primary-500 rounded-full blur-[120px] transform translate-x-1/3 -translate-y-1/2"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between lg:items-center gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-black tracking-widest text-[#94a3b8] uppercase mb-2">Available Balance</p>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-none mb-6">₦ {availableBalance.toLocaleString()}</h2>
              
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Pending Balance</p>
                  <p className="text-lg font-bold tracking-tight">₦{pendingEscrow.toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Total Payouts</p>
                   <p className="text-lg font-bold tracking-tight">₦{(totalPayouts / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button onClick={handleWithdrawClick} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-sm transition-colors active:scale-[0.98]">
                <ArrowUpRight className="w-4 h-4" />
                Withdraw Funds
              </button>
              <button onClick={() => setIsAddAccountModalOpen(true)} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-colors border border-white/10 active:scale-[0.98]">
                <Landmark className="w-4 h-4" />
                Add Bank Account
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[15px]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Monthly Earnings Trend</h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button className="px-4 py-1.5 text-[10px] font-black tracking-widest uppercase bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg shadow-sm">12M</button>
                <button className="px-4 py-1.5 text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">6M</button>
              </div>
            </div>
            <div className="flex-1 w-full mt-2 min-h-0 min-w-0">
              <DeferredChart>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
                      dy={15}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="earnings" radius={[4, 4, 0, 0]} maxBarSize={6}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.earnings > 2000000 ? '#0B1015' : '#0ea5e9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </DeferredChart>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="h-full flex flex-col">
               <h3 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-8">Earnings By Status</h3>
               <div className="flex-1 flex items-center justify-center">
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                       <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Available to Withdraw</span>
                       <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{getPercent(availableBalance)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20">
                       <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Held in Escrow</span>
                       <span className="text-xl font-black text-amber-700 dark:text-amber-400">{getPercent(pendingEscrow)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                       <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Processing</span>
                       <span className="text-xl font-black text-slate-600 dark:text-slate-400">{getPercent(processingBalance)}%</span>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Earnings Activity Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-[15px] border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Earnings Activity Ledger</h3>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Transaction Details</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Property / Destination</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Amount</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map(t => {
                    const isWithdrawal = t.status === 'withdrawn';
                    const amount = (t.rentAmount || t.priceValue || t.totalPaid || t.amount || 0);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 ${isWithdrawal ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'} rounded-full flex items-center justify-center shrink-0`}>
                              {isWithdrawal ? <ArrowUpRight className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 rotate-90" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{isWithdrawal ? 'Withdrawal' : 'Rent Payment'}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5" title={t.id}>Ref: {t.reference || t.id.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {isWithdrawal ? (
                            <div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">Bank Transfer ({t.bankName || 'Bank'})</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">**** {String(t.accountNumber || '').slice(-4)}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">{t.propertyTitle || 'Property Reservation'}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">From: {t.tenantName || 'Tenant'}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className={`text-[15px] font-black ${isWithdrawal ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isWithdrawal ? '-' : '+'}₦{amount.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
                            t.status === 'locked' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' 
                            : t.status === 'released' || t.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : t.status === 'withdrawn' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}>
                            {t.status === 'locked' ? 'Escrow' : t.status === 'released' || t.status === 'completed' ? 'Completed' : t.status === 'withdrawn' ? 'Withdrawn' : 'Processing'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="text-[11px] text-slate-400 font-medium">
                            {t.date?.toDate ? new Date(t.date.toDate()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : (t.createdAt?.toDate ? new Date(t.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent')}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {transactions.length > 5 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/30 dark:bg-slate-900/50">
               <button className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">View All Transactions</button>
            </div>
          )}
        </div>

        {/* Bottom Split Row */}
        <div className="grid grid-cols-1 gap-[15px]">

          {/* Recent Withdrawals */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Recent Withdrawal History</h3>
               <button className="text-[10px] font-black tracking-widest uppercase text-primary-600 hover:text-primary-500 transition-colors">View All</button>
             </div>
             
             <div className="space-y-2">
                {transactions.filter((t) => t.status === 'withdrawn').length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">No withdrawals yet.</div>
                ) : (
                  transactions.filter((t) => t.status === 'withdrawn').slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center group p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 dark:border-emerald-800/30 group-hover:scale-110 transition-transform">
                           <ArrowRight className="w-4 h-4 -rotate-45" />
                         </div>
                         <div>
                           <p className="text-[15px] font-black text-slate-900 dark:text-white">-₦{(t.amount || 0).toLocaleString()}</p>
                           <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{t.bankName || 'Bank Account'} • {t.date?.toDate ? new Date(t.date.toDate()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent'}</p>
                         </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Linked Bank Accounts */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-[15px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
            <h3 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4">Linked Bank Accounts</h3>
            <div className="space-y-3 flex-1 mb-4">
              {(!user?.bankAccounts || user.bankAccounts.length === 0) ? (
                <div className="text-center py-6 text-slate-500 text-sm">No linked accounts yet.</div>
              ) : (
                user.bankAccounts.map((acc: any) => (
                  <div key={acc.id} onClick={() => setSelectedBankAccountId(acc.id)} className={`flex items-center justify-between p-4 border rounded-2xl transition-colors cursor-pointer group ${selectedBankAccountId === acc.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                     <div className="flex items-center gap-4">
                        <BankLogo bankName={acc.bankName} />
                        <div>
                          <p className="text-[13px] font-bold text-slate-900 dark:text-white">{acc.bankName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">**** {String(acc.accountNumber).slice(-4)}</p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                         <ShieldCheck className="w-3.5 h-3.5" /> Verified
                       </div>
                       <button onClick={(e) => handleRemoveAccountClick(e, acc.id)} className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                         Remove
                       </button>
                     </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <button onClick={() => setIsAddAccountModalOpen(true)} className="w-full py-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.98]">
                 <Plus className="w-4 h-4" /> Add Another Bank
               </button>
            </div>
          </div>
        </div>

      </main>

      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddAccountModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 pb-safe sm:pb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Bank Account</h3>
              <button onClick={() => setIsAddAccountModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Bank Name</label>
                <select 
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                  required
                >
                  <option value="" disabled>Select a Bank</option>
                  {banksList.map(bank => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit account number"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white font-mono placeholder-sans"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Account Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={accountName}
                    readOnly
                    className={`w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none transition-all dark:text-white uppercase ${isResolving ? 'animate-pulse text-transparent' : ''}`}
                    required
                  />
                  {isResolving && (
                    <div className="absolute inset-y-0 left-4 flex items-center">
                       <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                       <span className="ml-2 text-sm text-slate-500 font-medium">Fetching details...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isAddingAccount || !bankName || accountNumber.length < 10 || !accountName || isResolving}
                className="w-full mt-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold tracking-wide transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isAddingAccount ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Save Bank Account
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {accountToRemove && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAccountToRemove(null)}></div>
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center pb-safe sm:pb-6"
          >
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Remove Bank Account?</h3>
            <p className="text-sm text-slate-500 mb-8">Are you sure you want to unlink this bank account? You will need to verify it again if you add it back.</p>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setAccountToRemove(null)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveAccount}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors active:scale-95"
              >
                Remove
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isSetupPinModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsSetupPinModalOpen(false); setPin(['', '', '', '']); }}></div>
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 pb-safe sm:pb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Wallet PIN</h3>
              <button type="button" onClick={() => { setIsSetupPinModalOpen(false); setPin(['', '', '', '']); }} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">For extra security, you need a 4-digit PIN to withdraw funds from your wallet.</p>

            {pinError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 mb-4 mb-4 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>{pinError}</p>
              </div>
            )}

            <form onSubmit={handleSetupPin} className="space-y-4">
              {setupStep === 'create' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Set your 4-digit PIN</label>
                  <div className="flex gap-3 justify-between">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={`setup-pin-${index}`}
                        type="password"
                        inputMode="numeric"
                        ref={pinInputRefs[index]}
                        value={pin[index]}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                        maxLength={1}
                        className="w-14 h-14 text-center text-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                        required
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Confirm your PIN</label>
                  <div className="flex gap-3 justify-between">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={`confirm-pin-${index}`}
                        type="password"
                        inputMode="numeric"
                        ref={confirmPinInputRefs[index]}
                        value={confirmPin[index]}
                        onChange={(e) => handleConfirmPinChange(index, e.target.value)}
                        onKeyDown={(e) => handleConfirmPinKeyDown(index, e)}
                        maxLength={1}
                        className="w-14 h-14 text-center text-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                        required
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isPinVerifying || (setupStep === 'create' ? pin.some(p => !p) : confirmPin.some(p => !p))}
                className="w-full mt-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold tracking-wide transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isPinVerifying ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    {setupStep === 'create' ? 'Next' : <><ShieldCheck className="w-4 h-4" /> Save PIN</>}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsWithdrawModalOpen(false); setPin(['', '', '', '']); }}></div>
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 pb-safe sm:pb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Withdraw Funds</h3>
              <button type="button" onClick={() => { setIsWithdrawModalOpen(false); setPin(['', '', '', '']); }} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            {pinError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>{pinError}</p>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Amount (₦)</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Bank Account</label>
                <select 
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                  required
                >
                  <option value="" disabled>Select an account</option>
                  {(user?.bankAccounts || []).map((acc: any) => (
                    <option key={acc.id} value={acc.id}>{acc.bankName} - ****{String(acc.accountNumber).slice(-4)}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Confirm with PIN</label>
                  <button type="button" onClick={() => { setIsWithdrawModalOpen(false); setPin(['', '', '', '']); setResetContact(''); setResetMethod('phone'); setResetSent(false); setIsForgotPinModalOpen(true); }} className="text-xs font-bold text-primary-600 hover:text-primary-500 transition-colors">Forgot PIN?</button>
                </div>
                <div className="flex gap-3 justify-between">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={`pin-${index}`}
                      type="password"
                      inputMode="numeric"
                      ref={pinInputRefs[index]}
                      value={pin[index]}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      maxLength={1}
                      className="w-14 h-14 text-center text-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
                      required
                    />
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isWithdrawing || !withdrawAmount || !selectedBankAccountId}
                className="w-full mt-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold tracking-wide transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isWithdrawing ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" /> Withdraw Now
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {isForgotPinModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsForgotPinModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, y: "100%" }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: "100%" }}
            className="relative w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 pb-safe pb-8 sm:pb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Reset Wallet PIN</h3>
              <button type="button" onClick={() => setIsForgotPinModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reset Link Sent!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We've sent instructions to reset your PIN to <span className="font-bold">{resetMethod === 'phone' ? user?.phoneNumber : user?.email}</span>.
                </p>
                <button onClick={() => setIsForgotPinModalOpen(false)} className="mt-6 w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl active:scale-[0.98] transition-all">Close</button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  We'll send you a secure link to reset your wallet PIN to the contact associated with your account.
                </p>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    {resetMethod === 'phone' ? 'Phone Number' : 'Email Address'}
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                       {resetMethod === 'phone' ? (
                         <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center"><Phone className="w-3 h-3" /></span>
                       ) : (
                         <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center"><Mail className="w-3 h-3" /></span>
                       )}
                       {resetMethod === 'phone' ? (user?.phoneNumber || "Phone not added") : (user?.email || "Email not added")}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const hasContact = resetMethod === 'phone' ? !!user?.phoneNumber : !!user?.email;
                    if (hasContact) {
                      setIsSendingReset(true);
                      setTimeout(() => { setIsSendingReset(false); setResetSent(true); }, 1500);
                    }
                  }}
                  disabled={isSendingReset || (resetMethod === 'phone' ? !user?.phoneNumber : !user?.email)}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold tracking-wide transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center h-[52px]"
                >
                  {isSendingReset ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Send Reset Link'}
                </button>
                
                <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setResetMethod(prev => prev === 'phone' ? 'email' : 'phone')} 
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-wider"
                  >
                    Use {resetMethod === 'phone' ? 'mail reset link' : 'SMS OTP'} instead
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
