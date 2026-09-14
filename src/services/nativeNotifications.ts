import { LocalNotifications } from '@capacitor/local-notifications';

export const requestNativeNotificationPermission = async (): Promise<boolean> => {
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }
    const request = await LocalNotifications.requestPermissions();
    return request.display === 'granted';
  } catch (err) {
    // Non-native web fallback
    return false;
  }
};

export const scheduleBudgetWarningNotification = async (categoryName: string, percentage: number) => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title: `Spendly Alert: ${categoryName} Budget`,
          body: `You have used ${percentage}% of your monthly limit for ${categoryName}.`,
          schedule: { at: new Date(Date.now() + 1000) },
          sound: undefined,
          actionTypeId: '',
          extra: { categoryName },
        },
      ],
    });
  } catch (err) {
    // Silent fallback on web
  }
};

export const scheduleRecurringPaymentNotification = async (title: string, amount: number, dueDate: string) => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title: `Spendly Reminder: ${title}`,
          body: `Upcoming recurring bill of ₹${amount.toLocaleString()} is due on ${dueDate}.`,
          schedule: { at: new Date(Date.now() + 1000) },
          extra: { title, amount, dueDate },
        },
      ],
    });
  } catch (err) {
    // Silent fallback on web
  }
};
