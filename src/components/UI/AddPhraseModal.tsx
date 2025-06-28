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
  const { categories, tags, addPhrase } = usePhraseStore();
  const [formData, setFormData] = useState({
    english: '',
    japanese: '',
    pronunciation: '',
    categoryId: 'daily',
    tagInput: '',
    selectedTags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.english.trim() || !formData.japanese.trim()) {
      return;
    }

    try {
      await addPhrase({
        english: formData.english.trim(),
        japanese: formData.japanese.trim(),
        pronunciation: formData.pronunciation.trim(),
        categoryId: formData.categoryId,
        tags: formData.selectedTags,
        nextReviewDate: calculateNextReviewDate('tomorrow'),
        reviewHistory: [],
      });

      // フォームをリセット
      setFormData({
        english: '',
        japanese: '',
        pronunciation: '',
        categoryId: 'daily',
        tagInput: '',
        selectedTags: [],
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to add phrase:', error);
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
                  新しいフレーズを追加
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="haʊ ɑr ju"
                  />
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                             focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
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
                                   bg-primary-100 text-primary-700 rounded-full text-sm"
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
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                             hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg 
                             hover:bg-primary-700 transition-colors"
                  >
                    追加する
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