/**
 * @file app/dojo/page.tsx
 * @description 道場画面（テストモード）
 * 
 * @see docs/design/dojo-screen.md
 * 
 * @related
 * - components/Dojo/QuickTest.tsx: 瞬間テストコンポーネント
 * - components/Dojo/RandomTest.tsx: ランダム組手コンポーネント
 * - stores/phrase.store.ts: フレーズデータストア
 */

'use client';

import { useState, useEffect } from 'react';
import { FiZap, FiShuffle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { usePhraseStore } from '@/stores/phrase.store';
import { Phrase } from '@/types/models';

type TestMode = 'quick' | 'random' | null;

export default function DojoPage() {
  const { phrases, categories, loadPhrases, loadCategories } = usePhraseStore();
  const [testMode, setTestMode] = useState<TestMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testPhrases, setTestPhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [testComplete, setTestComplete] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadPhrases(), loadCategories()]);
    };
    init();
  }, [loadPhrases, loadCategories]);

  const startTest = (mode: TestMode) => {
    let filtered = phrases;
    
    if (selectedCategory !== 'all') {
      filtered = phrases.filter(p => p.categoryId === selectedCategory);
    }

    if (filtered.length === 0) {
      alert('テスト可能なフレーズがありません。');
      return;
    }

    // ランダムモードの場合はシャッフル
    if (mode === 'random') {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    setTestMode(mode);
    setTestPhrases(filtered.slice(0, 10)); // 最大10問
    setCurrentIndex(0);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setTestComplete(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setScore({
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    });

    if (currentIndex < testPhrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setTestComplete(true);
    }
  };

  const resetTest = () => {
    setTestMode(null);
    setTestComplete(false);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const currentPhrase = testPhrases[currentIndex];

  if (testMode && !testComplete && currentPhrase) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
        {/* 進捗バー */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>問題 {currentIndex + 1} / {testPhrases.length}</span>
            <span>正解: {score.correct} / {score.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / testPhrases.length) * 100}%` }}
            />
          </div>
        </div>

        {/* テストカード */}
        <motion.div
          key={currentPhrase.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {testMode === 'quick' ? currentPhrase.japanese : currentPhrase.english}
            </h2>
            
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <p className="text-xl text-primary-600">
                  {testMode === 'quick' ? currentPhrase.english : currentPhrase.japanese}
                </p>
                {currentPhrase.pronunciation && testMode === 'random' && (
                  <p className="text-lg text-gray-500 mt-2">
                    /{currentPhrase.pronunciation}/
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-3 bg-primary-600 text-white rounded-lg 
                       hover:bg-primary-700 transition-colors"
            >
              答えを見る
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer(false)}
                className="py-3 bg-red-100 text-red-700 rounded-lg 
                         hover:bg-red-200 transition-colors font-medium"
              >
                不正解
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="py-3 bg-green-100 text-green-700 rounded-lg 
                         hover:bg-green-200 transition-colors font-medium"
              >
                正解
              </button>
            </div>
          )}
        </motion.div>

        {/* 中断ボタン */}
        <div className="mt-6 text-center">
          <button
            onClick={resetTest}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            テストを中断
          </button>
        </div>
      </div>
    );
  }

  if (testComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            テスト完了！
          </h2>
          
          <div className="mb-6">
            <div className="text-6xl font-bold text-primary-600 mb-2">
              {percentage}%
            </div>
            <p className="text-xl text-gray-600">
              {score.correct} / {score.total} 問正解
            </p>
          </div>

          <div className="mb-8">
            {percentage >= 80 ? (
              <p className="text-lg text-green-600">素晴らしい成績です！</p>
            ) : percentage >= 60 ? (
              <p className="text-lg text-yellow-600">よく頑張りました！</p>
            ) : (
              <p className="text-lg text-red-600">もう少し練習が必要です。</p>
            )}
          </div>

          <button
            onClick={resetTest}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg 
                     hover:bg-primary-700 transition-colors"
          >
            道場に戻る
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">道場</h1>
      <p className="text-gray-600 mb-6">記憶の瞬発力を試そう</p>

      {/* カテゴリ選択 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリを選択
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">すべてのカテゴリ</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* テストモード選択 */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => startTest('quick')}
          className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg 
                   transition-shadow cursor-pointer group"
        >
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center 
                          justify-center mx-auto group-hover:bg-yellow-200 transition-colors">
              <FiZap className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">瞬間テスト</h3>
          <p className="text-gray-600">
            日本語を見て、英語をすぐに思い出せるかテスト
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => startTest('random')}
          className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg 
                   transition-shadow cursor-pointer group"
        >
          <div className="mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center 
                          justify-center mx-auto group-hover:bg-purple-200 transition-colors">
              <FiShuffle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">ランダム組手</h3>
          <p className="text-gray-600">
            英語を見て、意味を理解できるかランダムにテスト
          </p>
        </motion.button>
      </div>
    </div>
  );
}