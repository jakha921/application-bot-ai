import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBots, useCreateBot, useUpdateBot, useDeleteBot } from '../hooks/useApi';
import { Modal } from '../components/Modal';
import { AddIcon, EditIcon, DeleteIcon, RobotIcon } from '../components/icons';
import { botSchema, type BotFormData } from '../schemas/validationSchemas';

interface Bot {
  id: string;
  name: string;
  description?: string;
  telegram_token?: string;
  is_active: boolean;
  created_at: string;
}

export const ManageBotsPage = () => {
  const { data: bots = [], isLoading } = useBots();
  const createBot = useCreateBot();
  const updateBot = useUpdateBot();
  const deleteBot = useDeleteBot();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);

  const createForm = useForm<BotFormData>({
    resolver: zodResolver(botSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      telegram_token: '',
      is_active: true,
    },
  });

  const editForm = useForm<BotFormData>({
    resolver: zodResolver(botSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      telegram_token: '',
      is_active: true,
    },
  });

  const handleCreate = async (data: BotFormData) => {
    await createBot.mutateAsync(data);
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const handleEdit = async (data: BotFormData) => {
    if (!editingBot) return;
    await updateBot.mutateAsync({ id: editingBot.id, data });
    setIsEditModalOpen(false);
    setEditingBot(null);
    editForm.reset();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого бота?')) {
      await deleteBot.mutateAsync(id);
    }
  };

  const openEditModal = (bot: Bot) => {
    setEditingBot(bot);
    editForm.reset({
      name: bot.name,
      description: bot.description || '',
      telegram_token: bot.telegram_token || '',
      is_active: bot.is_active,
    });
    setIsEditModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBot(null);
    editForm.reset();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Управление ботами
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Создавайте и управляйте вашими Telegram ботами
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          <AddIcon className="w-5 h-5 mr-2" />
          Создать бота
        </button>
      </div>

      {/* Bots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot: Bot) => (
          <div
            key={bot.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full mr-3">
                  <RobotIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {bot.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      bot.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {bot.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>

            {bot.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {bot.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(bot.created_at).toLocaleDateString('ru-RU')}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(bot)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(bot.id)}
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

      {bots.length === 0 && (
        <div className="text-center py-12">
          <RobotIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет ботов
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Создайте своего первого бота для начала работы
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Создать первого бота
          </button>
        </div>
      )}

      {/* Create Bot Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Создать нового бота"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название бота *
            </label>
            <input
              type="text"
              {...createForm.register('name')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Например: Customer Support Bot"
            />
            {createForm.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {createForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание
            </label>
            <textarea
              {...createForm.register('description')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Краткое описание бота..."
            />
            {createForm.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {createForm.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telegram Bot Token *
            </label>
            <input
              type="text"
              {...createForm.register('telegram_token')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            />
            {createForm.formState.errors.telegram_token && (
              <p className="text-sm text-red-600 mt-1">
                {createForm.formState.errors.telegram_token.message}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              {...createForm.register('is_active')}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label
              htmlFor="is_active"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Активировать бота сразу после создания
            </label>
          </div>

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
              disabled={createBot.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {createBot.isPending ? 'Создание...' : 'Создать бота'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Bot Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Редактировать бота"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название бота *
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
              Описание
            </label>
            <textarea
              {...editForm.register('description')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            {editForm.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {editForm.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telegram Bot Token
            </label>
            <input
              type="text"
              {...editForm.register('telegram_token')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            />
            {editForm.formState.errors.telegram_token && (
              <p className="text-sm text-red-600 mt-1">
                {editForm.formState.errors.telegram_token.message}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active_edit"
              {...editForm.register('is_active')}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label
              htmlFor="is_active_edit"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Бот активен
            </label>
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
              disabled={updateBot.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {updateBot.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
