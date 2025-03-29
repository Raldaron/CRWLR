// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Check for existing auth session
  const authSession = request.cookies.get('authSession');
  
  // Protected routes that require authentication
  const protectedRoutes = ['/game', '/character-manager'];
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup'];
  
  // Is the requested path a protected route?
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  // Redirect to login page if trying to access a protected route without authentication
  if (isProtectedRoute && !authSession) {
    // Create url to redirect to
    const url = new URL('/', request.url);
    
    // Store the current URL so we can redirect back after login
    url.searchParams.set('from', pathname);
    
    return NextResponse.redirect(url);
  }
  
  // If trying to access login/signup page when already logged in, redirect to character manager
  if (publicRoutes.includes(pathname) && authSession) {
    return NextResponse.redirect(new URL('/character-manager', request.url));
  }
  
  // Otherwise, continue with the request
  return NextResponse.next();
}

// Configure middleware to run only on specific paths
export const config = {
  matcher: ['/', '/game/:path*', '/character-manager/:path*'],
};