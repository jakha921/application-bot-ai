export const TemplatesPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Шаблоны</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-lg font-semibold mb-2">Заявление на отпуск</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Шаблон для создания заявления на отпуск</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">Использовано: 0 раз</span>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm">Использовать</button>
          </div>
        </div>
      </div>
    </div>
  );
};
