// middleware.js - Place in root of Next.js project
// Automatically shows/hides pages based on publish_date

import { NextResponse } from 'next/server';

// Content schedule with publish dates
const CONTENT_SCHEDULE = {
  // Week 1
  '/pricing': '2026-03-01',
  '/blog/convert-website-to-android-app': '2026-03-02',
  '/blog/wordpress-to-android-app': '2026-03-03',
  '/blog/shopify-to-mobile-app': '2026-03-04',

  // Week 2 (add as you generate)
  '/blog/turn-website-into-mobile-app': '2026-03-06',
  '/blog/website-to-app-without-coding': '2026-03-07',
  '/blog/best-website-to-app-converters-2026': '2026-03-08',
  '/blog/free-website-to-app-converter': '2026-03-09',
  '/blog/app-development-cost': '2026-03-10',

  // Week 3
  '/blog/wix-to-mobile-app': '2026-03-13',
  '/blog/squarespace-to-app': '2026-03-14',
  '/convert/webflow-to-mobile-app': '2026-03-15',

  // Add more as you generate content...
};

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Check if this path has a publish date
  const publishDate = CONTENT_SCHEDULE[pathname];

  if (publishDate) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // If current date is before publish date, show 404 or coming soon
    if (today < publishDate) {
      // Option 1: Return 404
      // return new NextResponse(null, { status: 404 });

      // Option 2: Redirect to coming soon page
      return NextResponse.redirect(new URL('/coming-soon', request.url));

      // Option 3: Show custom message
      // return new NextResponse(
      //   `<html><body><h1>Coming Soon</h1><p>This content will be available on ${publishDate}</p></body></html>`,
      //   { status: 200, headers: { 'content-type': 'text/html' } }
      // );
    }
  }

  // Allow request to proceed if published
  return NextResponse.next();
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    '/blog/:path*',
    '/convert/:path*',
    '/solutions/:path*',
    '/alternatives/:path*',
    '/compare/:path*',
    '/features/:path*',
    '/pricing',
  ],
};
