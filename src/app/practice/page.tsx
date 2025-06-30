/**
 * @file app/practice/page.tsx
 * @description 練習モードページ
 * フレーズの自由練習機能を提供
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiSkipForward, FiRefreshCw, FiSettings } from 'react-icons/fi';
import { usePhraseStore } from '@/stores/phrase.store';
import { Phrase } from '@/types/models';

type PracticeMode = 'random' | 'category' | 'tag';
type DisplayMode = 'english' | 'japanese' | 'both';

export default function PracticePage() {
  const { phrases, categories, tags, loadPhrases, loadCategories, loadTags } = usePhraseStore();
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('random');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('english');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [autoPlayDelay, setAutoPlayDelay] = useState(3); // 秒
  const [showSettings, setShowSettings] = useState(false);
  const [practicedPhrases, setPracticedPhrases] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPhrases();
    loadCategories();
    loadTags();
  }, [loadPhrases, loadCategories, loadTags]);

  useEffect(() => {
    if (phrases.length > 0 && !currentPhrase) {
      getNextPhrase();
    }
  }, [phrases]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentPhrase) {
      timer = setTimeout(() => {
        handleNext();
      }, autoPlayDelay * 1000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentPhrase, autoPlayDelay]);

  const getFilteredPhrases = (): Phrase[] => {
    let filtered = [...phrases];

    switch (practiceMode) {
      case 'category':
        if (selectedCategory) {
          filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }
        break;
      case 'tag':
        if (selectedTag) {
          filtered = filtered.filter(p => p.tags.includes(selectedTag));
        }
        break;
    }

    // 既に練習したフレーズを除外（オプション）
    return filtered.filter(p => !practicedPhrases.has(p.id));
  };

  const getNextPhrase = () => {
    const availablePhrases = getFilteredPhrases();
    if (availablePhrases.length === 0) {
      // すべて練習済みの場合はリセット
      setPracticedPhrases(new Set());
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    setCurrentPhrase(availablePhrases[randomIndex]);
    setShowAnswer(false);
  };

  const handleNext = () => {
    if (currentPhrase) {
      setPracticedPhrases(prev => new Set(prev).add(currentPhrase.id));
    }
    getNextPhrase();
  };

  const handleReset = () => {
    setPracticedPhrases(new Set());
    getNextPhrase();
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">練習モード</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FiSettings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">練習設定</h2>
          
          {/* 練習モード */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              練習モード
            </label>
            <select
              value={practiceMode}
              onChange={(e) => setPracticeMode(e.target.value as PracticeMode)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="random">ランダム</option>
              <option value="category">カテゴリ別</option>
              <option value="tag">タグ別</option>
            </select>
          </div>

          {/* カテゴリ選択 */}
          {practiceMode === 'category' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                カテゴリ
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">すべて</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* タグ選択 */}
          {practiceMode === 'tag' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                タグ
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">すべて</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 表示モード */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              表示モード
            </label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="english">英語 → 日本語</option>
              <option value="japanese">日本語 → 英語</option>
              <option value="both">両方表示</option>
            </select>
          </div>

          {/* 自動再生の遅延 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              自動再生の間隔: {autoPlayDelay}秒
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={autoPlayDelay}
              onChange={(e) => setAutoPlayDelay(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </motion.div>
      )}

      {/* メインカード */}
      {currentPhrase ? (
        <motion.div
          key={currentPhrase.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6"
        >
          <div className="min-h-[300px] flex flex-col justify-center">
            {/* 問題表示 */}
            {(displayMode === 'english' || displayMode === 'both') && (
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {currentPhrase.english}
                </h2>
                {currentPhrase.pronunciation && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    /{currentPhrase.pronunciation}/
                  </p>
                )}
              </div>
            )}

            {(displayMode === 'japanese' || displayMode === 'both') && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {displayMode === 'japanese' && !showAnswer ? '?' : currentPhrase.japanese}
                </h2>
              </div>
            )}

            {/* 答え表示 */}
            {showAnswer && displayMode !== 'both' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <p className="text-xl text-gray-700 dark:text-gray-300">
                  {displayMode === 'english' ? currentPhrase.japanese : currentPhrase.english}
                </p>
                {displayMode === 'japanese' && currentPhrase.pronunciation && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                    /{currentPhrase.pronunciation}/
                  </p>
                )}
              </motion.div>
            )}

            {/* タグ */}
            {currentPhrase.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {currentPhrase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 答えを表示ボタン */}
          {displayMode !== 'both' && !showAnswer && (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              答えを表示
            </button>
          )}
        </motion.div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            練習可能なフレーズがありません
          </p>
        </div>
      )}

      {/* コントロールボタン */}
      <div className="flex justify-center gap-4">
        <button
          onClick={togglePlayPause}
          className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6" />}
        </button>
        
        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <FiSkipForward className="w-6 h-6" />
        </button>
        
        <button
          onClick={handleReset}
          className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <FiRefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* 進捗表示 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          練習済み: {practicedPhrases.size} / {getFilteredPhrases().length + practicedPhrases.size} フレーズ
        </p>
      </div>
    </div>
  );
}