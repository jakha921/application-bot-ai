import { useState } from 'react';
import { 
  SettingsIcon, 
  BrainIcon, 
  TelegramIcon, 
  WebWidgetIcon,
  KeyIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon
} from '../components/icons';

type TabId = 'general' | 'model' | 'integrations' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'general', label: 'Общие', icon: SettingsIcon },
  { id: 'model', label: 'Модель AI', icon: BrainIcon },
  { id: 'integrations', label: 'Интеграции', icon: TelegramIcon },
  { id: 'advanced', label: 'Расширенные', icon: KeyIcon },
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [showApiKey, setShowApiKey] = useState(false);

  // General settings
  const [orgName, setOrgName] = useState('Моя организация');
  const [orgDescription, setOrgDescription] = useState('Система генерации юридических документов');

  // Model settings
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);

  // Integration settings
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [webWidgetEnabled, setWebWidgetEnabled] = useState(false);
  const [telegramWebhook, setTelegramWebhook] = useState('');

  // Advanced settings
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [enableFineTuning, setEnableFineTuning] = useState(false);
  const [maxConversationHistory, setMaxConversationHistory] = useState(10);

  const handleSave = () => {
    // TODO: Implement save logic with API
    console.log('Saving settings...');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Информация об организации
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Название организации
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Моя организация"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Описание вашей организации"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Региональные настройки
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Язык интерфейса
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="ru">Русский</option>
                    <option value="uz">O'zbekcha</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Часовой пояс
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                    <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                    <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'model':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Конфигурация AI модели
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    AI провайдер
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAiProvider('openai')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        aiProvider === 'openai'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">OpenAI</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          GPT-4 / GPT-3.5
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setAiProvider('gemini')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        aiProvider === 'gemini'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">Google Gemini</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Gemini Pro
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API ключ
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                      placeholder={aiProvider === 'openai' ? 'sk-...' : 'AIza...'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showApiKey ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {aiProvider === 'openai' 
                      ? 'Получите API ключ на platform.openai.com'
                      : 'Получите API ключ на makersuite.google.com'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Температура: {temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Точный (0.0)</span>
                    <span>Креативный (2.0)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Максимум токенов
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    min="100"
                    max="4000"
                    step="100"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ограничение длины ответа (100-4000)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Каналы коммуникации
              </h3>

              {/* Telegram Integration */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-3">
                      <TelegramIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Telegram</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Интеграция с Telegram ботом
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramEnabled}
                      onChange={(e) => setTelegramEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {telegramEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Webhook URL
                      </label>
                      <input
                        type="text"
                        value={telegramWebhook}
                        onChange={(e) => setTelegramWebhook(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                        placeholder="https://your-domain.com/api/telegram/webhook"
                      />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        💡 Боты управляются на странице "Управление ботами"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Web Widget Integration */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-3">
                      <WebWidgetIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Web виджет</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Чат на вашем сайте
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webWidgetEnabled}
                      onChange={(e) => setWebWidgetEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {webWidgetEnabled && (
                  <div className="space-y-3">
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                        Код для установки на сайт:
                      </p>
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<script src="https://your-domain.com/widget.js"></script>
<script>
  ArizaWidget.init({
    apiKey: 'your-api-key'
  });
</script>`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Расширенные возможности
              </h3>

              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Grounding (заземление)
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Использование базы знаний для более точных ответов
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableGrounding}
                        onChange={(e) => setEnableGrounding(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  {enableGrounding && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <p className="text-xs text-green-800 dark:text-green-300">
                        ✓ Активно: Модель использует загруженные документы и шаблоны для генерации
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Fine-tuning
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Дообучение модели на ваших данных
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableFineTuning}
                        onChange={(e) => setEnableFineTuning(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  {enableFineTuning && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        ⚠️ Fine-tuning требует дополнительных затрат и времени на обучение
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    История диалога
                  </label>
                  <input
                    type="number"
                    value={maxConversationHistory}
                    onChange={(e) => setMaxConversationHistory(parseInt(e.target.value))}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Количество предыдущих сообщений для контекста (1-50)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Настройки
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Управление параметрами системы
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {renderTabContent()}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          <SaveIcon className="w-5 h-5 mr-2" />
          Сохранить изменения
        </button>
      </div>
    </div>
  );
};
