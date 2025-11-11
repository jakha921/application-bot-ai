import React, { useState, useEffect } from 'react';
import { useCurrentBotData } from '../store/useAppStore';
import { apiService } from '../services/apiService';
import { type UploadedFile, type UploadStatus } from '../types';
import Modal from './Modal';

const UploadMaterials: React.FC = () => {
    const currentBot = useCurrentBotData();
    const files = currentBot?.uploadedFiles || [];
    
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
    const [isEditingFile, setIsEditingFile] = useState<boolean>(false);
    const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
    const [formState, setFormState] = useState<UploadedFile | null>(null);

    useEffect(() => {
        if (selectedFile) {
            setFormState(selectedFile);
        } else {
            setFormState(null);
        }
    }, [selectedFile]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setUploading(true);
            const file = event.target.files[0];
            const newFile: UploadedFile = {
                id: Date.now(),
                name: file.name,
                type: file.type,
                size: file.size,
                status: 'processing_upload',
                content: `(Simulated content preview for ${file.name}) Lorem ipsum dolor sit amet, consectetur adipiscing elit...`
            };
            
            // This would be an API call in a real app that returns the new file list
            apiService.apiUpdateFile({ ...newFile, status: 'ready' }).finally(() => {
                setUploading(false);
            });
        }
    };
    
    const handleUpdateFile = async () => {
        if (formState) {
            await apiService.apiUpdateFile(formState);
            setIsEditingFile(false);
            setSelectedFile(formState);
        }
    };
    
    const handleDeleteFile = async () => {
        if (deletingFileId) {
            await apiService.apiDeleteFile(deletingFileId);
            setDeletingFileId(null);
            setSelectedFile(null); // Close the details modal too
        }
    };
    
    const getStatusChip = (status: UploadStatus) => {
        const statusConfig: Record<UploadStatus, { className: string; text: string }> = {
            pending_upload: { className: 'bg-gray-200 text-gray-800', text: 'Pending' },
            processing_upload: { className: 'bg-blue-200 text-blue-800 animate-pulse', text: 'Processing' },
            pending_rag: { className: 'bg-yellow-200 text-yellow-800', text: 'Pending RAG' },
            processing_rag: { className: 'bg-purple-200 text-purple-800 animate-pulse', text: 'Processing RAG' },
            ready: { className: 'bg-green-200 text-green-800', text: 'Ready' },
            error: { className: 'bg-red-200 text-red-800', text: 'Error' },
        };
        const config = statusConfig[status];
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>{config.text}</span>
    };

    const closeModal = () => {
        setSelectedFile(null);
        setIsEditingFile(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Upload Materials</h2>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-6">
                    <p className="mb-4 text-gray-500 dark:text-gray-400">Drag & drop files here or click to browse.</p>
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} disabled={uploading} />
                    <label htmlFor="file-upload" className={`cursor-pointer px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploading ? 'Uploading...' : 'Browse Files'}
                    </label>
                </div>

                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Uploaded Files</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                    {files.length > 0 ? files.map(file => (
                        <button 
                            key={file.id} 
                            onClick={() => setSelectedFile(file)}
                            className="w-full text-left flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            {getStatusChip(file.status)}
                        </button>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No files uploaded yet.</p>
                    )}
                </div>
            </div>

            {/* File Details/Edit Modal */}
            <Modal
                isOpen={!!selectedFile}
                onClose={closeModal}
                title={isEditingFile ? "Edit File" : "File Details"}
                footer={
                    isEditingFile ? (
                        <>
                            <button onClick={() => setIsEditingFile(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={handleUpdateFile} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Save</button>
                        </>
                    ) : (
                        <>
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Close</button>
                            <button onClick={() => { if (selectedFile) setDeletingFileId(selectedFile.id); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                            <button onClick={() => setIsEditingFile(true)} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Edit</button>
                        </>
                    )
                }
            >
                {formState && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            {isEditingFile ? (
                                <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="mt-1 w-full p-2 border bg-white border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-500" />
                            ) : (
                                <p className="mt-1 text-gray-800 dark:text-gray-200">{formState.name}</p>
                            )}
                        </div>
                        <p className="text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Size:</span> {(formState.size / 1024).toFixed(2)} KB</p>
                        <p className="text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Type:</span> {formState.type}</p>
                        <div className="flex items-center text-sm"><span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Status:</span> {getStatusChip(formState.status)}</div>
                    </div>
                )}
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deletingFileId}
                onClose={() => setDeletingFileId(null)}
                title="Confirm Deletion"
                footer={
                    <>
                        <button onClick={() => setDeletingFileId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleDeleteFile} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                    </>
                }
            >
                <p>Are you sure you want to delete this file? This action cannot be undone.</p>
            </Modal>
        </>
    );
};

export default UploadMaterials;