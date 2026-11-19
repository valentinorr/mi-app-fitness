import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { TokenResponse, LoginCredentials, RegisterData, WorkoutSessionCreate, WorkoutSessionResponse, WeeklyVolumeResponse, OneRMRequest, OneRMResponse, OneRMHistoryCreate, OneRMHistoryResponse } from '../types'

const API_BASE_URL = ''

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  async register(data: RegisterData) {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const response = await this.client.post<TokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    this.setToken(response.data.access_token)
    return response.data
  }

  logout() {
    this.setToken(null)
  }

  async createWorkout(data: WorkoutSessionCreate): Promise<WorkoutSessionResponse> {
    const response = await this.client.post<WorkoutSessionResponse>('/workouts', data)
    return response.data
  }

  async getWorkouts(): Promise<WorkoutSessionResponse[]> {
    const response = await this.client.get<WorkoutSessionResponse[]>('/workouts')
    return response.data
  }

  async getWeeklyVolume(weeks: number = 12): Promise<WeeklyVolumeResponse[]> {
    const response = await this.client.get<WeeklyVolumeResponse[]>('/analytics/weekly-volume', {
      params: { weeks },
    })
    return response.data
  }

  async calculate1RM(data: OneRMRequest): Promise<OneRMResponse> {
    const response = await this.client.post<OneRMResponse>('/analytics/calculate-1rm', data)
    return response.data
  }

  async save1RM(data: OneRMHistoryCreate): Promise<OneRMHistoryResponse> {
    const response = await this.client.post<OneRMHistoryResponse>('/analytics/save-1rm', data)
    return response.data
  }

  async get1RMHistory(exerciseName?: string, limit: number = 100): Promise<OneRMHistoryResponse[]> {
    const params: Record<string, string | number> = { limit }
    if (exerciseName) params.exercise_name = exerciseName
    const response = await this.client.get<OneRMHistoryResponse[]>('/analytics/1rm-history', { params })
    return response.data
  }
}

export const api = new ApiClient()