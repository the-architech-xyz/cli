# Module Issue Mapping Report

**Date:** November 19, 2024  
**Purpose:** Map generated app issues to their source modules for targeted fixes

---

## Executive Summary

This report analyzes the modules used in generation and maps each issue found in the generated app to its originating module. This enables targeted fixes at the blueprint/template level rather than post-generation patching.

---

## 1. Modules Used in Generation

From `minimal-test/.architech/manifest.json`, the following modules were executed:

### 1.1 Auth Modules
- `adapters/auth/better-auth` - Better Auth adapter
- `connectors/auth/better-auth-nextjs` - Next.js connector
- `features/auth/frontend` - Frontend auth features
- `features/auth/tech-stack` - Auth tech stack layer

### 1.2 UI Modules
- `adapters/ui/tamagui` - Tamagui UI adapter
- `connectors/ui/tamagui-nextjs` - Next.js connector
- `connectors/ui/tamagui-expo` - Expo connector (executed but no mobile app)

### 1.3 Database Module
- `adapters/database/drizzle` - Drizzle ORM adapter

### 1.4 Monorepo Module
- `adapters/monorepo/turborepo` - Turborepo setup

### 1.5 Other Modules (Not Analyzed)
- `features/ai-chat/*` - AI chat features
- `adapters/email/resend` - Email adapter
- `features/emailing/*` - Emailing features

---

## 2. Issue-to-Module Mapping

### 2.1 ❌ CRITICAL: Web App Missing Dependencies

**Issue:** `apps/web/package.json` is empty (no dependencies)

**Root Cause Analysis:**
- **Module:** `connectors/ui/tamagui-nextjs` and/or `connectors/auth/better-auth-nextjs`
- **Expected Behavior:** These connectors should install Next.js, React, and workspace dependencies
- **Current Behavior:** No `INSTALL_PACKAGES` actions for framework dependencies

**Affected Modules:**
1. `connectors/ui/tamagui-nextjs` - Should install Next.js, React, React DOM
2. `connectors/auth/better-auth-nextjs` - Should install auth workspace dependencies
3. **CLI System:** `PackageJsonGenerator` or app initialization may not be handling app dependencies

**Fix Location:**
- **Option A:** Add `INSTALL_PACKAGES` actions to connector blueprints
- **Option B:** CLI should auto-generate app dependencies based on framework
- **Recommendation:** **Option B** - CLI should handle framework dependencies automatically

**Files to Check:**
- `Marketplace/connectors/ui/tamagui-nextjs/blueprint.ts`
- `Marketplace/connectors/auth/better-auth-nextjs/blueprint.ts`
- `Architech/src/core/services/package/package-json-generator.ts` (if exists)
- `Architech/src/core/services/structure/structure-initialization-layer.ts`

---

### 2.2 ❌ CRITICAL: Auth Package Export Paths Incorrect

**Issue:** `packages/auth/package.json` exports reference `client.ts` and `server.ts`, but actual files are `better-auth-client.ts` and `better-auth.ts`

**Root Cause Analysis:**
- **Module:** `adapters/auth/better-auth`
- **File:** `Marketplace/adapters/auth/better-auth/adapter.json` or blueprint
- **Current Behavior:** Exports defined as `./client` and `./server`
- **Actual Files:** `better-auth-client.ts` and `better-auth.ts`

**Additional Issue:**
- `packages/auth/src/index.ts` tries to export from `./client` which doesn't exist
- Should export from `./better-auth-client` instead

**Affected Modules:**
1. `adapters/auth/better-auth` - Defines package.json exports
2. `features/auth/tech-stack` - May define index.ts exports

**Fix Location:**
- `Marketplace/adapters/auth/better-auth/adapter.json` - Fix export paths
- `Marketplace/features/auth/tech-stack/blueprint.ts` - Fix index.ts exports
- OR: Rename files to match exports (`better-auth-client.ts` → `client.ts`)

**Files to Check:**
- `Marketplace/adapters/auth/better-auth/adapter.json`
- `Marketplace/adapters/auth/better-auth/blueprint.ts`
- `Marketplace/features/auth/tech-stack/blueprint.ts`

---

### 2.3 ⚠️ MEDIUM: Nested UI Package Paths

**Issue:** Files in `packages/ui/src/ui/tamagui/` instead of `packages/ui/src/tamagui/`

**Root Cause Analysis:**
- **Module:** `connectors/ui/tamagui-nextjs`
- **Path Key Used:** Likely `packages.ui.src` + `ui/tamagui/` (double nesting)
- **Expected:** `packages.ui.src}tamagui/`
- **Actual:** `packages.ui.src}ui/tamagui/`

**Affected Modules:**
1. `connectors/ui/tamagui-nextjs` - Generates Next.js-specific config files
2. `adapters/ui/tamagui` - May also have nested paths

**Fix Location:**
- `Marketplace/connectors/ui/tamagui-nextjs/blueprint.ts` - Remove extra `ui/` segment
- `Marketplace/adapters/ui/tamagui/blueprint.ts` - Verify paths (already fixed?)

**Files to Check:**
- `Marketplace/connectors/ui/tamagui-nextjs/blueprint.ts`
- Check for paths like: `${paths.packages.ui.src}ui/tamagui/nextjs-config.ts`

---

### 2.4 ⚠️ MEDIUM: Auth Utils in Shared Package

**Issue:** `packages/shared/src/utils/auth-utils.ts` should be in `packages/auth`

**Root Cause Analysis:**
- **Module:** `features/auth/frontend`
- **Path Used:** `packages.shared.src}utils/auth-utils.ts`
- **Expected:** `packages.auth.src}utils/auth-utils.ts`

**Affected Modules:**
1. `features/auth/frontend` - Generates auth utilities

**Fix Location:**
- `Marketplace/features/auth/frontend/blueprint.ts` - Change path key from `packages.shared.src` to `packages.auth.src`

**Files to Check:**
- `Marketplace/features/auth/frontend/blueprint.ts`
- Search for: `packages.shared.src}utils/auth-utils.ts`

---

### 2.5 ⚠️ MEDIUM: Missing Root Configuration Files

**Issue:** Missing ESLint, Prettier, root tsconfig.json, .gitignore

**Root Cause Analysis:**
- **Module:** None currently generates these
- **Expected Behavior:** Should be generated by a "best practices" or "monorepo setup" module
- **Current Behavior:** No module handles root-level tooling configs

**Affected Modules:**
- **None** - This is a gap in the module ecosystem

**Fix Location:**
- **Option A:** Create new module `adapters/dev-tools/defaults` or `features/dev-tools/setup`
- **Option B:** CLI should generate these by default
- **Recommendation:** **Option B** - CLI should handle defaults (see Best Practices section)

**Files to Create/Modify:**
- New module: `Marketplace/adapters/dev-tools/defaults/blueprint.ts`
- OR: `Architech/src/core/services/structure/structure-initialization-layer.ts`

---

## 3. Module Blueprint Analysis

### 3.1 Auth Module Chain

```
adapters/auth/better-auth
  ├── Generates: better-auth.ts, better-auth-client.ts, types.ts
  ├── Defines: package.json exports (WRONG PATHS)
  └── Issue: Export paths don't match file names

connectors/auth/better-auth-nextjs
  ├── Generates: config.ts (Next.js specific)
  ├── Generates: API routes, middleware
  └── Issue: Doesn't install Next.js dependencies

features/auth/frontend
  ├── Generates: Auth pages, components
  ├── Generates: auth-utils.ts (WRONG LOCATION)
  └── Issue: Uses packages.shared.src instead of packages.auth.src

features/auth/tech-stack
  ├── Generates: hooks.ts, stores.ts, schemas.ts
  ├── Generates: index.ts (WRONG EXPORTS)
  └── Issue: Exports from ./client instead of ./better-auth-client
```

### 3.2 UI Module Chain

```
adapters/ui/tamagui
  ├── Generates: tamagui config, theme, provider
  ├── Path: packages.ui.src}tamagui/ ✅ (Fixed)
  └── Status: OK

connectors/ui/tamagui-nextjs
  ├── Generates: Next.js config, styles
  ├── Path: packages.ui.src}ui/tamagui/ ❌ (Nested)
  └── Issue: Extra ui/ segment in path
```

### 3.3 Database Module

```
adapters/database/drizzle
  ├── Generates: schema.ts, db/index.ts
  ├── Generates: drizzle.config.ts ✅ (Fixed)
  └── Status: OK (after path fix)
```

### 3.4 Monorepo Module

```
adapters/monorepo/turborepo
  ├── Generates: turbo.json ✅
  ├── Generates: root package.json ✅
  └── Status: OK
```

---

## 4. Best Practices: CLI vs Marketplace Defaults

### 4.1 Current State

**Question:** Should default tech (modules) be in CLI or marketplace?

**Current Behavior:**
- Marketplace modules define their own dependencies
- CLI handles workspace setup and structure
- No default "best practices" module

### 4.2 Analysis

#### Option A: CLI Handles Defaults
**Pros:**
- ✅ Consistent across all projects
- ✅ Works for any monorepo (web/native/desktop)
- ✅ No marketplace dependency for basics
- ✅ Faster generation (no module execution needed)

**Cons:**
- ❌ Less flexible (harder to customize)
- ❌ CLI becomes opinionated about tooling
- ❌ Updates require CLI releases

**Use Cases:**
- ESLint, Prettier configs
- Root tsconfig.json
- .gitignore
- Basic package.json scripts

#### Option B: Marketplace Modules
**Pros:**
- ✅ Flexible and customizable
- ✅ Easy to update without CLI releases
- ✅ Can have multiple "opinions" (e.g., ESLint + Biome)

**Cons:**
- ❌ Requires marketplace for basics
- ❌ May not work for all monorepo types
- ❌ More complex execution

**Use Cases:**
- Framework-specific configs
- Opinionated tooling choices
- Feature-specific setups

### 4.3 Recommendation: **Hybrid Approach**

**CLI Defaults (Always Generated):**
1. `.gitignore` - Universal, no opinions
2. Root `tsconfig.json` - Base TypeScript config
3. Basic `package.json` scripts - Universal (dev, build, lint)
4. Workspace configuration - Monorepo-agnostic

**Marketplace Modules (Optional):**
1. ESLint config - Opinionated (ESLint vs Biome vs Rome)
2. Prettier config - Optional (some teams don't use it)
3. Framework-specific configs - Next.js, Expo, etc.
4. Advanced tooling - Husky, lint-staged, etc.

**Implementation:**
```typescript
// CLI generates defaults
StructureInitializationLayer.generateDefaults() {
  // .gitignore
  // root tsconfig.json
  // basic package.json scripts
}

// Marketplace modules enhance
adapters/dev-tools/eslint/blueprint.ts {
  // .eslintrc.js
  // eslint.config.js
}
```

### 4.4 Monorepo Compatibility

**Question:** Does the system need updates to work properly with monorepos?

**Current State:**
- ✅ Workspace configuration (package.json workspaces)
- ✅ Turborepo setup (turbo.json)
- ✅ Package structure (packages/*, apps/*)
- ✅ Workspace dependencies (file:../db)

**Gaps:**
- ⚠️ App dependencies not auto-generated
- ⚠️ Root config files missing
- ⚠️ Package.json generation inconsistent

**Needed Updates:**
1. **App Dependency Generation:**
   - CLI should auto-detect framework (Next.js, Expo, etc.)
   - Auto-generate app package.json with framework deps
   - Auto-add workspace dependencies based on app dependencies in genome

2. **Root Config Generation:**
   - CLI should generate .gitignore, root tsconfig.json
   - Marketplace modules can enhance/override

3. **Package.json Consistency:**
   - Standardize package.json generation
   - Ensure all packages have proper workspace:* dependencies
   - Handle npm vs pnpm vs yarn workspace protocols

---

## 5. Fix Priority Matrix

| Issue | Module | Priority | Effort | Fix Location |
|-------|--------|----------|--------|--------------|
| Web app deps missing | `connectors/ui/tamagui-nextjs`<br>`connectors/auth/better-auth-nextjs`<br>CLI system | 🔴 CRITICAL | 2h | Blueprints + CLI |
| Auth exports wrong | `adapters/auth/better-auth`<br>`features/auth/tech-stack` | 🔴 CRITICAL | 30m | adapter.json + blueprint |
| UI nested paths | `connectors/ui/tamagui-nextjs` | 🟡 MEDIUM | 15m | blueprint.ts |
| Auth utils location | `features/auth/frontend` | 🟡 MEDIUM | 15m | blueprint.ts |
| Root configs missing | None (CLI gap) | 🟡 MEDIUM | 1h | CLI defaults |

---

## 6. Recommended Fix Order

### Phase 1: Critical Fixes (2.5 hours)
1. **Fix auth exports** (30m)
   - Update `adapters/auth/better-auth/adapter.json`
   - Fix `features/auth/tech-stack/blueprint.ts` index.ts exports

2. **Fix web app dependencies** (2h)
   - Add `INSTALL_PACKAGES` to connector blueprints
   - OR: Implement CLI auto-generation for app dependencies
   - Add workspace dependencies based on genome

### Phase 2: Medium Fixes (30 minutes)
3. **Fix UI nested paths** (15m)
   - Update `connectors/ui/tamagui-nextjs/blueprint.ts`

4. **Fix auth utils location** (15m)
   - Update `features/auth/frontend/blueprint.ts`

### Phase 3: Best Practices (1 hour)
5. **Add CLI defaults** (1h)
   - Generate .gitignore
   - Generate root tsconfig.json
   - Generate basic package.json scripts

---

## 7. Module Responsibility Matrix

| Responsibility | Current Location | Recommended Location |
|----------------|------------------|---------------------|
| Framework deps (Next.js, React) | ❌ Missing | CLI (auto) or Connector blueprints |
| Workspace deps | ✅ PackageJsonGenerator | ✅ Keep in CLI |
| Root configs (.gitignore, tsconfig) | ❌ Missing | ✅ CLI defaults |
| ESLint/Prettier | ❌ Missing | Marketplace module OR CLI default |
| Package exports | ✅ Adapter/Blueprint | ✅ Keep in modules |
| File paths | ✅ Blueprints | ✅ Keep in blueprints |

---

## 8. Conclusion

### 8.1 Module Issues Summary

**Critical Issues:**
- 2 modules need fixes (auth exports, web app deps)
- 1 CLI gap (app dependency generation)

**Medium Issues:**
- 2 modules need path fixes (UI nested, auth utils)

**Best Practices:**
- CLI should generate defaults (gitignore, root tsconfig)
- Marketplace modules can enhance/override

### 8.2 Recommended Approach

1. **Fix module blueprints** for immediate issues
2. **Implement CLI defaults** for best practices
3. **Keep marketplace modules** for opinionated tooling

This hybrid approach provides:
- ✅ Consistency (CLI defaults)
- ✅ Flexibility (marketplace modules)
- ✅ Better developer experience
- ✅ Proper monorepo support

---

## 9. Next Steps

1. **Immediate:** Fix critical module issues (auth exports, web deps)
2. **Short-term:** Fix medium priority path issues
3. **Medium-term:** Implement CLI defaults for root configs
4. **Long-term:** Consider ESLint/Prettier as CLI defaults or marketplace module

---

**Report Generated:** November 19, 2024  
**Total Issues Mapped:** 5  
**Modules Analyzed:** 8  
**Fix Effort Estimate:** 4 hours



