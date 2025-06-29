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
    const filterPhrases = async () => {
      let filtered = phrases;

      // 検索フィルタ
      if (searchQuery) {
        filtered = await searchPhrases(searchQuery);
      }

      // タグフィルタ
      if (selectedTag !== 'all') {
        filtered = await filterByTag(selectedTag);
      }

      setDisplayedPhrases(filtered);
    };

    filterPhrases();
  }, [searchQuery, selectedTag, phrases, searchPhrases, filterByTag]);

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
    <div className="max-w-4xl mx-auto px-4 py-6 pt-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">武器庫</h1>
        <p className="text-gray-600 dark:text-gray-400">すべてのフレーズを管理</p>
      </div>

      {/* 検索バーとアクション */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-3 mb-4">
          {/* 検索バー */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="フレーズを検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* フィルターボタン */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2
                     ${showFilters 
                       ? 'bg-primary-50 border-primary-500 text-primary-700' 
                       : 'border-gray-300 hover:bg-gray-50'}`}
          >
            <FiFilter className="w-5 h-5" />
            <span className="hidden sm:inline">フィルター</span>
          </button>

          {/* 追加ボタン */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group relative w-10 h-10 bg-gray-900 text-white rounded-full 
                     hover:bg-gray-800 transition-all duration-200 flex items-center justify-center
                     shadow-md hover:shadow-lg hover:scale-110"
            aria-label="フレーズを追加"
          >
            <svg 
              className="w-5 h-5" 
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
            className="border-t pt-4 flex flex-wrap gap-4"
          >
            {/* タグフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タグ
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">すべて</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* フレーズ統計 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{phrases.length}</p>
          <p className="text-sm text-gray-600">総フレーズ数</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{displayedPhrases.length}</p>
          <p className="text-sm text-gray-600">検索結果</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{tags.length}</p>
          <p className="text-sm text-gray-600">タグ数</p>
        </div>
      </div>

      {/* フレーズリスト */}
      <div className="bg-white rounded-lg shadow-md">
        {displayedPhrases.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">
              {searchQuery || selectedTag !== 'all'
                ? 'フレーズが見つかりませんでした。'
                : 'まだフレーズがありません。「追加」ボタンから新しいフレーズを追加してください。'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedPhrases.map((phrase) => (
              <motion.div
                key={phrase.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800">
                      {phrase.english}
                    </h3>
                    {phrase.pronunciation && (
                      <p className="text-sm text-gray-500 mt-1">
                        /{phrase.pronunciation}/
                      </p>
                    )}
                    <p className="text-gray-600 mt-1">
                      {phrase.japanese}
                    </p>
                    
                    {/* タグ */}
                    {phrase.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {phrase.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-start gap-2">
                    {/* 次回レビュー日 */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">次回レビュー</p>
                      <p className="text-sm font-medium text-gray-700">
                        {format(phrase.nextReviewDate, 'yyyy/MM/dd')}
                      </p>
                    </div>
                    
                    {/* 編集・削除ボタン */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedPhrase(phrase);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 
                                 rounded-lg transition-colors"
                        aria-label="編集"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
  );
}