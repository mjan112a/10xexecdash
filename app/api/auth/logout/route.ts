import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = cookies()
  
  // Remove the session token
  cookieStore.delete('session-token')
  
  // Create response that redirects to sign-in page
  const response = NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  
  // Ensure the cookie is removed in the response
  response.cookies.delete('session-token')
  
  return response
}
