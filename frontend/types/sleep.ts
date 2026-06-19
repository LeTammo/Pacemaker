export interface SleepListItem {
  id: number;
  calendar_date: string;
  sleep_time_seconds: number | null;
  sleep_score: number | null;
  sleep_score_feedback: string | null;
  average_hrv: number | null;
  average_resting_heart_rate: number | null;
  sleep_heart_rate: { value: number; startGMT: number }[] | null;
  sleep_stress: { value: number; startGMT: number }[] | null;
}

export interface SleepListResponse {
  sleep_records: SleepListItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface SleepDetail {
  id: number;
  calendar_date: string;
  sleep_time_seconds: number | null;
  nap_time_seconds: number | null;
  awake_time_seconds: number | null;
  deep_sleep_seconds: number | null;
  light_sleep_seconds: number | null;
  rem_sleep_seconds: number | null;
  unmeasurable_sleep_seconds: number | null;
  sleep_start: string | null;
  sleep_end: string | null;
  sleep_score: number | null;
  sleep_score_feedback: string | null;
  sleep_score_insight: string | null;
  average_hrv: number | null;
  average_resting_heart_rate: number | null;
  average_sp_o2: number | null;
  raw_data: any;
}
