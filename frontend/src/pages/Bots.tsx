import { useState } from 'react';
import { useBots } from '../hooks/useApi';
import { BotSelector } from '../components/BotSelector';
import { 
  RobotIcon, 
  ChatIcon, 
  FileIcon, 
  UsersIcon,
  SettingsIcon,
  TelegramIcon,
} from '../components/icons';
import { Modal } from '../components/Modal';

interface Bot {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  telegram_token?: string;
  created_at: string;
}

export const BotsPage = () => {
  const { data: bots = [], isLoading } = useBots();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  const openSettings = (bot: Bot) => {
    setSelectedBot(bot);
    setIsSettingsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentBot = bots.find((b: Bot) => b.id === (selectedBotId || bots[0]?.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Мои боты
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Управление и мониторинг ваших Telegram ботов
        </p>
      </div>

      {/* Bot Selector */}
      <BotSelector
        bots={bots.map((b: Bot) => ({ id: b.id, name: b.name }))}
        currentBotId={selectedBotId || bots[0]?.id}
        onBotChange={setSelectedBotId}
      />

      {currentBot && (
        <>
          {/* Current Bot Stats */}
          <div className="bg-gradient-to-r from-primary-500 to-purple-600 dark:from-primary-700 dark:to-purple-800 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-4 rounded-xl mr-4">
                  <RobotIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentBot.name}</h2>
                  {currentBot.description && (
                    <p className="text-white/80 mt-1">{currentBot.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      currentBot.is_active 
                        ? 'bg-green-500/30 text-white' 
                        : 'bg-gray-500/30 text-white'
                    }`}>
                      {currentBot.is_active ? '● Активен' : '○ Неактивен'}
                    </span>
                    <span className="text-white/60 text-sm">
                      Создан: {new Date(currentBot.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => openSettings(currentBot)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Настройки бота"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Диалогов</p>
                    <p className="text-2xl font-bold mt-1">124</p>
                  </div>
                  <ChatIcon className="w-8 h-8 text-white/60" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Документов</p>
                    <p className="text-2xl font-bold mt-1">87</p>
                  </div>
                  <FileIcon className="w-8 h-8 text-white/60" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Пользователей</p>
                    <p className="text-2xl font-bold mt-1">42</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-white/60" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Активность</p>
                    <p className="text-2xl font-bold mt-1">98%</p>
                  </div>
                  <TelegramIcon className="w-8 h-8 text-white/60" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChatIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Последние диалоги
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Пользователь #{i}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {i * 5} мин назад
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      Запрос на создание документа о приёме на работу...
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Последние документы
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ariza_{i}.docx
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {i * 10} мин назад
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Заявление о приёме на работу
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!currentBot && bots.length === 0 && (
        <div className="text-center py-12">
          <RobotIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет ботов
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Создайте своего первого бота для начала работы
          </p>
          <a
            href="/manage-bots"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Создать первого бота
          </a>
        </div>
      )}

      {/* Settings Modal */}
      {selectedBot && (
        <Modal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            setSelectedBot(null);
          }}
          title={`Настройки: ${selectedBot.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Telegram Settings */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <TelegramIcon className="w-5 h-5 mr-2 text-blue-500" />
                Telegram
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bot Token</span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {selectedBot.telegram_token 
                      ? `${selectedBot.telegram_token.slice(0, 10)}...` 
                      : 'Не настроен'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Статус</span>
                  <span className={`text-xs font-semibold ${
                    selectedBot.is_active ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {selectedBot.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Быстрые действия
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Протестировать
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Открыть в Telegram
                  </p>
                </button>
                <button className="p-3 text-left bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                    Статистика
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Подробный отчёт
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
