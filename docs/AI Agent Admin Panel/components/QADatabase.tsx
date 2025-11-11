import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useCurrentBotData } from '../store/useAppStore';
import { apiService } from '../services/apiService';
import { type QAItem } from '../types';
import { AddIcon, DeleteIcon } from './icons';
import Modal from './Modal';
import { usePagination } from '../hooks/usePagination';

const QADatabase: React.FC = () => {
    const currentBot = useCurrentBotData();
    const qaData = currentBot?.qaDatabase || [];
    const importFileRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState<'closed' | 'add' | 'edit'>('closed');
    const [selectedItem, setSelectedItem] = useState<QAItem | null>(null);
    const [formState, setFormState] = useState<Omit<QAItem, 'id'>>({ question: '', answer: '', tags: [] });
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
    
    const filteredData = useMemo(() => {
        return qaData.filter(item =>
            item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [qaData, searchTerm]);

    const {
        paginatedData,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        goToPage,
        totalItems
    } = usePagination(filteredData, 10);

    useEffect(() => {
        if (modalState === 'edit' && selectedItem) {
            setFormState({
              question: selectedItem.question,
              answer: selectedItem.answer,
              tags: selectedItem.tags || []
            });
        } else {
            setFormState({ question: '', answer: '', tags: [] });
        }
    }, [modalState, selectedItem]);

    const handleTagsChange = (value: string) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
        setFormState(prev => ({ ...prev, tags }));
    };

    const handleSave = async () => {
        if (!formState.question.trim() || !formState.answer.trim()) {
            toast.error('Question and Answer cannot be empty.');
            return;
        }

        if (modalState === 'add') {
            await apiService.addQaItem(formState);
        } else if (modalState === 'edit' && selectedItem) {
            await apiService.apiUpdateQaItem({ ...formState, id: selectedItem.id });
        }
        
        setModalState('closed');
    };
    
    const handleDelete = async () => {
        if (deletingItemId) {
            await apiService.apiDeleteQaItem(deletingItemId);
            setDeletingItemId(null);
        }
    };
    
    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            apiService.apiImportQA(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Q&A Database</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input type="file" ref={importFileRef} className="hidden" onChange={handleFileImport} accept=".json,.csv" />
                        <button onClick={handleImportClick} className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Import</button>
                        <button onClick={() => apiService.apiExportData(filteredData, 'qa_database.csv')} className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Export ({totalItems})</button>
                        <button onClick={() => setModalState('add')} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm">
                            <AddIcon className="w-5 h-5 mr-1" />
                            Add New
                        </button>
                    </div>
                </div>
                 <input type="search" placeholder="Search Q&A..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 mb-4 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"/>

                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Question</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Answer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tags</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => { setSelectedItem(item); setModalState('edit'); }}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.question}</td>
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">{item.answer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-wrap gap-1">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={(e) => { e.stopPropagation(); setDeletingItemId(item.id); }} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                            <DeleteIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No matching Q&A pairs found.</p>}
                </div>
                 {/* Pagination Controls */}
                <div className="pt-4 flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total: {totalItems}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={nextPage} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>

            <Modal isOpen={modalState !== 'closed'} onClose={() => setModalState('closed')} title={modalState === 'add' ? 'Add New Q&A' : 'Edit Q&A Record'} footer={
                <>
                    <button onClick={() => setModalState('closed')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Save</button>
                </>
            }>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Question</label>
                        <input type="text" value={formState.question} onChange={e => setFormState({...formState, question: e.target.value})} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Answer</label>
                        <textarea value={formState.answer} onChange={e => setFormState({...formState, answer: e.target.value})} rows={4} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma-separated)</label>
                        <input type="text" value={formState.tags.join(', ')} onChange={e => handleTagsChange(e.target.value)} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white" />
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!deletingItemId} onClose={() => setDeletingItemId(null)} title="Confirm Deletion" footer={
                <>
                    <button onClick={() => setDeletingItemId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                </>
            }>
                <p>Are you sure you want to delete this Q&A record? This action cannot be undone.</p>
            </Modal>
        </>
    );
};

export default QADatabase;