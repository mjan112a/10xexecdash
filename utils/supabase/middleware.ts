import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Public paths that don't require authentication
  const publicPaths = ['/sign-in', '/api/auth/login'];
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return response;
  }

  // Check for session token
  const sessionToken = request.cookies.get('session-token');
  
  // If no valid session, redirect to sign-in
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return response;
};
