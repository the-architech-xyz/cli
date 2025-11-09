# Genome & Marketplace Refactor Plan

**Date:** 2025-11-07  
**Status:** Planning phase

---

## Goals

1. **Simplify genome resolution** – keep the CLI responsible only for mapping user-friendly aliases or file paths to actual `.genome.ts` files. No marketplace assumptions.
2. **Modularize marketplace handling** – treat each marketplace (core, UI variants, additional component libraries) as a named namespace managed by the marketplace registry and path initialization.
3. **Clarify contracts** – genomes (or the transformer) declare the namespaces they need; the CLI ensures those paths are resolved and exposed in the project context; blueprints access templates via namespace-aware helpers.

---

## Current Pain Points

- `GenomeResolverFactory` mixes config loading, strategy registration, and marketplace knowledge. Commands instantiate it even though resolved genomes now arrive pre-transformed from the marketplace.
- `MarketplaceService.loadTemplate` guesses UI framework paths and falls back to core marketplace, causing complexity and repeated disk I/O.
- Path initialization exposes `context.marketplace.ui`, but naming isn’t generic enough for future component marketplaces.

---

## Proposed Architecture

### 1. Genome Alias Resolver
- Lightweight helper (`resolveGenomeAlias(name: string): string`) returning an absolute `.genome.ts` path.
- Uses config-defined aliases + core genome directory listings.
- Does **not** know about template marketplaces.
- `new` command: if user supplies an alias, call helper; otherwise treat as file path. After executing the TypeScript genome, we rely on the transformer output.

### 2. Marketplace Namespace Registry
- Extend `MarketplaceRegistry` to expose namespaces, e.g.:
  - `components.core` (existing core marketplace)
  - `components.ui.default`, `components.ui.shadcn`, `components.ui.tamagui`
  - Future namespaces (`components.payments`, `components.email`, etc.).
- Path initialization reads the genome’s declared namespaces and resolves them to absolute directories.
- `context.marketplace` becomes a dictionary keyed by namespace.

### 3. Template Loading Contract
- `MarketplaceService.loadTemplate(namespace, relativePath)` first checks the namespace provided; no UI-specific branching.
- Blueprints request templates via namespaced paths (e.g. `${marketplace.components.ui}/ui/auth/LoginPage.tsx.tpl`).
- Core fallback optional: if namespace missing, either throw or delegate to a shared default.

---

## Implementation Steps

1. **Remove `GenomeResolverFactory`**
   - Collapse strategy registration into `GenomeResolver` constructor or replace with simple alias helper.
   - Update `new` and `list-genomes` commands to use the new helper.

2. **Define Genome Alias Helper**
   - Reads config (`architech.config.*`) for custom aliases.
   - Scans `marketplace/genomes/official` for default entries.
   - Returns absolute path or throws with suggestions.

3. **Marketplace Namespace Model**
   - Update `MarketplaceRegistry` to register namespaces and resolve directory paths.
   - Modify `PathInitializationService` to populate `context.marketplace.<namespace>` entries.

4. **Update Template Loader**
   - Adjust `MarketplaceService.loadTemplate` API to accept namespace and relative path.
   - Migrate blueprints to use namespace-aware paths (with fallback where necessary).

5. **Cleanup & Docs**
   - Remove obsolete strategies that reference UI-specific logic.
   - Document new contract for genomes/transformer authors (namespaces) and blueprint authors (template references).

---

## Open Questions

- Should the transformer inject namespace info into the genome (`project.marketplaceNamespaces`), or should the CLI derive it from module metadata?
- How do we handle backward compatibility for existing blueprints that assume `${paths.ui_library}` conventions? (Likely keep transitional aliases while updating blueprints.)
- Do we still need NPM-package genome strategies, or will genomes always be local/marketplace-driven? Decide before pruning strategies entirely.

---

**Next:** Implement Step 1 (remove factory & slim resolver), then iterate through marketplace namespace changes.
