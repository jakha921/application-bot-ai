import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useOrganization,
  useOrganizationMembers,
  useCreateUser,
  useBots,
  useUpdateMemberRole,
  useRemoveMember,
} from '../hooks/useApi';
import {
  UserGroupIcon,
  TrashIcon,
  XMarkIcon,
  ShieldCheckIcon,
  PlusIcon,
} from '../components/icons';

const createUserSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  full_name: z.string().min(1, 'Введите полное имя'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer'], {
    message: 'Выберите роль',
  }),
  bot_ids: z.array(z.number()).optional(),
  activate_immediately: z.boolean().optional().default(true),
});

type CreateUserFormData = {
  email: string;
  password: string;
  full_name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  activate_immediately?: boolean;
  bot_ids?: number[];
};

const roleLabels: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
};

const roleBadgeColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  editor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function OrganizationSettings() {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [selectedBotIds, setSelectedBotIds] = useState<number[]>([]);

  const { data: organization, isLoading: orgLoading } = useOrganization();
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers();
  const { data: bots = [] } = useBots();
  const createUser = useCreateUser();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'viewer',
      activate_immediately: true,
      bot_ids: [],
    },
  });

  const onSubmitCreateUser = async (data: CreateUserFormData) => {
    await createUser.mutateAsync({
      ...data,
      bot_ids: selectedBotIds,
    });
    reset();
    setSelectedBotIds([]);
    setIsCreateUserModalOpen(false);
  };

  const toggleBotSelection = (botId: number) => {
    setSelectedBotIds(prev =>
      prev.includes(botId)
        ? prev.filter(id => id !== botId)
        : [...prev, botId]
    );
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await updateMemberRole.mutateAsync({ userId, role: newRole });
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    await removeMember.mutateAsync(memberToDelete);
    setMemberToDelete(null);
  };

  if (orgLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Organization Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {organization?.name || 'Моя организация'}
          </h1>
        </div>
        <p className="text-gray-600">
          Управляйте участниками и настройками вашей организации
        </p>
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Пользователи</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">({members.length})</span>
          </div>
          <button
            onClick={() => setIsCreateUserModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Создать пользователя</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Участник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member: any) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.user?.full_name || member.user?.username || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{member.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.role === 'owner' ? (
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeColors[member.role]}`}
                      >
                        {roleLabels[member.role]}
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">Администратор</option>
                        <option value="member">Участник</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => setMemberToDelete(member.user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Удалить участника"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Создать пользователя
                </h3>
                <button
                  onClick={() => {
                    setIsCreateUserModalOpen(false);
                    reset();
                    setSelectedBotIds([]);
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmitCreateUser)} className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Пароль *
                </label>
                <input
                  type="password"
                  id="password"
                  {...register('password')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Минимум 8 символов"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Полное имя *
                </label>
                <input
                  type="text"
                  id="full_name"
                  {...register('full_name')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Иван Иванов"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Роль *
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Наблюдатель</option>
                  <option value="editor">Редактор</option>
                  <option value="admin">Администратор</option>
                  <option value="owner">Владелец</option>
                </select>
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Доступ к ботам
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-48 overflow-y-auto bg-white dark:bg-gray-700">
                  {bots.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Нет доступных ботов</p>
                  ) : (
                    <div className="space-y-2">
                      {bots.map((bot: any) => (
                        <label
                          key={bot.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBotIds.includes(bot.id)}
                            onChange={() => toggleBotSelection(bot.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{bot.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Выберите ботов, которыми сможет управлять этот пользователь
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activate_immediately"
                  {...register('activate_immediately')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activate_immediately" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Активировать пользователя сразу
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateUserModalOpen(false);
                    reset();
                    setSelectedBotIds([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createUser.isPending ? 'Создание...' : 'Создать пользователя'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Удалить участника?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Вы уверены, что хотите удалить этого участника? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Отмена
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removeMember.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {removeMember.isPending ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
