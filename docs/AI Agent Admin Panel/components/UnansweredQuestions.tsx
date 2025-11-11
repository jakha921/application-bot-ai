import React, { useState, useMemo } from 'react';
import { useCurrentBotData } from '../store/useAppStore';
import { apiService } from '../services/apiService';
import { type UnansweredQuestion } from '../types';
import Modal from './Modal';
import { toast } from 'react-hot-toast';
import { usePagination } from '../hooks/usePagination';

const UnansweredQuestions: React.FC = () => {
    const currentBot = useCurrentBotData();
    const questions = currentBot?.unansweredQuestions || [];
    
    const [editingItem, setEditingItem] = useState<UnansweredQuestion | null>(null);
    const [answer, setAnswer] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [tagSearchTerm, setTagSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        const searchTags = tagSearchTerm.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        
        return questions.filter(item => {
          const questionMatch = item.question.toLowerCase().includes(searchTerm.toLowerCase());
          
          const tagsMatch = searchTags.length === 0 
            ? true 
            : searchTags.every(st => item.tags.some(it => it.toLowerCase().includes(st)));
            
          return questionMatch && tagsMatch;
        });
      }, [questions, searchTerm, tagSearchTerm]);

    const {
        paginatedData,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        totalItems
    } = usePagination(filteredData, 10);

    const handleStartEditing = (item: UnansweredQuestion) => {
        setEditingItem(item);
        setAnswer('');
    };

    const handleCancel = () => {
        setEditingItem(null);
        setAnswer('');
    };

    const handleSave = async () => {
        if (!editingItem) return;
        if (!answer.trim()) {
            toast.error('Answer cannot be empty.');
            return;
        }
        
        await apiService.apiConvertUnansweredToQA(editingItem, answer);
        
        handleCancel();
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Unanswered Questions</h2>
                    <button 
                        onClick={() => apiService.apiExportData(filteredData, 'unanswered.csv')}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                        Export ({totalItems})
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        type="search" 
                        placeholder="Search by question text..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                     <input 
                        type="search" 
                        placeholder="Search by tags (e.g., shipping,policy)..." 
                        value={tagSearchTerm} 
                        onChange={e => setTagSearchTerm(e.target.value)} 
                        className="w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    {paginatedData.length > 0 ? (
                        <div className="space-y-4">
                            {paginatedData.map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => handleStartEditing(q)}
                                    className="w-full text-left p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex justify-between items-start hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors"
                                >
                                    <div className="flex-grow">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">{q.question}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {q.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full dark:bg-yellow-800 dark:text-yellow-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 h-full flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400">No matching unanswered questions found.</p>
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
                isOpen={!!editingItem}
                onClose={handleCancel}
                title="Add to Knowledge Base"
                footer={
                    <>
                        <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                            Save and Add
                        </button>
                    </>
                }
            >
                {editingItem && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question</label>
                            <p className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200">{editingItem.question}</p>
                        </div>
                        <div>
                            <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Answer</label>
                            <textarea
                                id="answer-input"
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                rows={5}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Provide a clear and concise answer..."
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default UnansweredQuestions;