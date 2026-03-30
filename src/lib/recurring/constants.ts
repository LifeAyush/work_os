export const RECURRING_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export type RecurringTaskRow = {
  id: string;
  user_id: string;
  title: string;
  frequency: RecurringFrequency;
  created_at: string;
  updated_at: string;
};

/** API shape: template fields + current period + effective completion for that period */
export type RecurringTaskWithCompletion = RecurringTaskRow & {
  active_period_key: string;
  effective_done: boolean;
};
