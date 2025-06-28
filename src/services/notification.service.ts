/**
 * 通知サービス
 * Web Notifications APIを使用した通知機能の管理
 */

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

class NotificationService {
  private permissionGranted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  /**
   * 通知の許可をリクエスト
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知機能をサポートしていません');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  /**
   * 通知を表示
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Service Workerを使用して通知を表示
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        ...options,
        icon: options?.icon || '/icon-192x192.png',
        badge: options?.badge || '/icon-192x192.png',
      });
    } else {
      // 通常の通知API
      new Notification(title, {
        ...options,
        icon: options?.icon || '/icon-192x192.png',
      });
    }
  }

  /**
   * 復習リマインダーをスケジュール
   */
  async scheduleReviewReminder(time: Date): Promise<void> {
    const now = new Date();
    const delay = time.getTime() - now.getTime();

    if (delay <= 0) return;

    // タイマーをセットして通知を表示
    setTimeout(() => {
      this.showNotification('フレーズの復習時間です！', {
        body: '今日のフレーズを復習しましょう',
        tag: 'review-reminder',
        requireInteraction: true,
        actions: [
          { action: 'review', title: '復習する' },
          { action: 'later', title: '後で' }
        ]
      });
    }, delay);
  }

  /**
   * 日時指定でリマインダーを設定
   */
  private reminderTimerId: NodeJS.Timeout | null = null;

  setDailyReminder(hour: number, minute: number): void {
    // 既存のタイマーをクリア
    if (this.reminderTimerId) {
      clearTimeout(this.reminderTimerId);
      this.reminderTimerId = null;
    }

    const scheduleNextReminder = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      // 今日の指定時刻が過ぎている場合は明日に設定
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - now.getTime();

      // 次の通知をスケジュール
      this.reminderTimerId = setTimeout(async () => {
        await this.showNotification('フレーズの復習時間です！', {
          body: '今日のフレーズを復習しましょう',
          tag: 'daily-reminder',
          requireInteraction: true,
          actions: [
            { action: 'review', title: '復習する' },
            { action: 'later', title: '後で' }
          ]
        });

        // 次の日の同じ時刻に再スケジュール
        scheduleNextReminder();
      }, delay);
    };

    scheduleNextReminder();
  }

  /**
   * リマインダーをキャンセル
   */
  cancelDailyReminder(): void {
    if (this.reminderTimerId) {
      clearTimeout(this.reminderTimerId);
      this.reminderTimerId = null;
    }
  }

  /**
   * 学習達成通知
   */
  async showAchievementNotification(achievement: string): Promise<void> {
    await this.showNotification('おめでとうございます！', {
      body: achievement,
      tag: 'achievement',
      icon: '/icon-192x192.png',
    });
  }

  /**
   * 通知の許可状態を取得
   */
  get isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  /**
   * 通知がサポートされているか確認
   */
  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
}

export const notificationService = new NotificationService();