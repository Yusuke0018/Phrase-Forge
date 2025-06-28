/**
 * @file components/Navigation/SideMenu.tsx
 * @description スワイプ対応サイドメニューコンポーネント
 * 
 * @see docs/design/navigation.md
 * 
 * @related
 * - hooks/useSwipe.ts: スワイプ検出フック
 * - components/Navigation/MenuOverlay.tsx: オーバーレイコンポーネント
 * - components/Navigation/NavigationItems.tsx: メニュー項目コンポーネント
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiSearch, 
  FiTarget, 
  FiBarChart2, 
  FiSettings,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useMenuSwipe } from '@/hooks/useSwipe';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const menuItems: MenuItem[] = [
  { id: 'home', label: '今日の鍛錬', icon: FiHome, path: '/' },
  { id: 'arsenal', label: '武器庫', icon: FiSearch, path: '/arsenal' },
  { id: 'dojo', label: '道場', icon: FiTarget, path: '/dojo' },
  { id: 'chronicle', label: '年代記', icon: FiBarChart2, path: '/chronicle' },
  { id: 'settings', label: '設定', icon: FiSettings, path: '/settings' },
];

export function SideMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const swipeHandlers = useMenuSwipe(
    () => setIsOpen(true),
    () => setIsOpen(false)
  );

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  // ESCキーでメニューを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
        aria-label="メニューを開く"
      >
        {isOpen ? (
          <FiX className="w-6 h-6 text-gray-700" />
        ) : (
          <FiMenu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* オーバーレイ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* サイドメニュー */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50"
            {...swipeHandlers}
          >
            <div className="flex flex-col h-full">
              {/* ヘッダー */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Phrase Forge</h2>
                <p className="text-sm text-gray-600 mt-1">言葉を鍛える道場</p>
              </div>

              {/* メニュー項目 */}
              <nav className="flex-1 py-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.path)}
                      className={`
                        w-full px-6 py-3 flex items-center gap-4 
                        transition-colors duration-200
                        ${isActive 
                          ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* フッター */}
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  v1.0.0 • Made with ❤️
                </p>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* スワイプエリア（画面左端） */}
      <div 
        className="fixed left-0 top-0 w-5 h-full z-30" 
        {...swipeHandlers}
      />
    </>
  );
}