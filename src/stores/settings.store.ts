/**
 * @file stores/settings.store.ts
 * @description アプリケーション設定の状態管理
 * 
 * @see docs/design/settings.md
 * 
 * @related
 * - components/Settings/SettingsScreen.tsx: 設定画面コンポーネント
 * - services/notification.service.ts: 通知サービス
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  // 学習設定
  dailyGoal: number;
  enableNotifications: boolean;
  notificationTime: string; // HH:mm format
  
  // UI設定
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  enableHapticFeedback: boolean;
  enableSoundEffects: boolean;
  
  // スワイプ設定
  swipeSensitivity: number; // 1-10
  enableSwipeGestures: boolean;
  
  // アクション
  updateSettings: (settings: Partial<SettingsStore>) => void;
  resetSettings: () => void;
}

const defaultSettings: Omit<SettingsStore, 'updateSettings' | 'resetSettings'> = {
  dailyGoal: 10,
  enableNotifications: true,
  notificationTime: '09:00',
  theme: 'system',
  fontSize: 'medium',
  enableHapticFeedback: true,
  enableSoundEffects: false,
  swipeSensitivity: 5,
  enableSwipeGestures: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      updateSettings: (settings) => {
        set((state) => ({ ...state, ...settings }));
      },
      
      resetSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'phrase-forge-settings',
    }
  )
);