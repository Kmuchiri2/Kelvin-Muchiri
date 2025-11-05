import React from 'react';

interface MonthSelectorProps {
    selectedMonth: Date;
    onMonthChange: (newMonth: Date) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => {
    const handlePrevMonth = () => {
        const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
        onMonthChange(newMonth);
    };

    const handleNextMonth = () => {
        const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
        onMonthChange(newMonth);
    };

    const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-6">
            <button onClick={handlePrevMonth} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                &lt; Prev
            </button>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white w-48 text-center">{monthName}</h2>
            <button onClick={handleNextMonth} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                Next &gt;
            </button>
        </div>
    );
};

export default MonthSelector;
