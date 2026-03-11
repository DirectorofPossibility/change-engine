/**
 * Standardized API response helpers for The Change Engine.
 *
 * All API routes should use these helpers to ensure consistent response
 * shapes across the platform. This makes it easy for any frontend to
 * consume the API predictably.
 *
 * Success shape:  { data: T, meta?: { total, page, limit } }
 * Error shape:    { error: string, code?: string }
 */

import { NextResponse } from 'next/server'

interface ApiMeta {
  total?: number
  page?: number
  limit?: number
  [key: string]: unknown
}

/**
 * Return a successful JSON response with standardized envelope.
 */
export function apiSuccess<T>(data: T, meta?: ApiMeta, status = 200) {
  const body: { data: T; meta?: ApiMeta } = { data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status })
}

/**
 * Return an error JSON response with standardized envelope.
 */
export function apiError(message: string, status = 400, code?: string) {
  const body: { error: string; code?: string } = { error: message }
  if (code) body.code = code
  return NextResponse.json(body, { status })
}

/**
 * Return a paginated success response.
 */
export function apiPaginated<T>(data: T[], total: number, page: number, limit: number) {
  return apiSuccess(data, { total, page, limit })
}
