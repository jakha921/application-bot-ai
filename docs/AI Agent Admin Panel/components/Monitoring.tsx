import React, { useState, useMemo } from 'react';
import { useCurrentBotData } from '../store/useAppStore';
import { type ConversationLog } from '../types';
import { usePagination } from '../hooks/usePagination';
import Modal from './Modal';
import { apiService } from '../services/apiService';

const Monitoring: React.FC = () => {
    const currentBot = useCurrentBotData();
    const logs = currentBot?.conversationLogs || [];
    const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
    const [searchState, setSearchState] = useState({
        question: '',
        answer: '',
        tags: ''
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSearchState(prev => ({ ...prev, [name]: value }));
    };

    const filteredData = useMemo(() => {
        const searchTags = searchState.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        
        return logs.filter(item => {
          const questionMatch = item.question.toLowerCase().includes(searchState.question.toLowerCase());
          const answerMatch = item.answer.toLowerCase().includes(searchState.answer.toLowerCase());
          
          const tagsMatch = searchTags.length === 0 
            ? true 
            : searchTags.every(st => item.tags.some(it => it.toLowerCase().includes(st)));
            
          return questionMatch && answerMatch && tagsMatch;
        });
      }, [logs, searchState]);

    const {
        paginatedData,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        totalItems
    } = usePagination(filteredData, 10);

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Conversation Logs</h2>
                     <button 
                        onClick={() => apiService.apiExportData(filteredData, 'chat_logs.csv')}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                        Export ({totalItems})
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border dark:border-gray-700 rounded-lg">
                    <input name="question" placeholder="Filter by question..." value={searchState.question} onChange={handleSearchChange} className="w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"/>
                    <input name="answer" placeholder="Filter by answer..." value={searchState.answer} onChange={handleSearchChange} className="w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"/>
                    <input name="tags" placeholder="Filter by tags (comma-sep)..." value={searchState.tags} onChange={handleSearchChange} className="w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"/>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {paginatedData.length > 0 ? (
                        <div className="space-y-3">
                            {paginatedData.map(log => (
                                <button 
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                            {log.modelUsed}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">Q: {log.question}</p>
                                        <p className="mt-1 text-gray-600 dark:text-gray-400 truncate">A: {log.answer}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {log.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">{tag}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 flex items-center justify-center h-full">
                            <p className="text-gray-500 dark:text-gray-400">No logs match your search criteria.</p>
                        </div>
                    )}
                </div>
                 <div className="pt-4 flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total: {totalItems}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={nextPage} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Log Details"
                footer={
                    <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Close</button>
                }
            >
                {selectedLog && (
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Timestamp</p>
                            <p className="text-gray-800 dark:text-gray-200">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Model Used</p>
                            <p className="font-mono text-gray-800 dark:text-gray-200">{selectedLog.modelUsed}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Tags</p>
                             <div className="flex flex-wrap gap-1 mt-1">
                                {selectedLog.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900 dark:text-purple-200">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Question</p>
                            <p className="p-2 mt-1 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap">{selectedLog.question}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Answer</p>
                            <p className="p-2 mt-1 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap">{selectedLog.answer}</p>
                        </div>
                         {selectedLog.sources && selectedLog.sources.length > 0 && (
                            <div>
                                <p className="font-semibold text-gray-600 dark:text-gray-400">Sources</p>
                                <ul className="mt-1 space-y-1">
                                    {selectedLog.sources.map((source, i) => (
                                        <li key={i}>
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline truncate block">
                                               {source.title || source.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default Monitoring;