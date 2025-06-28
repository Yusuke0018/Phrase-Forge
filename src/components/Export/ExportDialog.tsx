/**
 * @file components/Export/ExportDialog.tsx
 * @description フレーズエクスポートダイアログ
 * 
 * @see docs/design/export-ui.md
 * 
 * @related
 * - services/export.service.ts: エクスポート処理
 * - types/export.types.ts: エクスポート関連の型定義
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiCheck } from 'react-icons/fi';
import { usePhraseStore } from '@/stores/phrase.store';
import { exportPhrases } from '@/services/export.service';
import { ExportOptions } from '@/types/export.types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhrases?: string[];
}

export function ExportDialog({ isOpen, onClose, selectedPhrases = [] }: ExportDialogProps) {
  const { phrases } = usePhraseStore();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    phrases: selectedPhrases,
    includeReviewHistory: false,
    includeMetadata: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportPhrases(options, phrases);
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCount = options.phrases.length > 0 
    ? options.phrases.length 
    : phrases.length;

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

          {/* ダイアログ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                       max-w-md w-full bg-white rounded-lg shadow-xl z-50"
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  フレーズをエクスポート
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {exportSuccess ? (
                /* 成功メッセージ */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center 
                                justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-800">
                    エクスポートが完了しました！
                  </p>
                </motion.div>
              ) : (
                /* エクスポート設定 */
                <div className="space-y-6">
                  {/* エクスポート対象 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      エクスポート対象
                    </p>
                    <p className="text-lg font-semibold text-primary-600">
                      {exportCount} 個のフレーズ
                    </p>
                  </div>

                  {/* フォーマット選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ファイル形式
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setOptions({ ...options, format: 'csv' })}
                        className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                          options.format === 'csv'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, format: 'json' })}
                        className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                          options.format === 'json'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* オプション */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeMetadata}
                        onChange={(e) => setOptions({ 
                          ...options, 
                          includeMetadata: e.target.checked 
                        })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        メタデータを含める（ID、作成日時など）
                      </span>
                    </label>

                    {options.format === 'json' && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.includeReviewHistory}
                          onChange={(e) => setOptions({ 
                            ...options, 
                            includeReviewHistory: e.target.checked 
                          })}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          レビュー履歴を含める
                        </span>
                      </label>
                    )}
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                               hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg 
                               hover:bg-primary-700 transition-colors flex items-center 
                               justify-center gap-2 disabled:opacity-50"
                    >
                      <FiDownload className="w-5 h-5" />
                      {isExporting ? 'エクスポート中...' : 'エクスポート'}
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