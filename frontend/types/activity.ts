export interface GarminSplit {
  noOfSplits: number;
  index?: number; // computed split index (1-based) for per-km splits
  splitType?: string;
  // cumulative values (as stored by backend)
  cumulative_time_s?: number; // seconds
  cumulative_distance_m?: number; // meters
  // per-split values
  split_time_s?: number; // seconds for this split (delta)
  split_distance_m?: number; // meters for this split (delta)
  pace_s_per_km?: number; // seconds per km

  // original Garmin fields (kept for compatibility)
  duration?: number; // seconds (sometimes cumulative)
  distance?: number; // meters (sometimes cumulative)
  averageSpeed?: number; // m/s
  maxSpeed?: number; // m/s
  totalAscent?: number;
  elevationLoss?: number;
  maxElevationGain?: number;
  averageElevationGain?: number;
  numFalls?: number;
  numClimbSends?: number;
}

export interface Activity {
  id: number;
  garmin_id: string;
  name: string | null;
  activity_type: string;
  activity_type_key: string | null;
  start_time: string;
  start_time_local: string;
  duration_seconds: number | null;
  elapsed_duration_seconds: number | null;
  moving_duration_seconds: number | null;
  distance_meters: number | null;
  average_speed: number | null;
  max_speed: number | null;
  average_pace_seconds: number | null;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  calories: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;

  // Running metrics
  average_cadence: number | null;
  average_running_cadence: number | null;
  max_running_cadence: number | null;
  average_stride_length: number | null;
  vertical_oscillation: number | null;
  ground_contact_time: number | null;
  vo2_max: number | null;
  lap_count: number | null;
  has_splits: boolean | null;
  has_intensity_intervals: boolean | null;
  fastest_split_1000: number | null;
  fastest_split_1609: number | null;

  // Swimming metrics
  pool_length: number | null;
  average_swolf: number | null;
  average_swim_cadence: number | null;
  stroke_type: string | null;
  active_lengths: number | null;
  strokes: number | null;
  average_strokes: number | null;
  water_estimated: number | null;

  // Strength / resistance training (support both camelCase from backend JSON and snake_case)
  summarized_exercise_sets?: {
    category?: string | null;
    reps?: number | null;
    volume?: number | null;
    duration?: number | null;
    sets?: number | null;
    maxWeight?: number | null;
  }[] | null;
  total_sets?: number | null;
  active_sets?: number | null;
  total_reps?: number | null;
  max_weight?: number | null;

  // Splits & Laps
  splits: GarminSplit[] | null;
  laps: any | null;
}
