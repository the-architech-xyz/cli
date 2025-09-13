import { Blueprint } from '../../../../types/adapter.js';

const errorTrackingBlueprint: Blueprint = {
  id: "sentry-error-tracking",
  name: "Sentry Error Tracking",
  actions: [
    {
      type: "CREATE_FILE",
      path: "src/lib/monitoring/error-tracker.ts",
      content: "// Error tracking and performance monitoring utilities"
    }
  ]
};
export default errorTrackingBlueprint;
