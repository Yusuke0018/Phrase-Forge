/**
 * @file components/Import/ConflictDialog.tsx
 * @description インポート時のコンフリクト解決ダイアログ
 * 
 * @see docs/design/conflict-resolution.md
 * 
 * @related
 * - types/export.types.ts: ImportConflict型定義
 * - utils/duplicate-detector.ts: 重複検出ロジック
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { ImportConflict } from '@/types/export.types';
import { format } from 'date-fns';

interface ConflictDialogProps {
  isOpen: boolean;
  conflicts: ImportConflict[];
  onResolve: (resolutions: Map<string, 'keep_existing' | 'use_imported' | 'merge_both'>) => void;
  onCancel: () => void;
}

export function ConflictDialog({ isOpen, conflicts, onResolve, onCancel }: ConflictDialogProps) {
  const [resolutions, setResolutions] = useState<Map<string, 'keep_existing' | 'use_imported' | 'merge_both'>>(
    new Map()
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentConflict = conflicts[currentIndex];

  const handleResolution = (action: 'keep_existing' | 'use_imported' | 'merge_both') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(currentConflict.existing.id, action);
    setResolutions(newResolutions);

    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 全てのコンフリクトを解決したら
      onResolve(newResolutions);
    }
  };

  const handleBatchResolution = (action: 'keep_existing' | 'use_imported' | 'merge_both') => {
    const newResolutions = new Map();
    conflicts.forEach(conflict => {
      newResolutions.set(conflict.existing.id, action);
    });
    onResolve(newResolutions);
  };

  if (!currentConflict) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-[60]"
          />

          {/* ダイアログ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-x-4 top-10 bottom-10 md:inset-x-auto md:left-1/2 
                       md:-translate-x-1/2 md:max-w-2xl md:w-full md:h-auto
                       bg-white rounded-lg shadow-xl z-[61] overflow-hidden flex flex-col"
          >
            {/* ヘッダー */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-800">
                    重複フレーズが見つかりました
                  </h2>
                </div>
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {currentIndex + 1} / {conflicts.length} 件目のコンフリクト
              </p>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* 既存のフレーズ */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    既存のフレーズ
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">英語:</span>
                      <p className="font-medium text-gray-800">{currentConflict.existing.english}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">日本語:</span>
                      <p className="font-medium text-gray-800">{currentConflict.existing.japanese}</p>
                    </div>
                    {currentConflict.existing.pronunciation && (
                      <div>
                        <span className="text-gray-600">発音:</span>
                        <p className="font-medium text-gray-800">
                          /{currentConflict.existing.pronunciation}/
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">タグ:</span>
                      <p className="font-medium text-gray-800">
                        {currentConflict.existing.tags.join(', ') || 'なし'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">次回レビュー:</span>
                      <p className="font-medium text-gray-800">
                        {format(currentConflict.existing.nextReviewDate, 'yyyy/MM/dd')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* インポートするフレーズ */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    インポートするフレーズ
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">英語:</span>
                      <p className="font-medium text-gray-800">{currentConflict.imported.english}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">日本語:</span>
                      <p className="font-medium text-gray-800">{currentConflict.imported.japanese}</p>
                    </div>
                    {currentConflict.imported.pronunciation && (
                      <div>
                        <span className="text-gray-600">発音:</span>
                        <p className="font-medium text-gray-800">
                          /{currentConflict.imported.pronunciation}/
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">タグ:</span>
                      <p className="font-medium text-gray-800">
                        {currentConflict.imported.tags.join(', ') || 'なし'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">次回レビュー:</span>
                      <p className="font-medium text-gray-800">
                        {format(currentConflict.imported.nextReviewDate, 'yyyy/MM/dd')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 相違点 */}
              {currentConflict.differences.length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 mb-1">相違点:</p>
                  <p className="text-sm text-orange-700">
                    {currentConflict.differences.join('、')}
                  </p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="p-6 border-t bg-gray-50">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => handleResolution('keep_existing')}
                  className="py-3 px-4 bg-blue-100 text-blue-700 rounded-lg 
                           hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  既存を保持
                </button>
                <button
                  onClick={() => handleResolution('use_imported')}
                  className="py-3 px-4 bg-yellow-100 text-yellow-700 rounded-lg 
                           hover:bg-yellow-200 transition-colors text-sm font-medium"
                >
                  インポートで上書き
                </button>
                <button
                  onClick={() => handleResolution('merge_both')}
                  className="py-3 px-4 bg-green-100 text-green-700 rounded-lg 
                           hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  両方保持
                </button>
              </div>

              {/* 一括操作 */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">残りも同じ操作を適用:</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleBatchResolution('keep_existing')}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    全て既存を保持
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => handleBatchResolution('use_imported')}
                    className="text-sm text-yellow-600 hover:text-yellow-800 underline"
                  >
                    全て上書き
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={() => handleBatchResolution('merge_both')}
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    全て両方保持
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}