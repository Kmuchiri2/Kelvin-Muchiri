import type { Transaction, NewTransaction, PublicNewTransaction } from './types';
import { toDate } from './utils';

const MOCK_LATENCY = 500; // ms

const defaultTransactions: Omit<Transaction, 'id'>[] = [
    {
        type: 'income',
        category: 'Studio Income',
        details: 'Wedding Photoshoot',
        amount: 5000,
        date: new Date(new Date().setDate(1)).toISOString(),
        status: 'confirmed',
        user: null,
        isBusiness: true,
    },
    {
        type: 'expense',
        category: 'Office Rent',
        amount: 1500,
        date: new Date(new Date().setDate(5)).toISOString(),
        status: 'confirmed',
        user: null,
        isBusiness: true,
    },
    {
        type: 'income',
        category: 'Outdoor Events Income',
        details: 'Corporate Event Coverage',
        amount: 1200,
        date: new Date(new Date().setDate(15)).toISOString(),
        status: 'pending',
        user: 'Kelvin',
        isBusiness: false,
        dueDate: new Date(new Date().setDate(25)).toISOString(),
    },
     {
        type: 'income',
        category: 'Studio Income',
        details: 'Product Photography',
        amount: 2500,
        date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        status: 'confirmed',
        user: null,
        isBusiness: true,
    },
    {
        type: 'expense',
        category: 'Software Subscription',
        amount: 150,
        date: new Date(new Date().setDate(20)).toISOString(),
        status: 'confirmed',
        user: 'Brian',
        isBusiness: false,
    },
];

const getDb = () => {
    let transactionsStr = localStorage.getItem('transactions');
    let settingsStr = localStorage.getItem('settings');

    if (!transactionsStr || !settingsStr) {
        console.log('Initializing mock database in localStorage...');
        const transactions = defaultTransactions.map((tx, index) => ({
            ...tx,
            id: `tx_${Date.now()}_${index}`,
        }));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('settings', JSON.stringify({ pin: '199542' }));
        return { transactions, settings: { pin: '199542' } };
    }
    
    return {
        transactions: JSON.parse(transactionsStr) as Transaction[],
        settings: JSON.parse(settingsStr) as { pin: string },
    };
};

const saveTransactions = (transactions: Transaction[]) => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
};

const verifyPin = (pin: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const { settings } = getDb();
            if (pin === settings.pin) {
                resolve();
            } else {
                reject(new Error('Invalid PIN'));
            }
        }, MOCK_LATENCY / 2);
    });
};

export const getPublicTransactions = (): Promise<Transaction[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const { transactions } = getDb();
            const sorted = transactions.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
            resolve(sorted);
        }, MOCK_LATENCY);
    });
};


export const getTransactions = (pin: string): Promise<Transaction[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            await verifyPin(pin);
            const { transactions } = getDb();
            // Sort by date descending
            const sorted = transactions.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
            resolve(sorted);
        } catch (error) {
            reject(error);
        }
    });
};

export const addTransaction = (pin: string, newTx: NewTransaction): Promise<{ id: string }> => {
    return new Promise(async (resolve, reject) => {
        try {
            await verifyPin(pin);
            const { transactions } = getDb();
            const newId = `tx_${Date.now()}`;
            const transactionToAdd: Transaction = {
                ...newTx,
                id: newId,
            };
            const updatedTransactions = [...transactions, transactionToAdd];
            saveTransactions(updatedTransactions);
            resolve({ id: newId });
        } catch (error) {
            reject(error);
        }
    });
};

export const addPublicTransaction = (newTx: PublicNewTransaction): Promise<{ id: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const { transactions } = getDb();
            const newId = `tx_${Date.now()}`;
            const transactionToAdd: Transaction = {
                ...newTx,
                id: newId,
                date: new Date().toISOString(),
                user: null,
                isBusiness: true, // Assume public entries are for the business
            };
            const updatedTransactions = [...transactions, transactionToAdd];
            saveTransactions(updatedTransactions);
            resolve({ id: newId });
        }, MOCK_LATENCY);
    });
};

export const confirmTransaction = (pin: string, txId: string): Promise<{ success: boolean }> => {
    return new Promise(async (resolve, reject) => {
        try {
            await verifyPin(pin);
            const { transactions } = getDb();
            const txIndex = transactions.findIndex(tx => tx.id === txId);
            if (txIndex === -1) {
                return reject(new Error('Transaction not found'));
            }
            transactions[txIndex].status = 'confirmed';
            saveTransactions(transactions);
            resolve({ success: true });
        } catch (error) {
            reject(error);
        }
    });
};