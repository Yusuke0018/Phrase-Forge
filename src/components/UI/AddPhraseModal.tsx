/**
 * @file components/UI/AddPhraseModal.tsx
 * @description フレーズ追加モーダルコンポーネント
 * 
 * @see docs/design/add-phrase.md
 * 
 * @related
 * - types/models.ts: Phraseモデル定義
 * - stores/phrase.store.ts: フレーズ追加アクション
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus } from 'react-icons/fi';
import { usePhraseStore } from '@/stores/phrase.store';
import { ReviewInterval } from '@/types/models';
import { calculateNextReviewDate } from '@/services/srs.service';

interface AddPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPhraseModal({ isOpen, onClose }: AddPhraseModalProps) {
  const { phrases, tags, addPhrase } = usePhraseStore();
  const [formData, setFormData] = useState({
    english: '',
    japanese: '',
    pronunciation: '',
    tagInput: '',
    selectedTags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // 全てのフレーズから既存のタグを収集
  const allExistingTags = new Set<string>();
  phrases.forEach(phrase => {
    phrase.tags.forEach(tag => allExistingTags.add(tag));
  });
  
  // タグストアからのタグも追加
  tags.forEach(tag => allExistingTags.add(tag.name));
  
  // 既存のタグから重複しないタグ名を取得
  const existingTagNames = Array.from(allExistingTags)
    .filter(name => !formData.selectedTags.includes(name))
    .sort();
  
  // 入力に基づいてフィルタリングされたタグ
  const filteredTags = formData.tagInput
    ? existingTagNames.filter(tag => 
        tag.toLowerCase().includes(formData.tagInput.toLowerCase())
      )
    : existingTagNames;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.english.trim() || !formData.japanese.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addPhrase({
        english: formData.english.trim(),
        japanese: formData.japanese.trim(),
        pronunciation: formData.pronunciation.trim(),
        categoryId: 'default', // デフォルトカテゴリーID
        tags: formData.selectedTags,
        nextReviewDate: new Date(),
        reviewHistory: [],
      });

      // 成功表示
      setShowSuccess(true);
      
      // フォームをリセット
      setFormData({
        english: '',
        japanese: '',
        pronunciation: '',
        tagInput: '',
        selectedTags: [],
      });
      
      // 1.5秒後に成功表示を消して、モーダルを閉じる
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to add phrase:', error);
      alert('フレーズの追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = formData.tagInput.trim();
    if (tag && !formData.selectedTags.includes(tag)) {
      setFormData({
        ...formData,
        selectedTags: [...formData.selectedTags, tag],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      selectedTags: formData.selectedTags.filter(t => t !== tag),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* モーダル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                       max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 
                       max-h-[80vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 
                             bg-clip-text text-transparent">
                  新しいフレーズを追加
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl 
                           transition-all duration-200 hover:scale-110"
                >
                  <FiX className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                </button>
              </div>

              {/* フォーム */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 英語フレーズ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    英語フレーズ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.english}
                    onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                             focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                             transition-all duration-200 text-lg"
                    placeholder="How are you?"
                    required
                  />
                </div>

                {/* 日本語訳 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日本語訳 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.japanese}
                    onChange={(e) => setFormData({ ...formData, japanese: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                             focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                             transition-all duration-200 text-lg"
                    placeholder="元気ですか？"
                    required
                  />
                </div>

                {/* 発音記号 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    発音記号（任意）
                  </label>
                  <input
                    type="text"
                    value={formData.pronunciation}
                    onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                             focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                             transition-all duration-200"
                    placeholder="haʊ ɑr ju"
                  />
                </div>

                {/* タグ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    タグ
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.tagInput}
                        onChange={(e) => {
                          setFormData({ ...formData, tagInput: e.target.value });
                          setShowTagSuggestions(true);
                        }}
                        onFocus={() => setShowTagSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                                 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                                 transition-all duration-200"
                        placeholder="タグを入力または選択"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white 
                                 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        <FiPlus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* タグのサジェスト */}
                    {showTagSuggestions && filteredTags.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 
                                    rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 
                                    max-h-40 overflow-y-auto">
                        {filteredTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                selectedTags: [...formData.selectedTags, tag],
                                tagInput: ''
                              });
                              setShowTagSuggestions(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 
                                     dark:hover:bg-gray-700 transition-colors
                                     text-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 選択されたタグ */}
                  {formData.selectedTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 
                                   bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 
                                   dark:to-purple-900/20 text-blue-700 dark:text-blue-300 
                                   rounded-full text-sm font-medium border border-blue-200 
                                   dark:border-blue-700"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-primary-900"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ボタン */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                             font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 
                             dark:hover:bg-gray-600 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || showSuccess}
                    className={`flex-1 px-5 py-3 rounded-xl transition-all duration-200 font-medium 
                             shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                             ${showSuccess 
                               ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                               : isSubmitting
                               ? 'bg-gray-400 text-white cursor-not-allowed'
                               : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}
                  >
                    {showSuccess ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        追加完了！
                      </span>
                    ) : isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        追加中...
                      </span>
                    ) : (
                      '追加する'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}