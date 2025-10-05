import { match } from "ts-pattern";
import { ROUTES } from "./routes";

const PUBLIC_PATHS = [ROUTES.home, ROUTES.login, ROUTES.signup] as const;
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon", "/static", "/docs", "/images"] as const;

export const LOGIN_PATH = ROUTES.login;
export const SIGNUP_PATH = ROUTES.signup;
export const AUTH_ENTRY_PATHS = [LOGIN_PATH, SIGNUP_PATH] as const;

export const isAuthEntryPath = (
  pathname: string
): pathname is (typeof AUTH_ENTRY_PATHS)[number] =>
  AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number]);

export const isAuthPublicPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  return match(normalized)
    .when(
      (path) => PUBLIC_PATHS.some((publicPath) => publicPath === path),
      () => true
    )
    .when(
      (path) => PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)),
      () => true
    )
    .otherwise(() => false);
};

export const shouldProtectPath = (pathname: string) => !isAuthPublicPath(pathname);
