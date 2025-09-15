import { auth, authHandler } from "./config";

// Framework-agnostic auth API
// Framework-specific integration will be handled by V2 AI or manual integration
export { auth, authHandler };

// Example integrations:
// 
// For Next.js:
// import { toNextJsHandler } from "better-auth/next-js";
// export const { GET, POST } = toNextJsHandler(authHandler);
//
// For Express:
// app.use('/api/auth', authHandler);
//
// For other frameworks, see Better Auth documentation
