export interface WorkoutSetCreate {
  exercise_name: string
  weight: number
  reps: number
  rpe?: number
  rir?: number
  set_order: number
}

export interface WorkoutSetResponse extends WorkoutSetCreate {
  id: number
  created_at: string
}

export interface WorkoutSessionCreate {
  date?: string
  notes?: string
  sets: WorkoutSetCreate[]
}

export interface WorkoutSessionResponse {
  id: number
  date: string
  notes?: string
  created_at: string
  sets: WorkoutSetResponse[]
}

export interface WeeklyVolumeResponse {
  week_start: string
  total_volume: number
  sessions_count: number
}

export interface UserResponse {
  id: number
  email: string
  full_name?: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
}

export interface OneRMRequest {
  weight: number
  reps: number
  rpe?: number
}

export interface OneRMResponse {
  estimated_1rm: number
  epley_1rm: number
  rpe_adjusted_1rm?: number
  rpe_percentage?: number
  formula_used: string
}

export interface OneRMHistoryCreate {
  exercise_name: string
  weight: number
  reps: number
  rpe?: number
  estimated_1rm: number
}

export interface OneRMHistoryResponse {
  id: number
  exercise_name: string
  weight: number
  reps: number
  rpe?: number
  estimated_1rm: number
  created_at: string
}