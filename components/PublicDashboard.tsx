
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SummaryData, Transaction } from '../types';
import { getPublicTransactions, addPublicTransaction } from '../api';
import { toDate } from '../utils';
import MonthSelector from './MonthSelector';

const SummaryCard: React.FC<{ title: string; value: number; color: string; currency?: string }> = ({ title, value, color, currency = 'Ksh ' }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</h3>
        <p className={`mt-1 text-3xl font-semibold ${color}`}>{currency}{value.toLocaleString()}</p>
    </div>
);

// Form for public transaction entry
interface PublicFormState {
    category: string;
    amount: string;
    type: 'income' | 'expense';
    status: 'confirmed' | 'pending';
    details: string;
}

const PublicTransactionForm: React.FC<{ onTransactionAdded: () => void }> = ({ onTransactionAdded }) => {
    const initialState: PublicFormState = {
        category: 'Studio Income',
        amount: '',
        type: 'income',
        status: 'confirmed',
        details: '',
    };
    const [formState, setFormState] = useState<PublicFormState>(initialState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'type') {
            setFormState(prev => ({
                ...prev,
                type: value as 'income' | 'expense',
                category: value === 'income' ? 'Studio Income' : '',
                details: '',
            }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!formState.category || !formState.amount || parseFloat(formState.amount) <= 0) {
            setError('Please fill in a valid description and amount.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addPublicTransaction({
                ...formState,
                amount: parseFloat(formState.amount),
            });
            setFormState(initialState);
            setSuccess('Transaction added successfully!');
            onTransactionAdded(); // Callback to refresh summary
        } catch (err) {
            setError('Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Add Public Transaction</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {formState.type === 'income' ? (
                     <>
                        <select name="category" value={formState.category} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                            <option value="Studio Income">Studio Income</option>
                            <option value="Outdoor Events Income">Outdoor Events Income</option>
                        </select>
                        <input type="text" name="details" value={formState.details} onChange={handleInputChange} placeholder="e.g., Wedding Photoshoot" className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                    </>
                ) : (
                    <input type="text" name="category" value={formState.category} onChange={handleInputChange} placeholder="Expenditure Description" required className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 lg:col-span-2" />
                )}
                <input type="number" name="amount" value={formState.amount} onChange={handleInputChange} placeholder="Amount" required className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                <select name="type" value={formState.type} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
                <select name="status" value={formState.status} onChange={handleInputChange} className="p-2 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                </select>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white p-2 rounded col-span-full lg:col-span-1 disabled:bg-blue-400">
                    {isSubmitting ? 'Adding...' : 'Add'}
                </button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {success && <p className="text-green-500 text-xs mt-2">{success}</p>}
        </div>
    );
};


const PublicDashboard: React.FC = () => {
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const data: Transaction[] = await getPublicTransactions();
            setAllTransactions(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const monthlySummary = useMemo<SummaryData>(() => {
        const filtered = allTransactions.filter(tx => {
            const txDate = toDate(tx.date);
            return txDate.getFullYear() === selectedMonth.getFullYear() && txDate.getMonth() === selectedMonth.getMonth();
        });

        const summary = filtered.reduce(
            (acc, tx) => {
                if (tx.type === 'income') {
                    if (tx.status === 'confirmed') acc.totalIncome += tx.amount;
                    else acc.pendingIncome += tx.amount;
                } else if (tx.type === 'expense') {
                    if (tx.status === 'confirmed') acc.totalExp += tx.amount;
                    else acc.pendingExp += tx.amount;
                }
                return acc;
            },
            { totalIncome: 0, pendingIncome: 0, totalExp: 0, pendingExp: 0, netBalance: 0 }
        );
        summary.netBalance = summary.totalIncome - summary.totalExp;
        return summary;
    }, [allTransactions, selectedMonth]);


    const chartData = monthlySummary ? [
        { name: 'Income', Confirmed: monthlySummary.totalIncome, Pending: monthlySummary.pendingIncome },
        { name: 'Expenditure', Confirmed: monthlySummary.totalExp, Pending: monthlySummary.pendingExp },
    ] : [];

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">BLOOM STUDIOS KENYA</h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Public Financial Summary</p>
            </div>
            
            <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard title="Net Balance" value={monthlySummary.netBalance} color="text-blue-500 dark:text-blue-400" />
                <SummaryCard title="Total Income (Confirmed + Pending)" value={monthlySummary.totalIncome + monthlySummary.pendingIncome} color="text-green-500 dark:text-green-400" />
                <SummaryCard title="Total Expenditure (Confirmed + Pending)" value={monthlySummary.totalExp + monthlySummary.pendingExp} color="text-red-500 dark:text-red-400" />
            </div>
            
            <PublicTransactionForm onTransactionAdded={fetchTransactions} />

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Income vs Expenditure Breakdown</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                border: '1px solid #334155',
                                color: '#f1f5f9'
                            }}
                            cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="Confirmed" stackId="a" fill="#22c55e" />
                        <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PublicDashboard;