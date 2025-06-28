/**
 * @file hooks/useSwipe.ts
 * @description スワイプジェスチャー検出のカスタムフック
 * 
 * @see docs/design/gestures.md
 * 
 * @related
 * - components/Cards/SwipeableCard.tsx: スワイプ可能なカードコンポーネント
 * - stores/settings.store.ts: スワイプ感度設定
 */

import { useSwipeable, SwipeableHandlers } from 'react-swipeable';
import { useSettingsStore } from '@/stores/settings.store';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe(options: UseSwipeOptions): SwipeableHandlers {
  const { swipeSensitivity, enableSwipeGestures } = useSettingsStore();
  
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (enableSwipeGestures && options.onSwipeLeft) {
        options.onSwipeLeft();
      }
    },
    onSwipedRight: () => {
      if (enableSwipeGestures && options.onSwipeRight) {
        options.onSwipeRight();
      }
    },
    onSwipedUp: () => {
      if (enableSwipeGestures && options.onSwipeUp) {
        options.onSwipeUp();
      }
    },
    onSwipedDown: () => {
      if (enableSwipeGestures && options.onSwipeDown) {
        options.onSwipeDown();
      }
    },
    delta: options.threshold || (10 - swipeSensitivity) * 5 + 10, // 10-60px based on sensitivity
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
    rotationAngle: 0,
  });
  
  return handlers;
}

// サイドメニュー専用のスワイプフック
export function useMenuSwipe(onOpen: () => void, onClose: () => void): SwipeableHandlers {
  return useSwipe({
    onSwipeRight: onOpen,
    onSwipeLeft: onClose,
    threshold: 50, // サイドメニューは固定の閾値
  });
}