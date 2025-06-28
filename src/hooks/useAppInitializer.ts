/**
 * @file hooks/useAppInitializer.ts
 * @description アプリケーション初期化用のカスタムフック
 * 
 * データベースの初期化とデータのロードを管理し、
 * 統一されたローディング状態を提供します。
 */

import { useState, useEffect } from 'react';
import { usePhraseStore } from '@/stores/phrase.store';
import { initializeDB } from '@/services/db.service';

export function useAppInitializer() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const { loadTodaysPhrases, loadCategories, loadTags } = usePhraseStore();

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      setInitError(null);
      
      try {
        // データベースの初期化
        await initializeDB();
        
        // 並列でデータをロード
        await Promise.all([
          loadTodaysPhrases(),
          loadCategories(),
          loadTags(),
        ]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError((error as Error).message);
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, [loadTodaysPhrases, loadCategories, loadTags]);

  return { isInitializing, initError };
}