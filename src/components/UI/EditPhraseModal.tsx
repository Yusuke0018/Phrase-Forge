/**
 * @file components/UI/EditPhraseModal.tsx
 * @description フレーズ編集モーダルコンポーネント
 * 
 * @see docs/design/edit-phrase.md
 * 
 * @related
 * - types/models.ts: Phraseモデル定義
 * - stores/phrase.store.ts: フレーズ更新アクション
 * - components/UI/AddPhraseModal.tsx: 追加モーダル（参考実装）
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import { usePhraseStore } from '@/stores/phrase.store';
import { Phrase, ReviewInterval } from '@/types/models';
import { REVIEW_INTERVALS, calculateNextReviewDate, formatNextReviewDate } from '@/services/srs.service';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EditPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: Phrase | null;
}

export function EditPhraseModal({ isOpen, onClose, phrase }: EditPhraseModalProps) {
  const { phrases, tags, updatePhrase, deletePhrase } = usePhraseStore();
  const [formData, setFormData] = useState({
    english: '',
    japanese: '',
    pronunciation: '',
    tagInput: '',
    selectedTags: [] as string[],
    nextReviewDate: new Date(),
    reviewInterval: 'tomorrow' as ReviewInterval,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  useEffect(() => {
    if (phrase) {
      setFormData({
        english: phrase.english,
        japanese: phrase.japanese,
        pronunciation: phrase.pronunciation || '',
        tagInput: '',
        selectedTags: [...phrase.tags],
        nextReviewDate: new Date(phrase.nextReviewDate),
        reviewInterval: 'tomorrow',
      });
    }
  }, [phrase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phrase || !formData.english.trim() || !formData.japanese.trim()) {
      return;
    }

    try {
      await updatePhrase(phrase.id, {
        english: formData.english.trim(),
        japanese: formData.japanese.trim(),
        pronunciation: formData.pronunciation.trim(),
        tags: formData.selectedTags,
        nextReviewDate: formData.nextReviewDate,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update phrase:', error);
    }
  };

  const handleDelete = async () => {
    if (!phrase) return;

    try {
      await deletePhrase(phrase.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete phrase:', error);
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

  if (!phrase) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* モーダル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                       max-w-lg w-full bg-white rounded-lg shadow-xl z-50 
                       max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  フレーズを編集
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {!showDeleteConfirm ? (
                /* 編集フォーム */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 英語フレーズ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      英語フレーズ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.english}
                      onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                               focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                               transition-all duration-200 text-lg"
                      required
                    />
                  </div>

                  {/* 日本語訳 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      日本語訳 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.japanese}
                      onChange={(e) => setFormData({ ...formData, japanese: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                               focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                               transition-all duration-200 text-lg"
                      required
                    />
                  </div>

                  {/* 発音記号 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      発音記号（任意）
                    </label>
                    <input
                      type="text"
                      value={formData.pronunciation}
                      onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                               focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                               transition-all duration-200"
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

                  {/* 次回レビュー日 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      次回レビュー日
                    </label>
                    <div className="space-y-3">
                      {/* 現在の設定 */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 
                                    rounded-xl border border-blue-200 dark:border-blue-700">
                        <FiCalendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {format(formData.nextReviewDate, 'yyyy年MM月dd日', { locale: ja })}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {formatNextReviewDate(formData.nextReviewDate)}
                          </p>
                        </div>
                      </div>

                      {/* 復習間隔の選択 */}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          復習間隔を選択:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(REVIEW_INTERVALS).map(([key, value]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  reviewInterval: key as ReviewInterval,
                                  nextReviewDate: calculateNextReviewDate(key as ReviewInterval),
                                });
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                       ${formData.reviewInterval === key
                                         ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                         : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                       }`}
                            >
                              {value.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* カスタム日付選択 */}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          または日付を直接選択:
                        </p>
                        <input
                          type="date"
                          value={format(formData.nextReviewDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            setFormData({
                              ...formData,
                              nextReviewDate: newDate,
                              reviewInterval: 'tomorrow', // カスタム日付選択時はデフォルトに戻す
                            });
                          }}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl 
                                   focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600
                                   transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-3 border border-red-300 dark:border-red-600 text-red-600 
                               dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 
                               transition-all duration-200 flex items-center gap-2 font-medium"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      削除
                    </button>
                    <div className="flex-1"></div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                               font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 
                               dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-xl transition-all duration-200 font-medium 
                               shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                               bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    >
                      保存する
                    </button>
                  </div>
                </form>
              ) : (
                /* 削除確認 */
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    本当に削除しますか？
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    「{phrase.english}」を削除します。<br />
                    この操作は取り消せません。
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                               font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 
                               dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white 
                               rounded-xl hover:shadow-lg transition-all duration-200 font-medium
                               hover:scale-[1.02]"
                    >
                      削除する
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}