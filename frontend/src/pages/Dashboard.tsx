import { useEffect, useState } from 'react';
import { useOrganizationStore } from '../stores/organizationStore';
import { apiClient } from '../lib/api-client';
import { BotSelector } from '../components/BotSelector';
import { 
  RobotIcon, 
  DatabaseIcon, 
  MonitoringIcon,
  UsersIcon,
  ChatIcon,
  FileIcon,
} from '../components/icons';

interface OrganizationData {
  id: string;
  name: string;
  plan: string;
  bots_count: number;
  documents_count: number;
  monthly_documents_count: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: StatCardProps) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className={`bg-${color}-100 dark:bg-${color}-900/50 p-3 rounded-full`}>
        <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
    <p className={`text-4xl font-bold text-${color}-600 dark:text-${color}-400 mb-2`}>
      {value}
    </p>
    {subtitle && (
      <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    )}
  </div>
);

export const DashboardPage = () => {
  const { setCurrentOrg, setOrganizations } = useOrganizationStore();
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await apiClient.get('/organizations/');
        const organizations = response.data.results || [];
        
        if (organizations.length > 0) {
          const org = organizations[0];
          setOrganizations(organizations);
          setCurrentOrg(org);
          
          setOrgData({
            id: org.id,
            name: org.name,
            plan: org.plan,
            bots_count: org.bots_count || 0,
            documents_count: org.documents_count || 0,
            monthly_documents_count: org.monthly_documents_count || 0,
          });
        }
      } catch (err: any) {
        console.error('Failed to load organization data:', err);
        setError('Не удалось загрузить данные организации');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [setCurrentOrg, setOrganizations]);

  const getQuotas = (plan: string) => {
    switch (plan) {
      case 'pro':
        return { bots: 5, documents: 500 };
      case 'enterprise':
        return { bots: 999, documents: 10000 };
      default:
        return { bots: 1, documents: 10 };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const quotas = orgData ? getQuotas(orgData.plan) : { bots: 1, documents: 10 };
  
  // Mock data для ботов
  const mockBots = [
    { id: '1', name: 'Telegram Бот - Ariza Generator' },
    { id: '2', name: 'Web Widget - Customer Support' },
  ];

  // Mock данные для Recent Dialogues
  const recentDialogues = [
    { 
      id: '1', 
      question: 'Как создать заявление о приёме на работу?', 
      answer: 'Я помогу вам создать заявление. Пожалуйста, назовите ФИО...',
      time: '5 мин назад'
    },
    { 
      id: '2', 
      question: 'Нужен шаблон заявления на отпуск', 
      answer: 'Конечно! Для этого мне нужны следующие данные...',
      time: '15 мин назад'
    },
    { 
      id: '3', 
      question: 'Помогите с документами', 
      answer: 'Здравствуйте! Я специализируюсь на юридических документах...',
      time: '1 час назад'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Аналитика
          </h1>
          {orgData && (
            <div className="mt-2 flex items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">
                Организация: <span className="font-semibold">{orgData.name}</span>
              </p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                orgData.plan === 'enterprise' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : orgData.plan === 'pro'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {orgData.plan.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bot Selector */}
      <BotSelector
        bots={mockBots}
        currentBotId={selectedBot || mockBots[0]?.id}
        onBotChange={setSelectedBot}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Активные боты"
          value={orgData?.bots_count || 0}
          subtitle={`Лимит: ${quotas.bots}`}
          icon={RobotIcon}
          color="indigo"
        />
        <StatCard
          title="Всего Q&A"
          value={orgData?.documents_count || 0}
          subtitle="В базе знаний"
          icon={DatabaseIcon}
          color="green"
        />
        <StatCard
          title="Диалогов"
          value={156}
          subtitle="За последний месяц"
          icon={ChatIcon}
          color="blue"
        />
        <StatCard
          title="Пользователей"
          value={42}
          subtitle="Активных сегодня"
          icon={UsersIcon}
          color="purple"
        />
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Dialogues Widget */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <MonitoringIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Последние диалоги
            </h3>
          </div>
          <div className="space-y-3">
            {recentDialogues.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                    Q: {log.question}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {log.time}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                  A: {log.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Documents Stats Widget */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <FileIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Статистика документов
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">За этот месяц</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {orgData?.monthly_documents_count || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Лимит</p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                  {quotas.documents}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-600 dark:bg-green-400 h-3 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(((orgData?.monthly_documents_count || 0) / quotas.documents) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Всего</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {orgData?.documents_count || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Сегодня</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-xl shadow-lg border border-indigo-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Быстрый старт
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Создайте первого бота</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                Перейдите в раздел "Боты" и создайте нового Telegram бота для генерации документов
              </p>
              <a href="/bots" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                Перейти к ботам →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex-shrink-0 w-10 h-10 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Настройте шаблоны</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                Выберите готовые шаблоны или создайте свои для генерации юридических документов
              </p>
              <a href="/templates" className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
                Перейти к шаблонам →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Начните генерировать</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Используйте бота в Telegram для создания документов на основе голосовых сообщений и AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
