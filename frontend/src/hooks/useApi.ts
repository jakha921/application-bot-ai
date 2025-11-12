import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import toast from 'react-hot-toast';

// Re-export apiClient for direct use in components
export { apiClient };

// ============ BOTS ============
export const useBots = () => {
  return useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const response = await apiClient.get('/bots/');
      return response.data.results || [];
    },
  });
};

export const useBot = (id: string) => {
  return useQuery({
    queryKey: ['bot', id],
    queryFn: async () => {
      const response = await apiClient.get(`/bots/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateBot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/bots/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast.success('Бот успешно создан!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании бота');
    },
  });
};

export const useUpdateBot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/bots/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast.success('Бот успешно обновлён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении бота');
    },
  });
};

export const useDeleteBot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/bots/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast.success('Бот успешно удалён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении бота');
    },
  });
};

// Bot User Assignment
export const useAssignBotUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ botId, userIds }: { botId: string; userIds: number[] }) => {
      const response = await apiClient.post(`/bots/${botId}/assign-users/`, {
        user_ids: userIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      toast.success('Пользователи назначены!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при назначении пользователей');
    },
  });
};

export const useAvailableBotUsers = (botId: string) => {
  return useQuery({
    queryKey: ['bot-available-users', botId],
    queryFn: async () => {
      const response = await apiClient.get(`/bots/${botId}/available-users/`);
      return response.data.users || [];
    },
    enabled: !!botId,
  });
};

// ============ TEMPLATES ============
// DEPRECATED: Use Knowledge Base Files instead
export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await apiClient.get('/templates/');
      return response.data.results || [];
    },
  });
};

export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      const response = await apiClient.get(`/templates/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/templates/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Шаблон успешно создан!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании шаблона');
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/templates/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Шаблон успешно обновлён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении шаблона');
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/templates/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Шаблон успешно удалён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении шаблона');
    },
  });
};

// ============ KNOWLEDGE BASE FILES ============
export const useKnowledgeFiles = (botId?: string) => {
  return useQuery({
    queryKey: ['knowledge-files', botId],
    queryFn: async () => {
      const params = botId ? { bot_id: botId } : {};
      const response = await apiClient.get('/knowledge-files/', { params });
      return response.data.results || [];
    },
  });
};

export const useKnowledgeFile = (id: string) => {
  return useQuery({
    queryKey: ['knowledge-file', id],
    queryFn: async () => {
      const response = await apiClient.get(`/knowledge-files/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateKnowledgeFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      // Handle file upload with FormData
      if (data.file) {
        const formData = new FormData();
        formData.append('bot', data.bot);
        formData.append('name', data.name);
        formData.append('file_type', data.file_type);
        formData.append('file', data.file[0]); // file is FileList
        
        const response = await apiClient.post('/knowledge-files/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // Text content without file
        const response = await apiClient.post('/knowledge-files/', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Файл базы знаний успешно создан!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании файла');
    },
  });
};

export const useUpdateKnowledgeFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/knowledge-files/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      toast.success('Файл базы знаний успешно обновлён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении файла');
    },
  });
};

export const useDeleteKnowledgeFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/knowledge-files/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Файл базы знаний успешно удалён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении файла');
    },
  });
};

// ============ CONVERSATIONS ============
export const useConversations = (botId?: string) => {
  return useQuery({
    queryKey: ['conversations', botId],
    queryFn: async () => {
      const params = botId ? { bot_id: botId } : {};
      const response = await apiClient.get('/conversations/', { params });
      return response.data.results || [];
    },
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const response = await apiClient.get(`/conversations/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============ MESSAGES ============
export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await apiClient.get(`/conversations/${conversationId}/messages/`);
      return response.data.results || [];
    },
    enabled: !!conversationId,
  });
};

// ============ DOCUMENTS ============
export const useDocuments = (botId?: string) => {
  return useQuery({
    queryKey: ['documents', botId],
    queryFn: async () => {
      const params = botId ? { bot_id: botId } : {};
      const response = await apiClient.get('/documents/', { params });
      return response.data.results || [];
    },
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await apiClient.get(`/documents/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

// ============ USERS ============
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users/');
      return response.data.results || [];
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      full_name: string;
      role: string;
      bot_ids?: number[];
      activate_immediately?: boolean;
    }) => {
      const response = await apiClient.post('/organizations/create-user/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Пользователь успешно создан!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при создании пользователя');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.put(`/users/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Пользователь успешно обновлён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении пользователя');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Пользователь успешно удалён!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении пользователя');
    },
  });
};

// ============ ORGANIZATIONS ============
export const useOrganization = () => {
  return useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations/me/');
      return response.data;
    },
  });
};

export const useOrganizationMembers = () => {
  return useQuery({
    queryKey: ['organization-members'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations/members/');
      return response.data.results || [];
    },
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const response = await apiClient.post('/organizations/invite/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      toast.success('Приглашение успешно отправлено!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отправке приглашения');
    },
  });
};

export const useOrganizationInvites = () => {
  return useQuery({
    queryKey: ['organization-invites'],
    queryFn: async () => {
      const response = await apiClient.get('/organizations/invites/');
      return response.data.results || [];
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.patch(`/organizations/members/${userId}/`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Роль пользователя успешно обновлена!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении роли');
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/organizations/members/${userId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Участник успешно удалён из организации!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении участника');
    },
  });
};

export const useCancelInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await apiClient.delete(`/organizations/invites/${inviteId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      toast.success('Приглашение отменено!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отмене приглашения');
    },
  });
};

// ============ ANALYTICS ============
export const useAnalytics = (params?: any) => {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/', { params });
      return response.data;
    },
  });
};
