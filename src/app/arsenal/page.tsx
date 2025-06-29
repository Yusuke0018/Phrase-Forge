/**
 * @file app/arsenal/page.tsx
 * @description 武器庫画面（フレーズ検索・管理）
 * 
 * @see docs/design/arsenal-screen.md
 * 
 * @related
 * - components/UI/AddPhraseModal.tsx: フレーズ追加モーダル
 * - components/Arsenal/PhraseList.tsx: フレーズリストコンポーネント
 * - stores/phrase.store.ts: フレーズデータストア
 */

'use client';

import { useEffect, useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiDownload, FiUpload } from 'react-icons/fi';
import { format } from 'date-fns';
import { usePhraseStore } from '@/stores/phrase.store';
import { AddPhraseModal } from '@/components/UI/AddPhraseModal';
import { EditPhraseModal } from '@/components/UI/EditPhraseModal';
import { motion } from 'framer-motion';
import { Phrase } from '@/types/models';

export default function ArsenalPage() {
  const { 
    phrases, 
    categories, 
    tags,
    isLoading,
    loadPhrases,
    loadCategories,
    loadTags,
    searchPhrases,
    filterByCategory,
    filterByTag
  } = usePhraseStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
  const [displayedPhrases, setDisplayedPhrases] = useState<Phrase[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadPhrases(),
        loadCategories(),
        loadTags()
      ]);
    };
    init();
  }, [loadPhrases, loadCategories, loadTags]);

  useEffect(() => {
    const filterPhrases = () => {
      let filtered = phrases;

      // 検索フィルタ
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(phrase =>
          phrase.english.toLowerCase().includes(lowerQuery) ||
          phrase.japanese.toLowerCase().includes(lowerQuery) ||
          (phrase.pronunciation && phrase.pronunciation.toLowerCase().includes(lowerQuery))
        );
      }

      // タグフィルタ
      if (selectedTag !== 'all') {
        filtered = filtered.filter(phrase => 
          phrase.tags.includes(selectedTag)
        );
      }

      setDisplayedPhrases(filtered);
    };

    filterPhrases();
  }, [searchQuery, selectedTag, phrases]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6 pt-20">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 
                     bg-clip-text text-transparent mb-3"
          >
            武器庫
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            あなたの英語フレーズコレクション
          </motion.p>
        </div>

        {/* 検索バーとアクション */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl 
                   border border-gray-100 dark:border-gray-700 p-6 mb-8"
        >
          <div className="flex gap-3 mb-4">
            {/* 検索バー */}
            <div className="flex-1 relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 
                               group-focus-within:text-blue-500 transition-colors w-5 h-5 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="フレーズを検索..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-0 rounded-xl 
                         focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700
                         transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            {/* フィルターボタン */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-xl transition-all duration-200 flex items-center gap-2
                       ${showFilters 
                         ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                         : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              <FiFilter className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">フィルター</span>
            </button>

            {/* 追加ボタン */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="group relative w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 
                       text-white rounded-xl hover:shadow-xl transition-all duration-300 
                       flex items-center justify-center hover:scale-105 shadow-lg"
              aria-label="フレーズを追加"
            >
              <svg 
                className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              </button>
          </div>

          {/* フィルターオプション */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-4"
            >
              {/* タグフィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  タグ
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">すべて</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* フレーズ統計 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 
                     rounded-2xl p-6 text-center border border-blue-200 dark:border-blue-700 
                     hover:shadow-lg transition-shadow duration-300"
          >
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 
                        bg-clip-text text-transparent">{phrases.length}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">総フレーズ数</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 
                     rounded-2xl p-6 text-center border border-purple-200 dark:border-purple-700
                     hover:shadow-lg transition-shadow duration-300"
          >
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 
                        bg-clip-text text-transparent">{displayedPhrases.length}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">検索結果</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 
                     rounded-2xl p-6 text-center border border-pink-200 dark:border-pink-700
                     hover:shadow-lg transition-shadow duration-300"
          >
            <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 
                        bg-clip-text text-transparent">{tags.length}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">タグ数</p>
          </motion.div>
        </div>

        {/* フレーズリスト */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl 
                   border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {displayedPhrases.length === 0 ? (
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 
                         dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center"
              >
                <FiSearch className="w-12 h-12 text-gray-400" />
              </motion.div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {searchQuery || selectedTag !== 'all'
                  ? 'フレーズが見つかりませんでした。'
                  : 'まだフレーズがありません。'}
              </p>
              {!searchQuery && selectedTag === 'all' && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  「＋」ボタンから新しいフレーズを追加しましょう！
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayedPhrases.map((phrase, index) => (
                <motion.div
                  key={phrase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all duration-200
                           hover:shadow-md relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 
                                   group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {phrase.english}
                      </h3>
                      {phrase.pronunciation && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                          /{phrase.pronunciation}/
                        </p>
                      )}
                      <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                        {phrase.japanese}
                      </p>
                    
                      {/* タグ */}
                      {phrase.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {phrase.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 
                                       dark:from-blue-900/20 dark:to-purple-900/20
                                       text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium
                                       border border-blue-200 dark:border-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                  
                    <div className="ml-6 flex items-start gap-4">
                      {/* 次回レビュー日 */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">次回レビュー</p>
                        <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 
                                     bg-clip-text text-transparent">
                          {format(phrase.nextReviewDate, 'MM/dd')}
                        </p>
                      </div>
                      
                      {/* 編集・削除ボタン */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setSelectedPhrase(phrase);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                                   dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          aria-label="編集"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            ))}
            </div>
          )}
        </motion.div>

      {/* フレーズ追加モーダル */}
      <AddPhraseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* フレーズ編集モーダル */}
      <EditPhraseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPhrase(null);
        }}
        phrase={selectedPhrase}
      />
      </div>
    </div>
  );
}