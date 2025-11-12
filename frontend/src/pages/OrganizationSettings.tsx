import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useOrganization,
  useOrganizationMembers,
  useInviteUser,
  useOrganizationInvites,
  useUpdateMemberRole,
  useRemoveMember,
  useCancelInvite,
} from '../hooks/useApi';
import {
  UserGroupIcon,
  EnvelopeIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '../components/icons';

const inviteSchema = z.object({
  email: z.string().email('Введите корректный email'),
  role: z.enum(['admin', 'member'], {
    message: 'Выберите роль',
  }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleLabels: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  member: 'Участник',
};

const roleBadgeColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800',
};

export default function OrganizationSettings() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<string | null>(null);

  const { data: organization, isLoading: orgLoading } = useOrganization();
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers();
  const { data: invites = [], isLoading: invitesLoading } = useOrganizationInvites();
  const inviteUser = useInviteUser();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const cancelInvite = useCancelInvite();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmitInvite = async (data: InviteFormData) => {
    await inviteUser.mutateAsync(data);
    reset();
    setIsInviteModalOpen(false);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await updateMemberRole.mutateAsync({ userId, role: newRole });
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    await removeMember.mutateAsync(memberToDelete);
    setMemberToDelete(null);
  };

  const handleCancelInvite = async () => {
    if (!inviteToCancel) return;
    await cancelInvite.mutateAsync(inviteToCancel);
    setInviteToCancel(null);
  };

  if (orgLoading || membersLoading || invitesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
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
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Участники команды</h2>
            <span className="text-sm text-gray-500">({members.length})</span>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <EnvelopeIcon className="h-5 w-5" />
            <span>Пригласить участника</span>
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

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">Отправленные приглашения</h2>
            <span className="text-sm text-gray-500">({invites.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Истекает
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite: any) => (
                  <tr key={invite.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invite.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeColors[invite.role]}`}
                      >
                        {roleLabels[invite.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invite.is_accepted ? (
                        <span className="flex items-center text-green-600 text-sm">
                          <CheckCircleIcon className="h-5 w-5 mr-1" />
                          Принято
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-600 text-sm">
                          <ClockIcon className="h-5 w-5 mr-1" />
                          Ожидает
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invite.expires_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!invite.is_accepted && (
                        <button
                          onClick={() => setInviteToCancel(invite.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Отменить приглашение"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Пригласить участника</h3>
                <button
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmitInvite)} className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Роль
                </label>
                <select
                  id="role"
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите роль...</option>
                  <option value="admin">Администратор</option>
                  <option value="member">Участник</option>
                </select>
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    reset();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={inviteUser.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteUser.isPending ? 'Отправка...' : 'Отправить приглашение'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Удалить участника?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Вы уверены, что хотите удалить этого участника из организации? Это действие нельзя
              отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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

      {/* Cancel Invite Confirmation */}
      {inviteToCancel && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Отменить приглашение?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Вы уверены, что хотите отменить это приглашение?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setInviteToCancel(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCancelInvite}
                disabled={cancelInvite.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {cancelInvite.isPending ? 'Отмена...' : 'Отменить приглашение'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
