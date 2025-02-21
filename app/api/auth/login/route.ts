import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Verify credentials
    if (username === 'ricci' && password === '10xem2024') {
      const cookieStore = cookies()
      
      // Generate a secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex')
      
      // Create the response
      const response = NextResponse.json({ success: true })
      
      // Set session cookie in the response
      response.cookies.set('session-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      })

      return response
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
