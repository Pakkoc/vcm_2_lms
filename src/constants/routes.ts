export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  learnerDashboard: '/dashboard',
  instructorDashboard: '/instructor/dashboard',
  coursesCatalog: '/courses',
  learnerCourses: '/courses/my',
  instructorCourses: '/instructor/courses',
  instructorAssignments: '/instructor/assignments',
  learnerGrades: '/grades',
} as const;

export type AppRouteKey = keyof typeof ROUTES;
export type AppRoute = (typeof ROUTES)[AppRouteKey];

export const resolveRoute = (key: AppRouteKey): AppRoute => ROUTES[key];
