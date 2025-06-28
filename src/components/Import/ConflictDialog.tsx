/**
 * @file components/Import/ConflictDialog.tsx
 * @description インポート時のコンフリクト解決ダイアログ
 * 
 * @see docs/design/conflict-resolution.md
 * 
 * @related
 * - types/export.types.ts: ImportConflict型定義
 * - services/import.service.ts: インポート処理
 * - components/Import/ImportDialog.tsx: 親コンポーネント
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheck, FiX } from 'react-icons/fi';
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

  const handleResolution = (phraseId: string, resolution: 'keep_existing' | 'use_imported' | 'merge_both') => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(phraseId, resolution);
    setResolutions(newResolutions);

    // 次のコンフリクトへ
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleResolveAll = () => {
    // すべてのコンフリクトが解決されているか確認
    const allResolved = conflicts.every(conflict => 
      resolutions.has(conflict.existing.id)
    );

    if (allResolved) {
      onResolve(resolutions);
    }
  };

  const handleApplyToAll = (resolution: 'keep_existing' | 'use_imported' | 'merge_both') => {
    const newResolutions = new Map<string, 'keep_existing' | 'use_imported' | 'merge_both'>();
    conflicts.forEach(conflict => {
      newResolutions.set(conflict.existing.id, resolution);
    });
    setResolutions(newResolutions);
    onResolve(newResolutions);
  };

  if (!currentConflict) return null;

  const isResolved = resolutions.has(currentConflict.existing.id);
  const allResolved = conflicts.every(conflict => resolutions.has(conflict.existing.id));

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
            onClick={onCancel}
          />

          {/* ダイアログ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-10 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                       max-w-2xl w-full bg-white rounded-lg shadow-xl z-50 
                       max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* ヘッダー */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      重複フレーズが見つかりました
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentIndex + 1} / {conflicts.length} 件目
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* 既存のフレーズ */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-sm bg-blue-200 px-2 py-1 rounded">既存</span>
                    現在のデータ
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">英語:</span>{' '}
                      <span className="text-gray-900">{currentConflict.existing.english}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">日本語:</span>{' '}
                      <span className="text-gray-900">{currentConflict.existing.japanese}</span>
                    </div>
                    {currentConflict.existing.pronunciation && (
                      <div>
                        <span className="font-medium text-gray-700">発音:</span>{' '}
                        <span className="text-gray-900">/{currentConflict.existing.pronunciation}/</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">タグ:</span>{' '}
                      <span className="text-gray-900">
                        {currentConflict.existing.tags.join(', ') || 'なし'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">作成日:</span>{' '}
                      <span className="text-gray-900">
                        {format(currentConflict.existing.createdAt, 'yyyy/MM/dd')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* インポートするフレーズ */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                    <span className="text-sm bg-green-200 px-2 py-1 rounded">新規</span>
                    インポートデータ
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">英語:</span>{' '}
                      <span className="text-gray-900">{currentConflict.imported.english}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">日本語:</span>{' '}
                      <span className="text-gray-900">{currentConflict.imported.japanese}</span>
                    </div>
                    {currentConflict.imported.pronunciation && (
                      <div>
                        <span className="font-medium text-gray-700">発音:</span>{' '}
                        <span className="text-gray-900">/{currentConflict.imported.pronunciation}/</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">タグ:</span>{' '}
                      <span className="text-gray-900">
                        {currentConflict.imported.tags.join(', ') || 'なし'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 差分表示 */}
                {currentConflict.differences.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">差分</h4>
                    <p className="text-sm text-gray-700">
                      次の項目が異なります: {currentConflict.differences.join('、')}
                    </p>
                  </div>
                )}

                {/* 解決オプション */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">どのように処理しますか？</h4>
                  
                  <button
                    onClick={() => handleResolution(currentConflict.existing.id, 'keep_existing')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors
                      ${resolutions.get(currentConflict.existing.id) === 'keep_existing'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${resolutions.get(currentConflict.existing.id) === 'keep_existing'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'}`}>
                        {resolutions.get(currentConflict.existing.id) === 'keep_existing' && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">既存のデータを保持</p>
                        <p className="text-sm text-gray-600 mt-1">
                          インポートデータをスキップし、現在のデータをそのまま使用します
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleResolution(currentConflict.existing.id, 'use_imported')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors
                      ${resolutions.get(currentConflict.existing.id) === 'use_imported'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${resolutions.get(currentConflict.existing.id) === 'use_imported'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'}`}>
                        {resolutions.get(currentConflict.existing.id) === 'use_imported' && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">インポートデータで上書き</p>
                        <p className="text-sm text-gray-600 mt-1">
                          既存のデータをインポートデータで置き換えます
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleResolution(currentConflict.existing.id, 'merge_both')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors
                      ${resolutions.get(currentConflict.existing.id) === 'merge_both'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${resolutions.get(currentConflict.existing.id) === 'merge_both'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'}`}>
                        {resolutions.get(currentConflict.existing.id) === 'merge_both' && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">両方を保持</p>
                        <p className="text-sm text-gray-600 mt-1">
                          既存のデータを残したまま、インポートデータを新規追加します
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* フッター */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                {/* 一括適用ボタン */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyToAll('keep_existing')}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    すべて既存を保持
                  </button>
                  <button
                    onClick={() => handleApplyToAll('use_imported')}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    すべて上書き
                  </button>
                </div>

                {/* ナビゲーション */}
                <div className="flex gap-3">
                  {currentIndex > 0 && (
                    <button
                      onClick={() => setCurrentIndex(currentIndex - 1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      前へ
                    </button>
                  )}
                  
                  {currentIndex < conflicts.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      disabled={!isResolved}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg 
                               hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  ) : (
                    <button
                      onClick={handleResolveAll}
                      disabled={!allResolved}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg 
                               hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      インポート実行
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}