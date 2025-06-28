/**
 * @file app/settings/page.tsx
 * @description 設定画面
 * 
 * @see docs/design/settings-screen.md
 * 
 * @related
 * - stores/settings.store.ts: 設定状態管理
 * - components/Export/ExportDialog.tsx: エクスポート機能
 * - components/Import/ImportDialog.tsx: インポート機能
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTarget, FiBell, FiMoon, FiSun, FiMonitor,
  FiType, FiSliders, FiDownload, FiUpload, 
  FiInfo, FiRefreshCw
} from 'react-icons/fi';
import { useSettingsStore } from '@/stores/settings.store';
import { ExportDialog } from '@/components/Export/ExportDialog';
import { ImportDialog } from '@/components/Import/ImportDialog';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    settings.updateSettings({ theme });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    settings.updateSettings({ fontSize });
  };

  const handleReset = () => {
    settings.resetSettings();
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">設定</h1>
      
      {/* 学習設定 */}
      <section className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-primary-600" />
            学習設定
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {/* 日々の目標 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日々の学習目標
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={settings.dailyGoal}
                onChange={(e) => settings.updateSettings({ dailyGoal: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-lg font-medium text-primary-600 w-16 text-right">
                {settings.dailyGoal}枚
              </span>
            </div>
          </div>

          {/* 通知設定 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiBell className="w-4 h-4" />
                リマインダー通知
              </label>
              <button
                onClick={() => settings.updateSettings({ enableNotifications: !settings.enableNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enableNotifications ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            
            {settings.enableNotifications && (
              <input
                type="time"
                value={settings.notificationTime}
                onChange={(e) => settings.updateSettings({ notificationTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            )}
          </div>
        </div>
      </section>

      {/* UI設定 */}
      <section className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">UI設定</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {/* テーマ設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              テーマ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2
                  ${settings.theme === 'light' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FiSun className="w-6 h-6" />
                <span className="text-sm">ライト</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2
                  ${settings.theme === 'dark' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FiMoon className="w-6 h-6" />
                <span className="text-sm">ダーク</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2
                  ${settings.theme === 'system' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FiMonitor className="w-6 h-6" />
                <span className="text-sm">システム</span>
              </button>
            </div>
          </div>

          {/* フォントサイズ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              フォントサイズ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleFontSizeChange('small')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center
                  ${settings.fontSize === 'small' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FiType className="w-4 h-4" />
                <span className="ml-2 text-sm">小</span>
              </button>
              
              <button
                onClick={() => handleFontSizeChange('medium')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center
                  ${settings.fontSize === 'medium' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FiType className="w-5 h-5" />
                <span className="ml-2">中</span>
              </button>
              
              <button
                onClick={() => handleFontSizeChange('large')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center
                  ${settings.fontSize === 'large' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <FiType className="w-6 h-6" />
                <span className="ml-2 text-lg">大</span>
              </button>
            </div>
          </div>

          {/* その他のUI設定 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                触覚フィードバック
              </label>
              <button
                onClick={() => settings.updateSettings({ enableHapticFeedback: !settings.enableHapticFeedback })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enableHapticFeedback ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.enableHapticFeedback ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                効果音
              </label>
              <button
                onClick={() => settings.updateSettings({ enableSoundEffects: !settings.enableSoundEffects })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.enableSoundEffects ? 'bg-primary-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.enableSoundEffects ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* スワイプ設定 */}
      <section className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiSliders className="w-5 h-5 text-primary-600" />
            スワイプ設定
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              スワイプジェスチャー
            </label>
            <button
              onClick={() => settings.updateSettings({ enableSwipeGestures: !settings.enableSwipeGestures })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${settings.enableSwipeGestures ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.enableSwipeGestures ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {settings.enableSwipeGestures && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                スワイプ感度
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">低</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.swipeSensitivity}
                  onChange={(e) => settings.updateSettings({ swipeSensitivity: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">高</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* データ管理 */}
      <section className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">データ管理</h2>
        </div>
        
        <div className="p-6 space-y-3">
          <button
            onClick={() => setShowExportDialog(true)}
            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 
                     transition-colors flex items-center justify-center gap-2"
          >
            <FiDownload className="w-5 h-5" />
            データをエクスポート
          </button>
          
          <button
            onClick={() => setShowImportDialog(true)}
            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 
                     transition-colors flex items-center justify-center gap-2"
          >
            <FiUpload className="w-5 h-5" />
            データをインポート
          </button>
          
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full p-3 border border-red-300 text-red-600 rounded-lg 
                     hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-5 h-5" />
            設定をリセット
          </button>
        </div>
      </section>

      {/* アプリ情報 */}
      <section className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiInfo className="w-5 h-5 text-primary-600" />
            アプリ情報
          </h2>
        </div>
        
        <div className="p-6 space-y-2 text-sm text-gray-600">
          <p>バージョン: 1.0.0</p>
          <p>© 2024 Phrase Forge</p>
        </div>
      </section>

      {/* エクスポートダイアログ */}
      <ExportDialog 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />

      {/* インポートダイアログ */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />

      {/* リセット確認ダイアログ */}
      {showResetConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowResetConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              設定をリセットしますか？
            </h3>
            <p className="text-gray-600 mb-6">
              すべての設定がデフォルト値に戻ります。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                リセット
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}