import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry-options";

// No session replay: pages will show buyers' comments, which we don't want recorded.
Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
