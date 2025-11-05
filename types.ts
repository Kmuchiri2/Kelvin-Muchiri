
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  details?: string;
  amount: number;
  date: { // Firestore timestamp format
    _seconds: number;
    _nanoseconds: number;
  } | string;
  status: 'confirmed' | 'pending';
  user: string | null;
  dueDate?: {
    _seconds: number;
    _nanoseconds: number;
  } | string | null;
  isBusiness: boolean;
}

export interface NewTransaction {
  type: 'income' | 'expense';
  category: string;
  details?: string;
  amount: number;
  date: string;
  status: 'confirmed' | 'pending';
  user: string | null;
  dueDate?: string | null;
  isBusiness: boolean;
}

export interface PublicNewTransaction {
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'confirmed' | 'pending';
  details?: string;
}


export interface SummaryData {
  totalIncome: number;
  pendingIncome: number;
  totalExp: number;
  pendingExp: number;
  netBalance: number;
}