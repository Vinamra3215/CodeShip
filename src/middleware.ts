export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leaderboard/:path*",
    "/analytics/:path*",
    "/compare/:path*",
    "/ai-coach/:path*",
    "/settings/:path*",
  ],
};
