
import React, { useState } from 'react';
import { getTransactions } from '../api';

interface ManagementLoginProps {
    onLoginSuccess: (pin: string) => void;
}

const ManagementLogin: React.FC<ManagementLoginProps> = ({ onLoginSuccess }) => {
    const [inputPin, setInputPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!inputPin) {
            setError('PIN cannot be empty.');
            return;
        }
        setIsLoading(true);

        try {
            // We call getTransactions here simply to verify the pin.
            // The API will throw an error if the pin is invalid.
            await getTransactions(inputPin);
            onLoginSuccess(inputPin);
        } catch (err) {
            setError('Invalid PIN. Access denied.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-md">
                <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">BLOOM STUDIOS KENYA</h1>
                        <h2 className="text-xl text-slate-600 dark:text-slate-400 mt-1">Management Access</h2>
                        <p className="text-center text-slate-500 dark:text-slate-400 mt-4">Enter your PIN to continue</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="pin">
                            PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            value={inputPin}
                            onChange={(e) => setInputPin(e.target.value)}
                            placeholder="••••••"
                            className="shadow appearance-none border rounded w-full py-3 px-4 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? 'Verifying...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManagementLogin;