/**
 * @file components/Import/ImportDialog.tsx
 * @description フレーズインポートダイアログ
 * 
 * @see docs/design/import-ui.md
 * 
 * @related
 * - services/import.service.ts: インポート処理
 * - components/Import/ConflictDialog.tsx: コンフリクト解決UI
 * - types/export.types.ts: インポート関連の型定義
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload, FiFile, FiAlertCircle } from 'react-icons/fi';
import { usePhraseStore } from '@/stores/phrase.store';
import { 
  parseCSVFile, 
  parseJSONFile, 
  validateImportData,
  convertToPhrase,
  detectConflicts,
  importPhrases
} from '@/services/import.service';
import { ImportOptions, ImportConflict } from '@/types/export.types';
import { ConflictDialog } from './ConflictDialog';
import { Phrase } from '@/types/models';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const { loadPhrases } = usePhraseStore();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [parsedPhrases, setParsedPhrases] = useState<Partial<Phrase>[]>([]);
  const [importOptions] = useState<ImportOptions>({
    mergeStrategy: 'skip',
    autoResolveConflicts: false
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setErrors([]);

      // ファイルの解析
      let data: any[];
      if (file.name.endsWith('.csv')) {
        data = await parseCSVFile(file);
      } else if (file.name.endsWith('.json')) {
        data = await parseJSONFile(file);
      } else {
        throw new Error('サポートされていないファイル形式です');
      }

      // データの検証
      const validationErrors = validateImportData(data);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // フレーズへの変換
      const phrases: Partial<Phrase>[] = [];
      for (const item of data) {
        phrases.push(await convertToPhrase(item));
      }
      setParsedPhrases(phrases);

      // 重複チェック
      const detectedConflicts = await detectConflicts(phrases);
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setShowConflictDialog(true);
      } else {
        // コンフリクトがない場合は直接インポート
        await performImport(phrases);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'インポートに失敗しました']);
    } finally {
      setIsProcessing(false);
    }
  };

  const performImport = async (
    phrases: Partial<Phrase>[], 
    resolutions?: Map<string, 'keep_existing' | 'use_imported' | 'merge_both'>
  ) => {
    try {
      const result = await importPhrases(phrases, importOptions, resolutions);
      
      // フレーズリストを更新
      await loadPhrases();
      
      // 成功メッセージ
      alert(`インポートが完了しました\n追加: ${result.added}件\n更新: ${result.updated}件\nスキップ: ${result.skipped}件`);
      
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'インポートに失敗しました']);
    }
  };

  const handleConflictResolution = async (resolutions: Map<string, 'keep_existing' | 'use_imported' | 'merge_both'>) => {
    setShowConflictDialog(false);
    await performImport(parsedPhrases, resolutions);
  };

  return (
    <>
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                         max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50
                         border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    フレーズをインポート
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl 
                             transition-all duration-200 hover:scale-110"
                  >
                    <FiX className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* ファイル選択エリア */}
                <div className="space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 
                             text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors
                             bg-gray-50 dark:bg-gray-700/50"
                  >
                    {file ? (
                      <div className="space-y-2">
                        <FiFile className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <button
                          onClick={() => setFile(null)}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 
                                   dark:hover:text-red-300 underline"
                        >
                          ファイルを変更
                        </button>
                      </div>
                    ) : (
                      <>
                        <FiUpload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          ファイルをドロップ
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          CSV または JSON ファイルに対応
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* スマホ対応のファイル選択ボタン */}
                  {!file && (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="file-input-mobile"
                      />
                      <button
                        type="button"
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                                 text-white rounded-xl hover:shadow-lg transition-all duration-200 
                                 font-medium shadow-md hover:scale-[1.02]"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <FiUpload className="w-5 h-5" />
                          ファイルを選択
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* エラー表示 */}
                {errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 mb-1">エラー</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* インポート情報 */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">インポート時の動作</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 既存のデータは保持されます</li>
                    <li>• 重複するフレーズは確認画面が表示されます</li>
                    <li>• インポート前に自動でバックアップが作成されます</li>
                  </ul>
                </div>

                {/* ボタン */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
                             font-medium bg-white dark:bg-gray-700 hover:bg-gray-50 
                             dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || isProcessing}
                    className="flex-1 px-5 py-3 rounded-xl transition-all duration-200 font-medium 
                             shadow-lg hover:shadow-xl transform hover:scale-[1.02]
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                             bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    {isProcessing ? 'インポート中...' : 'インポート'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* コンフリクト解決ダイアログ */}
      <ConflictDialog
        isOpen={showConflictDialog}
        conflicts={conflicts}
        onResolve={handleConflictResolution}
        onCancel={() => {
          setShowConflictDialog(false);
          setConflicts([]);
        }}
      />
    </>
  );
}