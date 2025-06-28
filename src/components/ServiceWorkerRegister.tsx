'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      // next-pwaによって生成されたService Workerの登録
      const wb = window.workbox;
      
      // Service Workerの更新があった場合の処理
      const promptNewVersionAvailable = () => {
        if (confirm('新しいバージョンが利用可能です。更新しますか？')) {
          wb.addEventListener('controlling', () => {
            window.location.reload();
          });
          
          wb.messageSkipWaiting();
        }
      };
      
      wb.addEventListener('waiting', promptNewVersionAvailable);
      
      // Service Workerの登録
      wb.register();
    }
  }, []);

  return null;
}