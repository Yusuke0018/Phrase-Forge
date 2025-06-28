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
                    フレーズをインポート
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* ファイル選択エリア */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 
                           text-center hover:border-primary-400 transition-colors"
                >
                  {file ? (
                    <div className="space-y-2">
                      <FiFile className="w-12 h-12 text-primary-600 mx-auto" />
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        ファイルをドロップするか、クリックして選択
                      </p>
                      <p className="text-sm text-gray-500">
                        CSV または JSON ファイルに対応
                      </p>
                    </>
                  )}
                  
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  {!file && (
                    <label
                      htmlFor="file-input"
                      className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white 
                               rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
                    >
                      ファイルを選択
                    </label>
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
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">インポート時の動作</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 既存のデータは保持されます</li>
                    <li>• 重複するフレーズは確認画面が表示されます</li>
                    <li>• インポート前に自動でバックアップが作成されます</li>
                  </ul>
                </div>

                {/* ボタン */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg 
                             hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || isProcessing}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg 
                             hover:bg-primary-700 transition-colors disabled:opacity-50 
                             disabled:cursor-not-allowed"
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