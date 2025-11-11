import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/apiService';
import { useAppStore } from '../store/useAppStore';
import { type User, type Role } from '../types';
import { DeleteIcon, AddIcon, EditIcon } from './icons';
import Modal from './Modal';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'client-viewer' as Role,
        accessibleBotIds: [] as string[],
    });

    const allBots = useAppStore(state => state.bots);

    const fetchUsers = async () => {
        setIsLoading(true);
        const fetchedUsers = await apiService.getUsers();
        setUsers(fetchedUsers);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (editingUser) {
            const userBotAccess = allBots
                .filter(bot => bot.accessibleUserIds.includes(editingUser.id))
                .map(bot => bot.id);
            setFormData({
                username: editingUser.username,
                password: '', // Always empty for security
                role: editingUser.role,
                accessibleBotIds: userBotAccess,
            });
            setIsModalOpen(true);
        }
    }, [editingUser, allBots]);

    const openAddModal = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', role: 'client-viewer', accessibleBotIds: [] });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBotAccessChange = (botId: string) => {
        setFormData(prev => ({
            ...prev,
            accessibleBotIds: prev.accessibleBotIds.includes(botId)
                ? prev.accessibleBotIds.filter(id => id !== botId)
                : [...prev.accessibleBotIds, botId],
        }));
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username.trim()) return toast.error("Username is required.");
        if (!editingUser && !formData.password.trim()) return toast.error("Password is required for new users.");

        if (editingUser) {
            const userData: Partial<Omit<User, 'id'>> = { username: formData.username, role: formData.role };
            if (formData.password) userData.password = formData.password;
            await apiService.updateUser(editingUser.id, userData, formData.accessibleBotIds);
        } else {
            await apiService.addUser(formData.username, formData.password, formData.role, formData.accessibleBotIds);
        }
        
        await fetchUsers();
        closeModal();
    };

    const handleDeleteUser = async (id: string) => {
        if (id === 'user_admin') return toast.error("The default admin user cannot be deleted.");
        if (window.confirm("Are you sure you want to delete this user? Their access to all bots will be revoked.")) {
            await apiService.deleteUser(id);
            await fetchUsers();
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">User Management</h2>
                    <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                        <AddIcon className="w-5 h-5 mr-2" /> Add User
                    </button>
                </div>
                
                <div className="flex-grow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={3} className="text-center p-4">Loading users...</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">{user.role}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setEditingUser(user)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteUser(user.id)} disabled={user.id === 'user_admin'} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"><DeleteIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add New User'} footer={
                <>
                    <button onClick={closeModal} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button form="user-form" type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Save</button>
                </>
            }>
                <form id="user-form" onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <input name="username" type="text" value={formData.username} onChange={handleFormChange} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white dark:placeholder-gray-400" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleFormChange} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white dark:placeholder-gray-400" placeholder={editingUser ? 'Leave blank to keep current password' : ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select name="role" value={formData.role} onChange={handleFormChange} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500 dark:text-white">
                            <option value="client-viewer">Client (Viewer)</option>
                            <option value="client-editor">Client (Editor)</option>
                            <option value="client-admin">Client (Admin)</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    {formData.role !== 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Access</label>
                            <div className="mt-2 space-y-2 p-3 border dark:border-gray-600 rounded-md max-h-40 overflow-y-auto">
                                {allBots.length > 0 ? allBots.map(bot => (
                                    <div key={bot.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`bot-access-${bot.id}`}
                                            checked={formData.accessibleBotIds.includes(bot.id)}
                                            onChange={() => handleBotAccessChange(bot.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500"
                                        />
                                        <label htmlFor={`bot-access-${bot.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-200">{bot.name}</label>
                                    </div>
                                )) : <p className="text-sm text-gray-500 dark:text-gray-400">No bots created yet.</p>}
                            </div>
                        </div>
                    )}
                </form>
            </Modal>
        </>
    );
};

export default UserManagement;