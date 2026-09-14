import { LocalNotifications } from '@capacitor/local-notifications';

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

// 1. Test Notification (Schedules ~1 minute in the future)
export const scheduleTestNotification = async (): Promise<boolean> => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return false;

    const targetTime = new Date(Date.now() + 60000); // 1 minute from now

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 99991,
          title: 'Spendly test reminder',
          body: 'Your Spendly notifications are working.',
          schedule: { at: targetTime },
          channelId: 'spendly-reminders',
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

// 2. Daily Expense Reminder
export const scheduleDailyExpenseReminder = async (timeStr: string = '20:00'): Promise<boolean> => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return false;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1); // Tomorrow
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 10001,
          title: 'Quick money check',
          body: "Have you recorded today's expenses? It only takes a moment.",
          schedule: { at: target, repeats: true, every: 'day' },
          channelId: 'spendly-reminders',
          extra: { type: 'DAILY_REMINDER' },
        },
      ],
    });
    return true;
  } catch (err) {
    return false;
  }
};

// 3. Natural Budget Alerts
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
          extra: { categoryName, spent, limit, percentage },
        },
      ],
    });
  } catch (err) {
    // Silent fallback
  }
};

// 4. Natural Recurring Payment Reminder
export const scheduleNaturalRecurringReminder = async (
  title: string,
  amount: number,
  daysLeft: number
) => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return;

    const body = `Your ₹${amount.toLocaleString()} ${title} bill is due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`;
    const id = Math.floor(30000 + Math.random() * 9000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'Payment coming up',
          body,
          schedule: { at: new Date(Date.now() + 2000) },
          channelId: 'spendly-reminders',
          extra: { title, amount, daysLeft },
        },
      ],
    });
  } catch (err) {
    // Silent fallback
  }
};

// 5. Weekly Spending Summary
export const scheduleWeeklySummary = async (weeklySpent: number) => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 40001,
          title: 'Your week in spending',
          body: `You spent ₹${weeklySpent.toLocaleString()} this week. Here's a quick look at where your money went.`,
          schedule: { at: new Date(Date.now() + 2000) },
          channelId: 'spendly-summaries',
          extra: { weeklySpent },
        },
      ],
    });
  } catch (err) {
    // Silent fallback
  }
};

// 6. Monthly Spending Summary
export const scheduleMonthlySummary = async (
  monthlySpent: number,
  monthlySaved: number,
  monthName: string
) => {
  try {
    const hasPermission = await requestNativeNotificationPermission();
    if (!hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 50001,
          title: 'Your monthly money check',
          body: `${monthName} is almost over. You've spent ₹${monthlySpent.toLocaleString()} and saved ₹${monthlySaved.toLocaleString()} so far.`,
          schedule: { at: new Date(Date.now() + 2000) },
          channelId: 'spendly-summaries',
          extra: { monthlySpent, monthlySaved, monthName },
        },
      ],
    });
  } catch (err) {
    // Silent fallback
  }
};
