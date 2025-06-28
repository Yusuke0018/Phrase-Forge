/**
 * @file app/settings/page.tsx
 * @description 設定画面
 * 
 * @see docs/design/settings-screen.md
 * 
 * @related
 * - stores/settings.store.ts: 設定状態管理
 */

'use client';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pt-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">設定</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">設定画面は現在開発中です。</p>
      </div>
    </div>
  );
}