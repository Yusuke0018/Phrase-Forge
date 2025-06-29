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

import React, { useState, useEffect } from 'react';
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
  const { phrases, loadPhrases } = usePhraseStore();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    phrases: selectedPhrases,
    includeReviewHistory: false,
    includeMetadata: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectMode, setSelectMode] = useState<'all' | 'custom'>(
    selectedPhrases.length > 0 ? 'custom' : 'all'
  );
  const [selectedPhraseIds, setSelectedPhraseIds] = useState<Set<string>>(
    new Set(selectedPhrases)
  );
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(false);

  // Load phrases when dialog opens if not already loaded
  useEffect(() => {
    const loadPhrasesIfNeeded = async () => {
      if (isOpen && phrases.length === 0) {
        console.log('[ExportDialog] Loading phrases...');
        setIsLoadingPhrases(true);
        try {
          await loadPhrases();
          console.log('[ExportDialog] Phrases loaded successfully');
        } catch (error) {
          console.error('[ExportDialog] Failed to load phrases:', error);
        } finally {
          setIsLoadingPhrases(false);
        }
      }
    };
    
    loadPhrasesIfNeeded();
  }, [isOpen, phrases.length, loadPhrases]);

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('[ExportDialog] Dialog opened. Phrases count:', phrases.length);
      console.log('[ExportDialog] Selected mode:', selectMode);
      console.log('[ExportDialog] Selected phrase IDs:', selectedPhraseIds.size);
    }
  }, [isOpen, phrases.length, selectMode, selectedPhraseIds.size]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const exportOptions = {
        ...options,
        phrases: selectMode === 'all' ? [] : Array.from(selectedPhraseIds)
      };
      await exportPhrases(exportOptions, phrases);
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
        setSelectMode('all');
        setSelectedPhraseIds(new Set());
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCount = selectMode === 'all' 
    ? phrases.length 
    : selectedPhraseIds.size;
  
  // Debug log for export count
  console.log('[ExportDialog] Export count calculation:', {
    selectMode,
    phrasesLength: phrases.length,
    selectedPhraseIdsSize: selectedPhraseIds.size,
    exportCount
  });

  const togglePhraseSelection = (phraseId: string) => {
    const newSelected = new Set(selectedPhraseIds);
    if (newSelected.has(phraseId)) {
      newSelected.delete(phraseId);
    } else {
      newSelected.add(phraseId);
    }
    setSelectedPhraseIds(newSelected);
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

          {/* ダイアログ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                       max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50
                       border border-gray-100 dark:border-gray-700"
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  フレーズをエクスポート
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {isLoadingPhrases ? (
                /* ローディング状態 */
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    フレーズを読み込み中...
                  </p>
                </div>
              ) : exportSuccess ? (
                /* 成功メッセージ */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center 
                                justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
                    エクスポートが完了しました！
                  </p>
                </motion.div>
              ) : (
                /* エクスポート設定 */
                <div className="space-y-6">
                  {/* エクスポート対象 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      エクスポート対象
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="selectMode"
                          checked={selectMode === 'all'}
                          onChange={() => setSelectMode('all')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          すべてのフレーズ ({phrases.length}個)
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="selectMode"
                          checked={selectMode === 'custom'}
                          onChange={() => setSelectMode('custom')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          フレーズを選択 ({selectedPhraseIds.size}個選択中)
                        </span>
                      </label>
                    </div>
                    
                    {selectMode === 'custom' && (
                      <div className="mt-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                        {phrases.map(phrase => (
                          <label
                            key={phrase.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPhraseIds.has(phrase.id)}
                              onChange={() => togglePhraseSelection(phrase.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                              {phrase.english} - {phrase.japanese}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* フォーマット選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ファイル形式
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setOptions({ ...options, format: 'csv' })}
                        className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                          options.format === 'csv'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, format: 'json' })}
                        className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                          options.format === 'json'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">
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
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          レビュー履歴を含める
                        </span>
                      </label>
                    )}
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting || (selectMode === 'custom' && selectedPhraseIds.size === 0)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
                               hover:shadow-lg transition-all duration-200 flex items-center 
                               justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiDownload className="w-5 h-5" />
                      {isExporting ? 'エクスポート中...' : `エクスポート (${exportCount}個)`}
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