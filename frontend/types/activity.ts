export interface Activity {
  id: number;
  garmin_id: string;
  name: string | null;
  activity_type: string;
  start_time: string;
  distance_meters: number | null;
  duration_seconds: number | null;
  average_pace_seconds: number | null;
  average_heart_rate: number | null;
  calories: number | null;
  pace_per_km?: string;
  distance_km?: number;
  duration_formatted?: string;
}
