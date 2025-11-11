import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/apiService';
import { useCredentialVault } from '../store/useAppStore';
import { type CredentialVaultItem, type ModelProvider } from '../types';
import { DeleteIcon, AddIcon, EditIcon, EyeIcon, EyeOffIcon } from './icons';
import Modal from './Modal';

const KeyVaultManagement: React.FC = () => {
    const vault = useCredentialVault();
    const [isLoading, setIsLoading] = useState(false); // Can be used if fetch is slow
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CredentialVaultItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        provider: 'gemini' as ModelProvider,
        apiKey: '',
    });
    const [isKeyVisible, setIsKeyVisible] = useState(false);

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({ name: '', provider: 'gemini', apiKey: '' });
        setIsKeyVisible(false);
        setIsModalOpen(true);
    };

    const openEditModal = (item: CredentialVaultItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            provider: item.provider,
            apiKey: item.apiKey,
        });
        setIsKeyVisible(false);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.apiKey.trim()) {
            return toast.error("Name and API Key are required.");
        }

        if (editingItem) {
            await apiService.updateCredential(editingItem.id, formData);
        } else {
            await apiService.addCredential(formData.name, formData.provider, formData.apiKey);
        }
        
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure? Deleting a key will unassign it from all bots using it.")) {
            await apiService.deleteCredential(id);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Credential Key Vault</h2>
                    <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        <AddIcon className="w-5 h-5 mr-2" /> Add Credential
                    </button>
                </div>
                
                <div className="flex-grow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Key</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr>
                        ) : (
                            vault.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">{item.provider}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">************{item.apiKey.slice(-4)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => openEditModal(item)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><DeleteIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'Edit Credential' : 'Add New Credential'} footer={
                <>
                    <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button form="credential-form" type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Save</button>
                </>
            }>
                <form id="credential-form" onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Credential Name</label>
                        <input name="name" type="text" value={formData.name} onChange={handleFormChange} placeholder="e.g., My Personal OpenAI Key" className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white dark:placeholder-gray-400" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                        <select name="provider" value={formData.provider} onChange={handleFormChange} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white">
                            <option value="gemini">Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                        <div className="relative">
                           <input name="apiKey" type={isKeyVisible ? 'text' : 'password'} value={formData.apiKey} onChange={handleFormChange} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white dark:placeholder-gray-400" required />
                           <button type="button" onClick={() => setIsKeyVisible(!isKeyVisible)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                                {isKeyVisible ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                           </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default KeyVaultManagement;