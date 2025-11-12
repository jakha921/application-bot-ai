import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../hooks/useApi';
import { CheckCircleIcon, AlertCircleIcon, ClockIcon } from '../components/icons';

interface InviteData {
  organization_name: string;
  role: string;
  expires_at: string;
  is_valid: boolean;
  message?: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyInvite = async () => {
      if (!token) {
        setError('Неверная ссылка приглашения');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/organizations/invites/${token}/verify/`);
        setInviteData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Не удалось проверить приглашение');
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      await apiClient.post(`/organizations/invites/${token}/accept/`);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось принять приглашение');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Проверка приглашения...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Приглашение принято!</h2>
          <p className="text-gray-600">
            Вы успешно присоединились к организации. Переход на главную страницу...
          </p>
        </div>
      </div>
    );
  }

  if (error || !inviteData?.is_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Недействительное приглашение</h2>
          <p className="text-gray-600 mb-6">
            {error || inviteData?.message || 'Срок действия приглашения истек или оно уже было использовано'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Приглашение в организацию</h2>
          <p className="text-gray-600">
            Вас пригласили присоединиться к организации
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Организация:</span>
              <p className="font-semibold text-gray-900">{inviteData.organization_name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Роль:</span>
              <p className="font-semibold text-gray-900">
                {inviteData.role === 'admin' ? 'Администратор' : 'Участник'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Действительно до:</span>
              <p className="font-semibold text-gray-900">
                {new Date(inviteData.expires_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {accepting ? 'Принятие приглашения...' : 'Принять приглашение'}
        </button>

        <button
          onClick={() => navigate('/login')}
          className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
