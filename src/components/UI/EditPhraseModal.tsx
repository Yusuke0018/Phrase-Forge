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
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { usePhraseStore } from '@/stores/phrase.store';
import { Phrase } from '@/types/models';

interface EditPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: Phrase | null;
}

export function EditPhraseModal({ isOpen, onClose, phrase }: EditPhraseModalProps) {
  const { tags, updatePhrase, deletePhrase } = usePhraseStore();
  const [formData, setFormData] = useState({
    english: '',
    japanese: '',
    pronunciation: '',
    tagInput: '',
    selectedTags: [] as string[],
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // 既存のタグから重複しないタグ名を取得
  const existingTagNames = Array.from(
    new Set(tags.map(tag => tag.name))
  ).filter(name => !formData.selectedTags.includes(name));
  
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
                    />
                  </div>

                  {/* タグ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      タグ
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.tagInput}
                        onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                                 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="タグを入力"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg 
                                 transition-colors"
                      >
                        <FiPlus className="w-5 h-5" />
                      </button>
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
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg 
                               hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      削除
                    </button>
                    <div className="flex-1"></div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg 
                               hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg 
                               hover:bg-primary-700 transition-colors"
                    >
                      保存する
                    </button>
                  </div>
                </form>
              ) : (
                /* 削除確認 */
                <div className="text-center py-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    本当に削除しますか？
                  </h3>
                  <p className="text-gray-600 mb-6">
                    「{phrase.english}」を削除します。<br />
                    この操作は取り消せません。
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg 
                               hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg 
                               hover:bg-red-700 transition-colors"
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