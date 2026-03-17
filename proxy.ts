import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);
const isAuthRoute = createRouteMatcher(["/auth(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/auth(.*)", "/sso-callback(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Always allow public routes through without interference
  if (isPublicRoute(req)) {
    const { userId } = await auth();
    // Only redirect away from /auth if already signed in
    if (isAuthRoute(req) && userId) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return;
  }

  const { userId } = await auth();
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
