import React from 'react';

interface MockChartProps {
  type: 'bar' | 'line';
  title: string;
}

const BarChart: React.FC = () => {
    const data = [
        { label: 'shipping', value: 85 },
        { label: 'policy', value: 65 },
        { label: 'payment', value: 40 },
        { label: 'orders', value: 30 },
        { label: 'general', value: 22 },
    ];

    return (
        <div className="flex justify-around items-end h-48 w-full p-4 space-x-2">
            {data.map(item => (
                <div key={item.label} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-primary-500 rounded-t-lg" style={{ height: `${item.value}%` }}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const LineChart: React.FC = () => (
    <div className="h-48 w-full p-4 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 50">
            <polyline
                fill="none"
                stroke="currentColor"
                className="text-primary-500"
                strokeWidth="2"
                points="0,45 10,30 20,35 30,20 40,25 50,10 60,15 70,5 80,10 90,20 100,25"
            />
        </svg>
    </div>
);


const MockChart: React.FC<MockChartProps> = ({ type, title }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-full flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex-grow">
            {type === 'bar' ? <BarChart /> : <LineChart />}
        </div>
    </div>
  );
};

export default MockChart;