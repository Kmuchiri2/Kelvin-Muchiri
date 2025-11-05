
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Transaction, NewTransaction } from '../types';
import { getTransactions, addTransaction, confirmTransaction } from '../api';
import { toDate, formatDate } from '../utils';
import MonthSelector from './MonthSelector';

const USERS = ['Kelvin', 'Brian', 'Namis', 'Natenge'];

// SummaryCard Component
const SummaryCard: React.FC<{ title: string; value: number; color: string; currency?: string }> = ({ title, value, color, currency = 'Ksh ' }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</h3>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>{currency}{value.toLocaleString()}</p>
    </div>
);

// TransactionForm Component
const TransactionForm: React.FC<{ pin: string; onTransactionAdded: () => void }> = ({ pin, onTransactionAdded }) => {
    const initialState: NewTransaction = {
        type: 'income',
        category: 'Studio Income',
        details: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        status: 'confirmed',
        user: null,
        dueDate: '',
        isBusiness: true,
    };
    const [newTx, setNewTx] = useState<NewTransaction>(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setNewTx(prev => ({ ...prev, isBusiness: checked, user: checked ? null : prev.user }));
        } else {
            if (name === 'type') {
                 setNewTx(prev => ({
                    ...prev,
                    type: value as 'income' | 'expense',
                    category: value === 'income' ? 'Studio Income' : '',
                    details: '',
                }));
            } else {
                setNewTx(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addTransaction(pin, { ...newTx, amount: Number(newTx.amount) });
            setNewTx(initialState);
            onTransactionAdded();
        } catch (error) {
            console.error("Failed to add transaction:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <select name="type" value={newTx.type} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
                {newTx.type === 'income' ? (
                     <>
                        <select name="category" value={newTx.category} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                            <option value="Studio Income">Studio Income</option>
                            <option value="Outdoor Events Income">Outdoor Events Income</option>
                        </select>
                        <input type="text" name="details" value={newTx.details || ''} onChange={handleInputChange} placeholder="Income details (e.g., photoshoot)" className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                    </>
                ) : (
                    <input type="text" name="category" value={newTx.category} onChange={handleInputChange} placeholder="Expenditure Description" required className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 md:col-span-2" />
                )}
                <input type="number" name="amount" value={newTx.amount} onChange={handleInputChange} placeholder="Amount" required className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                <input type="date" name="date" value={newTx.date} onChange={handleInputChange} required className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                <select name="status" value={newTx.status} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                </select>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isBusiness" name="isBusiness" checked={newTx.isBusiness} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                    <label htmlFor="isBusiness">Business</label>
                </div>
                {!newTx.isBusiness && (
                    <select name="user" value={newTx.user || ''} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <option value="">Select User</option>
                        {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                )}
                <input type="date" name="dueDate" value={newTx.dueDate || ''} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white p-2 rounded col-span-full md:col-span-1 disabled:bg-blue-400">
                    {isSubmitting ? 'Adding...' : 'Add Transaction'}
                </button>
            </form>
        </div>
    );
};


interface ManagementDashboardProps {
    pin: string;
    onLogout: () => void;
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ pin }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const [filterUser, setFilterUser] = useState('all');
    const [filterType, setFilterType] = useState('all'); // all, business, personal

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const data: Transaction[] = await getTransactions(pin);
            setTransactions(data);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pin]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleConfirm = async (id: string) => {
        try {
            await confirmTransaction(pin, id);
            fetchTransactions();
        } catch (error) {
            console.error('Failed to confirm transaction:', error);
        }
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = toDate(tx.date);
            const monthMatch = txDate.getFullYear() === selectedMonth.getFullYear() && txDate.getMonth() === selectedMonth.getMonth();
            if (!monthMatch) return false;

            const userMatch = filterUser === 'all' || tx.user === filterUser;
            const typeMatch = filterType === 'all' || (filterType === 'business' && tx.isBusiness) || (filterType === 'personal' && !tx.isBusiness);
            return userMatch && typeMatch;
        });
    }, [transactions, filterUser, filterType, selectedMonth]);

    const summary = useMemo(() => {
        return filteredTransactions.reduce((acc, tx) => {
            if (tx.type === 'income') {
                if (tx.status === 'confirmed') acc.totalIncome += tx.amount;
                else acc.pendingIncome += tx.amount;
            } else if (tx.type === 'expense') {
                if (tx.status === 'confirmed') acc.totalExp += tx.amount;
                else acc.pendingExp += tx.amount;
            }
            return acc;
        }, { totalIncome: 0, pendingIncome: 0, totalExp: 0, pendingExp: 0 });
    }, [filteredTransactions]);

    const exportPDF = () => {
        const doc = new jsPDF();
        (doc as any).autoTable({
            head: [['Date', 'Category', 'Details', 'Type', 'Amount', 'Status', 'User/Business']],
            body: filteredTransactions.map(tx => [
                formatDate(tx.date),
                tx.category,
                tx.details || 'N/A',
                tx.type,
                `Ksh ${tx.amount.toFixed(2)}`,
                tx.status,
                tx.isBusiness ? 'Business' : tx.user
            ])
        });
        doc.save('transactions_report.pdf');
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(tx => ({
            Date: formatDate(tx.date),
            Category: tx.category,
            Details: tx.details || '',
            Type: tx.type,
            Amount: tx.amount,
            Status: tx.status,
            'User/Business': tx.isBusiness ? 'Business' : tx.user,
            'Due Date': tx.dueDate ? formatDate(tx.dueDate) : 'N/A'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        XLSX.writeFile(workbook, 'transactions_report.xlsx');
    };
    
    const dailyChartData = useMemo(() => {
        const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
        const dailyData: Record<string, {name: string, income: number, expense: number}> = {};

        for (let i = 1; i <= daysInMonth; i++) {
            dailyData[i] = { name: `${i}`, income: 0, expense: 0 };
        }

        filteredTransactions.forEach(tx => {
            if (tx.status !== 'confirmed') return;

            const day = toDate(tx.date).getDate();
            if (dailyData[day]) {
                if (tx.type === 'income') {
                    dailyData[day].income += tx.amount;
                } else if (tx.type === 'expense') {
                    dailyData[day].expense += tx.amount;
                }
            }
        });
        return Object.values(dailyData);
    }, [filteredTransactions, selectedMonth]);

    const incomeSourceComparisonData = useMemo(() => {
        const incomeSources: Record<string, { Confirmed: number; Pending: number }> = {
            'Studio Income': { Confirmed: 0, Pending: 0 },
            'Outdoor Events Income': { Confirmed: 0, Pending: 0 },
        };

        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') {
                if (tx.category === 'Studio Income' || tx.category === 'Outdoor Events Income') {
                    if (tx.status === 'confirmed') {
                        incomeSources[tx.category].Confirmed += tx.amount;
                    } else {
                        incomeSources[tx.category].Pending += tx.amount;
                    }
                }
            }
        });

        return [
            { name: 'Studio', ...incomeSources['Studio Income'] },
            { name: 'Outdoor', ...incomeSources['Outdoor Events Income'] },
        ];
    }, [filteredTransactions]);


    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
    if (error) return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">BLOOM STUDIOS KENYA</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Management Dashboard</p>
            </div>
            
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

            {/* Filters and Exports */}
            <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-4">
                    <select onChange={(e) => setFilterUser(e.target.value)} value={filterUser} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <option value="all">All Users</option>
                        {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <select onChange={(e) => setFilterType(e.target.value)} value={filterType} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        <option value="all">All Types</option>
                        <option value="business">Business</option>
                        <option value="personal">Personal</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportPDF} className="bg-red-600 text-white p-2 rounded shadow hover:bg-red-700">Export PDF</button>
                    <button onClick={exportExcel} className="bg-green-600 text-white p-2 rounded shadow hover:bg-green-700">Export Excel</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Confirmed Income" value={summary.totalIncome} color="text-green-500" />
                <SummaryCard title="Pending Income" value={summary.pendingIncome} color="text-yellow-500" />
                <SummaryCard title="Confirmed Expense" value={summary.totalExp} color="text-red-500" />
                <SummaryCard title="Pending Expense" value={summary.pendingExp} color="text-orange-500" />
            </div>

            <TransactionForm pin={pin} onTransactionAdded={fetchTransactions} />

            {/* Transaction List */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Transactions for {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="p-2">Date</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Owner</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className={`border-b dark:border-slate-700 ${tx.status === 'pending' ? 'bg-yellow-100/10' : ''}`}>
                                    <td className="p-2">{formatDate(tx.date)}</td>
                                    <td className="p-2">
                                        {tx.category}
                                        {tx.details && <div className="text-xs text-slate-500 dark:text-slate-400">{tx.details}</div>}
                                    </td>
                                    <td className={`p-2 font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{tx.type}</td>
                                    <td className="p-2">Ksh {tx.amount.toLocaleString()}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'pending' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="p-2">{tx.isBusiness ? 'Business' : tx.user}</td>
                                    <td className="p-2">
                                        {tx.status === 'pending' && <button onClick={() => handleConfirm(tx.id)} className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600">Confirm</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Income Source Comparison Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Income Source Comparison for {selectedMonth.toLocaleString('default', { month: 'long' })}</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incomeSourceComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8"/>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155' }}/>
                        <Legend />
                        <Bar dataKey="Confirmed" stackId="a" fill="#22c55e" />
                        <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            {/* Daily Overview Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Daily Overview for {selectedMonth.toLocaleString('default', { month: 'long' })} (Confirmed)</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dailyChartData}>
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                        <XAxis dataKey="name" stroke="#94a3b8" unit=""/>
                        <YAxis stroke="#94a3b8"/>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid #334155' }}/>
                        <Legend />
                        <Bar dataKey="income" fill="#22c55e" name="Income" />
                        <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ManagementDashboard;