import { LocalNotifications } from '@capacitor/local-notifications';
import type { AppVersionManifest } from '../types/finance';

export const setupNotificationChannels = async () => {
  try {
    await LocalNotifications.createChannel({
      id: 'spendly-reminders',
      name: 'Spendly Reminders',
      description: 'Daily expense and bill reminders',
      importance: 4,
      visibility: 1,
    });

    await LocalNotifications.createChannel({
      id: 'spendly-budget-alerts',
      name: 'Spendly Budget Alerts',
      description: 'Budget threshold and limit alerts',
      importance: 4,
      visibility: 1,
    });

    await LocalNotifications.createChannel({
      id: 'spendly-summaries',
      name: 'Spendly Summaries',
      description: 'Weekly and monthly spending summaries',
      importance: 3,
      visibility: 1,
    });

    await LocalNotifications.createChannel({
      id: 'spendly-updates',
      name: 'Spendly App Updates',
      description: 'New Spendly application version alerts',
      importance: 4,
      visibility: 1,
    });
  } catch (err) {
    // Non-native web fallback
  }
};

export const requestNativeNotificationPermission = async (): Promise<boolean> => {
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      await setupNotificationChannels();
      return true;
    }
    const request = await LocalNotifications.requestPermissions();
    if (request.display === 'granted') {
      await setupNotificationChannels();
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) % 1000000;
}

export const cancelReminderNotification = async (reminderId: string) => {
  try {
    const notificationId = hashStringToInt(reminderId);
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  } catch (err) {
    // Ignore non-native platform
  }
};

export const scheduleReminderNotification = async (reminder: {
  id: string;
  title: string;
  amount: number;
  nextDueDate: string;
  dueTime?: string;
  reminderDaysBefore?: number;
  isPaused?: boolean;
}): Promise<boolean> => {
  if (reminder.isPaused) {
    await cancelReminderNotification(reminder.id);
    return false;
  }

  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return false;

    const daysBefore = reminder.reminderDaysBefore ?? 1;
    const dueDate = new Date(reminder.nextDueDate);

    if (reminder.dueTime) {
      const [h, m] = reminder.dueTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        dueDate.setHours(h, m, 0, 0);
      }
    } else {
      dueDate.setHours(9, 0, 0, 0); // Default 9 AM
    }

    const triggerTime = new Date(dueDate.getTime() - daysBefore * 86400000);

    if (triggerTime.getTime() <= Date.now()) {
      await cancelReminderNotification(reminder.id);
      return false;
    }

    const notificationId = hashStringToInt(reminder.id);
    const daysText = daysBefore === 0 ? 'today' : daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;
    const titleText = `${reminder.title} due ${daysText}`;
    const bodyText = `₹${reminder.amount.toLocaleString()} • Due ${reminder.nextDueDate}`;

    await cancelReminderNotification(reminder.id);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: titleText,
          body: bodyText,
          schedule: { at: triggerTime },
          channelId: 'spendly-reminders',
          smallIcon: 'ic_stat_spendly',
          iconColor: '#22D3EE',
          extra: { reminderId: reminder.id, amount: reminder.amount },
        },
      ],
    });

    return true;
  } catch (err) {
    console.warn('scheduleReminderNotification error:', err);
    return false;
  }
};

// Android Native App Update Notification
export const scheduleUpdateNotification = async (manifest: AppVersionManifest): Promise<boolean> => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return false;

    const notifId = 30001;
    const title = 'Spendly update available';
    const body = `${manifest.title || `Spendly V${manifest.version}`} is now available. Tap to see what's new.`;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title,
          body,
          schedule: { at: new Date(Date.now() + 1500) },
          channelId: 'spendly-updates',
          smallIcon: 'ic_stat_spendly',
          iconColor: '#22D3EE',
          extra: { type: 'APP_UPDATE', version: manifest.version },
        },
      ],
    });

    return true;
  } catch (err) {
    console.warn('scheduleUpdateNotification warning:', err);
    return false;
  }
};

// Test Notification
export const scheduleTestNotification = async (): Promise<boolean> => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return false;

    const targetTime = new Date(Date.now() + 60000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 99991,
          title: 'Spendly reminder test',
          body: 'Your Spendly bill and payment notifications are active.',
          schedule: { at: targetTime },
          channelId: 'spendly-reminders',
          smallIcon: 'ic_stat_spendly',
          iconColor: '#22D3EE',
          extra: { type: 'TEST' },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('scheduleTestNotification warning:', err);
    return false;
  }
};

// Daily Expense Reminder
export const scheduleDailyExpenseReminder = async (timeStr: string = '20:00'): Promise<boolean> => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return false;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 10001,
          title: 'Quick money check',
          body: "Have you recorded today's expenses? It only takes a moment.",
          schedule: { at: target, repeats: true, every: 'day' },
          channelId: 'spendly-reminders',
          smallIcon: 'ic_stat_spendly',
          iconColor: '#22D3EE',
          extra: { type: 'DAILY_REMINDER' },
        },
      ],
    });
    return true;
  } catch (err) {
    return false;
  }
};

// Natural Budget Alert
export const scheduleNaturalBudgetAlert = async (
  categoryName: string,
  spent: number,
  limit: number,
  percentage: number
) => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return;

    const isOver = spent > limit;
    const title = isOver ? 'Budget update' : "You're getting close";
    const body = isOver
      ? `Your ${categoryName} spending has gone over this month's budget by ₹${Math.round(spent - limit).toLocaleString()}.`
      : `Your ${categoryName} budget is almost used up. You have ₹${Math.round(limit - spent).toLocaleString()} left this month.`;

    const id = Math.floor(20000 + Math.random() * 9000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: new Date(Date.now() + 2000) },
          channelId: 'spendly-budget-alerts',
          smallIcon: 'ic_stat_spendly',
          iconColor: '#22D3EE',
          extra: { categoryName, spent, limit, percentage },
        },
      ],
    });
  } catch (err) {
    // Silent fallback
  }
};
