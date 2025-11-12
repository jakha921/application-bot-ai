import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useKnowledgeFiles,
  useCreateKnowledgeFile,
  useUpdateKnowledgeFile,
  useDeleteKnowledgeFile,
  useBots,
} from '../hooks/useApi';
import { knowledgeBaseFileSchema } from '../schemas/validationSchemas';
import type { KnowledgeBaseFileFormData } from '../schemas/validationSchemas';
import { Modal } from '../components/Modal';
import { EditIcon, DeleteIcon, PlusIcon, FileTextIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon } from '../components/icons';

interface KnowledgeFile {
  id: string;
  bot: number;
  bot_name: string;
  name: string;
  file: string | null;
  content: string;
  file_type: 'text' | 'pdf' | 'docx' | 'url';
  status: 'pending' | 'processing' | 'ready' | 'error';
  file_size: number | null;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export const ManageKnowledge = () => {
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<'text' | 'pdf' | 'docx' | 'url'>('text');

  const { data: bots = [], isLoading: botsLoading } = useBots();
  const { data: files = [], isLoading: filesLoading } = useKnowledgeFiles(selectedBotId);
  const createFile = useCreateKnowledgeFile();
  const updateFile = useUpdateKnowledgeFile();
  const deleteFile = useDeleteKnowledgeFile();

  const createForm = useForm<KnowledgeBaseFileFormData>({
    resolver: zodResolver(knowledgeBaseFileSchema) as any,
    defaultValues: {
      bot: 0,
      name: '',
      content: '',
      file_type: 'text',
    },
  });

  const editForm = useForm<KnowledgeBaseFileFormData>({
    resolver: zodResolver(knowledgeBaseFileSchema) as any,
    defaultValues: {
      bot: 0,
      name: '',
      content: '',
      file_type: 'text',
    },
  });

  const handleCreate = async (data: KnowledgeBaseFileFormData) => {
    await createFile.mutateAsync(data);
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const handleEdit = async (data: KnowledgeBaseFileFormData) => {
    if (!editingFile) return;
    await updateFile.mutateAsync({ id: editingFile.id, data });
    setIsEditModalOpen(false);
    setEditingFile(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      await deleteFile.mutateAsync(id);
    }
  };

  const openEditModal = (file: KnowledgeFile) => {
    setEditingFile(file);
    editForm.reset({
      bot: file.bot,
      name: file.name,
      content: file.content || '',
      file_type: file.file_type,
    });
    setIsEditModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFile(null);
  };

  const getStatusBadge = (status: KnowledgeFile['status']) => {
    const statusConfig = {
      pending: {
        icon: ClockIcon,
        text: 'Ожидает',
        color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
      },
      processing: {
        icon: ClockIcon,
        text: 'Обработка',
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
      },
      ready: {
        icon: CheckCircleIcon,
        text: 'Готов',
        color: 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
      },
      error: {
        icon: AlertCircleIcon,
        text: 'Ошибка',
        color: 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getFileTypeIcon = (_fileType: KnowledgeFile['file_type']) => {
    // TODO: Add different icons for PDF, DOCX, URL
    return <FileTextIcon className="w-5 h-5" />;
  };

  if (botsLoading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">База знаний</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Управление файлами и контентом для обучения ботов
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Добавить файл
        </button>
      </div>

      {/* Bot Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Фильтр по боту
        </label>
        <select
          value={selectedBotId}
          onChange={(e) => setSelectedBotId(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Все боты</option>
          {bots.map((bot: any) => (
            <option key={bot.id} value={bot.id}>
              {bot.name}
            </option>
          ))}
        </select>
      </div>

      {filesLoading ? (
        <div className="text-center py-12">Загрузка файлов...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-12">
          <FileTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет файлов
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Добавьте первый файл в базу знаний
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Добавить файл
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file: KnowledgeFile) => (
            <div
              key={file.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getFileTypeIcon(file.file_type)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {file.bot_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                {getStatusBadge(file.status)}
              </div>

              {file.content && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {file.content}
                </p>
              )}

              {file.processing_error && (
                <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                  {file.processing_error}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(file.created_at).toLocaleDateString('ru-RU')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(file)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Добавить файл в базу знаний"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Бот *
            </label>
            <select
              {...createForm.register('bot', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Выберите бота</option>
              {bots.map((bot: any) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
            {createForm.formState.errors.bot && (
              <p className="text-sm text-red-600 mt-1">
                {createForm.formState.errors.bot.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название *
            </label>
            <input
              type="text"
              {...createForm.register('name')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Например: Каталог продуктов"
            />
            {createForm.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {createForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип файла
            </label>
            <select
              {...createForm.register('file_type')}
              onChange={(e) => {
                createForm.setValue('file_type', e.target.value as any);
                setSelectedFileType(e.target.value as any);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="text">Текст</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="url">URL (скоро)</option>
            </select>
          </div>

          {/* File upload for PDF/DOCX */}
          {selectedFileType === 'pdf' || selectedFileType === 'docx' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Загрузить файл *
              </label>
              <input
                type="file"
                accept={selectedFileType === 'pdf' ? '.pdf' : '.docx,.doc'}
                {...createForm.register('file')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {createForm.formState.errors.file && (
                <p className="text-sm text-red-600 mt-1">
                  {createForm.formState.errors.file.message as string}
                </p>
              )}
            </div>
          ) : selectedFileType === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Контент
              </label>
              <textarea
                {...createForm.register('content')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={8}
                placeholder="Введите текст или информацию, которую должен знать бот..."
              />
              {createForm.formState.errors.content && (
                <p className="text-sm text-red-600 mt-1">
                  {createForm.formState.errors.content.message}
                </p>
              )}
            </div>
          ) : null}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeCreateModal}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createFile.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {createFile.isPending ? 'Создание...' : 'Создать файл'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Редактировать файл"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название *
            </label>
            <input
              type="text"
              {...editForm.register('name')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {editForm.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {editForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Контент
            </label>
            <textarea
              {...editForm.register('content')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={8}
            />
            {editForm.formState.errors.content && (
              <p className="text-sm text-red-600 mt-1">
                {editForm.formState.errors.content.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={updateFile.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {updateFile.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
