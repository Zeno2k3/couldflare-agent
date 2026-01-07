import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from './index'
import bcrypt from 'bcryptjs'

// Mock bcryptjs module
vi.mock('bcryptjs', () => ({
 default: {
  hash: vi.fn(),
  compare: vi.fn()
 }
}))

describe('Backend Worker Tests', () => {
 let mockEnv: any

 beforeEach(() => {
  vi.resetAllMocks()

  // Setup Mock Environment with D1 Database
  mockEnv = {
   db: {
    prepare: vi.fn(() => ({
     bind: vi.fn(() => ({
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn()
     }))
    })),
    batch: vi.fn()
   },
   AI: {
    run: vi.fn()
   }
  }
 })

 describe('User Authentication Routes', () => {
  it('POST /user/login - Should login successfully with correct credentials', async () => {
   const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    full_name: 'Test User',
    role: 'user'
   }

   // Mock DB findings
   const firstFn = vi.fn().mockResolvedValue(mockUser)
   const bindFn = vi.fn(() => ({ first: firstFn }))
   mockEnv.db.prepare = vi.fn(() => ({ bind: bindFn }))

   // Mock bcrypt compare
   vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

   const res = await app.request('/user/login', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
   }, mockEnv)

   expect(res.status).toBe(200)
   const body = (await res.json()) as any
   expect(body.data).toBeDefined()
   expect(body.data.email).toBe('test@example.com')
   expect(body.data).not.toHaveProperty('password')
  })

  it('POST /user/login - Should fail with incorrect password', async () => {
   const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword'
   }

   // Mock DB findings
   const firstFn = vi.fn().mockResolvedValue(mockUser)
   const bindFn = vi.fn(() => ({ first: firstFn }))
   mockEnv.db.prepare = vi.fn(() => ({ bind: bindFn }))

   // Mock bcrypt compare to false
   vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

   const res = await app.request('/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
   }, mockEnv)

   expect(res.status).toBe(401)
  })

  it('POST /user/login - Should fail if user does not exist', async () => {
   // Mock DB returning null
   const firstFn = vi.fn().mockResolvedValue(null)
   const bindFn = vi.fn(() => ({ first: firstFn }))
   mockEnv.db.prepare = vi.fn(() => ({ bind: bindFn }))

   const res = await app.request('/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' })
   }, mockEnv)

   expect(res.status).toBe(401)
  })
 })

 describe('User Registration Routes', () => {
  it('POST /user - Should register a new user successfully', async () => {
   // Setup Mock for multiple DB calls:
   // 1. Check existing email -> returns null (not found)
   // 2. Insert user -> returns success

   const firstFn = vi.fn().mockResolvedValue(null) // User not found
   const runFn = vi.fn().mockResolvedValue({ success: true }) // Insert success

   // We need a smart mock that handles the two different "prepare" statements
   mockEnv.db.prepare = vi.fn((query: string) => {
    if (query.includes('SELECT id FROM users')) {
     return { bind: () => ({ first: firstFn }) }
    }
    if (query.includes('INSERT INTO users')) {
     return { bind: () => ({ run: runFn }) }
    }
    return { bind: () => ({ first: vi.fn(), run: vi.fn() }) }
   })

   vi.mocked(bcrypt.hash).mockResolvedValue('hashed_secret' as never)

   const res = await app.request('/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     email: 'newuser@example.com',
     password: 'password123',
     full_name: 'New User'
    })
   }, mockEnv)

   expect(res.status).toBe(201)
   const body = (await res.json()) as any
   expect(body.message).toBe('User created successfully')
  })

  it('POST /user - Should fail validation if fields missing', async () => {
   const res = await app.request('/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'missing@example.com' }) // Missing password/name
   }, mockEnv)

   expect(res.status).toBe(400)
  })
 })
})