/**
 * @file app/chronicle/page.tsx
 * @description 年代記画面（統計・学習履歴）
 * 
 * @see docs/design/chronicle-screen.md
 * 
 * @related
 * - components/Chronicle/StatsChart.tsx: 統計グラフコンポーネント
 * - stores/phrase.store.ts: フレーズデータストア
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { usePhraseStore } from '@/stores/phrase.store';
import { FiTrendingUp, FiAward, FiCalendar, FiPieChart } from 'react-icons/fi';

export default function ChroniclePage() {
  const { phrases, tags, loadPhrases, loadTags, getStats } = usePhraseStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      await Promise.all([loadPhrases(), loadTags()]);
      const statsData = await getStats();
      setStats(statsData);
      setIsLoading(false);
    };
    loadStats();
  }, [loadPhrases, loadTags, getStats]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">統計を読み込み中...</p>
        </div>
      </div>
    );
  }

  // タグ別データの準備
  const tagStats = new Map<string, number>();
  phrases.forEach(phrase => {
    phrase.tags.forEach(tag => {
      tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
    });
  });
  
  const tagData = Array.from(tagStats.entries())
    .map(([tagName, count]) => {
      const tag = tags.find(t => t.name === tagName);
      const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
      const colorIndex = tags.findIndex(t => t.name === tagName) % colors.length;
      return {
        name: tagName,
        value: count,
        color: tag?.color || colors[colorIndex]
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // 上位10タグのみ表示

  // 習熟度データの準備
  const masteryData = [
    { name: '初級', value: stats.masteryLevels.beginner, color: '#FCD34D' },
    { name: '中級', value: stats.masteryLevels.intermediate, color: '#60A5FA' },
    { name: '上級', value: stats.masteryLevels.advanced, color: '#34D399' }
  ];

  // 日別データのフォーマット
  const dailyData = stats.dailyStats.map((day: any) => ({
    ...day,
    displayDate: format(new Date(day.date), 'M/d', { locale: ja })
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">年代記</h1>
      <p className="text-gray-600 mb-6">あなたの学習記録</p>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiPieChart className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.totalPhrases || 0}</p>
          <p className="text-sm text-gray-600">総フレーズ数</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiAward className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.phrasesLearned || 0}</p>
          <p className="text-sm text-gray-600">習得済み</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiTrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.currentStreak || 0}</p>
          <p className="text-sm text-gray-600">連続学習日数</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiCalendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800">{stats.totalReviews || 0}</p>
          <p className="text-sm text-gray-600">総レビュー数</p>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 日別学習履歴 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">日別学習履歴（30日間）</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 3 }}
                name="レビュー数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* タグ別分布 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">タグ別分布（上位10）</h3>
          {tagData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tagData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tagData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              タグデータがありません
            </div>
          )}
        </div>

        {/* 習熟度分布 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">習熟度分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={masteryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="フレーズ数">
                {masteryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 成長記録 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">成長記録</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">最長連続記録</span>
              <span className="text-xl font-bold text-gray-800">
                {stats.longestStreak || 0} 日
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">今月のレビュー数</span>
              <span className="text-xl font-bold text-gray-800">
                {stats.monthlyReviews || 0} 回
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">平均習熟度</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${stats.averageMastery || 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {stats.averageMastery || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}