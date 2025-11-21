# Schema File Standardization Plan

## Executive Summary

This document outlines the refactoring plan to standardize all module schema files to use a single name: `schema.json`, regardless of module type (adapter, connector, or feature). This simplifies the codebase and follows best practices for consistent naming conventions.

## Current State Analysis

### Current Naming Convention
- **Adapters**: `adapter.json`
- **Connectors**: `connector.json`
- **Features**: `feature.json`

### Files That Reference Schema Names

#### 1. CLI Code (`Architech/src/`)
- `v2-genome-handler.ts` (lines 361-374): Hardcodes paths with type-specific names
- `marketplace-service.ts` (line 413): Comment mentions all three types
- `dependency-resolver-service.ts` (line 64): Comment mentions all three types

#### 2. Marketplace Scripts (`marketplace/scripts/`)
- `utilities/schema-loader.ts`: `loadModuleSchema()` function constructs paths based on type
- `generation/generate-marketplace-manifest.ts`: Uses glob patterns like `adapters/**/adapter.json`
- `generation/generate-capability-first-manifest.ts`: Similar glob patterns

#### 3. Other Scripts
- `scripts/apply-prerequisites.ts`: `findModuleDefinitionFile()` tries multiple patterns
- `architech-genome-transformer/src/core/parameter-distribution.ts`: `loadSchemasFromDirectory()` takes `schemaFileName` parameter

#### 4. Marketplace Adapter (`marketplace/adapter/`)
- `index.js`: Uses manifest.json (not schema files directly)

## Refactoring Plan

### Phase 1: Update Code References

#### 1.1 Update `v2-genome-handler.ts`
**Location**: `Architech/src/core/services/composition/v2-genome-handler.ts`

**Current Code** (lines 361-374):
```typescript
if (parts[0] === 'adapters') {
  manifestFile = `adapters/${parts[1]}/${parts[2]}/adapter.json`;
} else if (parts[0] === 'connectors') {
  manifestFile = `connectors/${parts[1]}/${parts[2]}/connector.json`;
} else if (parts[0] === 'features') {
  // ... complex logic for features
  manifestFile = `features/${featurePath}/${layer}/feature.json`;
}
```

**New Code**:
```typescript
// All modules use schema.json regardless of type
if (parts[0] === 'adapters') {
  manifestFile = `adapters/${parts[1]}/${parts[2]}/schema.json`;
} else if (parts[0] === 'connectors') {
  manifestFile = `connectors/${parts[1]}/${parts[2]}/schema.json`;
} else if (parts[0] === 'features') {
  // ... same logic but use schema.json
  manifestFile = `features/${featurePath}/${layer}/schema.json`;
}
```

#### 1.2 Update `schema-loader.ts`
**Location**: `marketplace/scripts/utilities/schema-loader.ts`

**Current Code** (lines 54-77):
```typescript
export function loadModuleSchema(
  moduleId: string,
  moduleType: 'adapter' | 'connector' | 'feature',
  marketplacePath: string
): any {
  let schemaPath: string;
  
  if (moduleType === 'adapter') {
    schemaPath = path.join(marketplacePath, 'adapters', moduleId, 'adapter.json');
  } else if (moduleType === 'connector') {
    const connectorPath = moduleId.replace(/^connectors\//, '');
    schemaPath = path.join(marketplacePath, 'connectors', connectorPath, 'connector.json');
  } else if (moduleType === 'feature') {
    const featurePath = moduleId.replace(/^features\//, '');
    schemaPath = path.join(marketplacePath, 'features', featurePath, 'feature.json');
  }
  
  return loadSchema(schemaPath);
}
```

**New Code**:
```typescript
export function loadModuleSchema(
  moduleId: string,
  moduleType: 'adapter' | 'connector' | 'feature',
  marketplacePath: string
): any {
  let schemaPath: string;
  
  // All modules use schema.json
  if (moduleType === 'adapter') {
    schemaPath = path.join(marketplacePath, 'adapters', moduleId, 'schema.json');
  } else if (moduleType === 'connector') {
    const connectorPath = moduleId.replace(/^connectors\//, '');
    schemaPath = path.join(marketplacePath, 'connectors', connectorPath, 'schema.json');
  } else if (moduleType === 'feature') {
    const featurePath = moduleId.replace(/^features\//, '');
    schemaPath = path.join(marketplacePath, 'features', featurePath, 'schema.json');
  }
  
  return loadSchema(schemaPath);
}
```

#### 1.3 Update `generate-marketplace-manifest.ts`
**Location**: `marketplace/scripts/generation/generate-marketplace-manifest.ts`

**Current Code** (lines 304-322):
```typescript
const adapterFiles = await glob('adapters/**/adapter.json', { cwd: process.cwd() });
const connectorFiles = await glob('connectors/**/connector.json', { cwd: process.cwd() });
```

**New Code**:
```typescript
const adapterFiles = await glob('adapters/**/schema.json', { cwd: process.cwd() });
const connectorFiles = await glob('connectors/**/schema.json', { cwd: process.cwd() });
// Features already use feature.json in some places, update to schema.json
```

#### 1.4 Update `apply-prerequisites.ts`
**Location**: `scripts/apply-prerequisites.ts`

**Current Code** (lines 27-57):
```typescript
function findModuleDefinitionFile(moduleId: string, marketplacePath: string): string | null {
  const patterns = [
    path.join(marketplacePath, moduleId, 'adapter.json'),
    path.join(marketplacePath, moduleId, 'connector.json'),
    path.join(marketplacePath, moduleId, 'feature.json'),
    // ... many more patterns
  ];
}
```

**New Code**:
```typescript
function findModuleDefinitionFile(moduleId: string, marketplacePath: string): string | null {
  // Try schema.json first (new standard)
  const schemaPath = path.join(marketplacePath, moduleId, 'schema.json');
  if (fs.existsSync(schemaPath)) {
    return schemaPath;
  }
  
  // Fallback to old names for backward compatibility (can be removed later)
  const patterns = [
    path.join(marketplacePath, moduleId, 'adapter.json'),
    path.join(marketplacePath, moduleId, 'connector.json'),
    path.join(marketplacePath, moduleId, 'feature.json'),
    // ... rest of patterns
  ];
}
```

#### 1.5 Update `parameter-distribution.ts`
**Location**: `architech-genome-transformer/src/core/parameter-distribution.ts`

**Current Code** (lines 238-260):
```typescript
await this.loadSchemasFromDirectory(
  path.join(marketplacePath, 'adapters'),
  'adapter.json',
  fs,
  path
);
await this.loadSchemasFromDirectory(
  path.join(marketplacePath, 'features'),
  'feature.json',
  fs,
  path
);
await this.loadSchemasFromDirectory(
  path.join(marketplacePath, 'connectors'),
  'connector.json',
  fs,
  path
);
```

**New Code**:
```typescript
// All modules use schema.json
await this.loadSchemasFromDirectory(
  path.join(marketplacePath, 'adapters'),
  'schema.json',
  fs,
  path
);
await this.loadSchemasFromDirectory(
  path.join(marketplacePath, 'features'),
  'schema.json',
  fs,
  path
);
await this.loadSchemasFromDirectory(
  path.join(marketplacePath, 'connectors'),
  'schema.json',
  fs,
  path
);
```

#### 1.6 Update Comments
- `marketplace-service.ts`: Update comment on line 413
- `dependency-resolver-service.ts`: Update comment on line 64

### Phase 2: Rename All Schema Files

#### 2.1 Adapters
Rename all `adapter.json` → `schema.json` in:
- `marketplace/adapters/**/adapter.json`

#### 2.2 Connectors
Rename all `connector.json` → `schema.json` in:
- `marketplace/connectors/**/connector.json`

#### 2.3 Features
Rename all `feature.json` → `schema.json` in:
- `marketplace/features/**/feature.json`

### Phase 3: Update Documentation

Update any documentation that references:
- `adapter.json`
- `connector.json`
- `feature.json`

To use `schema.json` instead.

## Implementation Steps

### Step 1: Update Code (Backward Compatible)
1. Update all code references to use `schema.json`
2. Add fallback logic to check old names for backward compatibility
3. Test that code still works

### Step 2: Rename Files
1. Create a script to rename all schema files
2. Run the script
3. Verify all files renamed

### Step 3: Remove Fallback Logic
1. After confirming all files renamed, remove fallback logic
2. Clean up old references

### Step 4: Update Tests
1. Update any tests that reference old file names
2. Run test suite

## Benefits

1. **Consistency**: Single naming convention across all module types
2. **Simplicity**: No need to remember different names for different types
3. **Maintainability**: Easier to update code (one pattern instead of three)
4. **Best Practice**: Follows standard naming conventions

## Migration Strategy

### Backward Compatibility
Initially, we'll add fallback logic to check both `schema.json` and old names. This allows:
1. Gradual migration
2. No breaking changes during transition
3. Easy rollback if needed

### Timeline
1. **Week 1**: Update code with fallback logic
2. **Week 2**: Rename all schema files
3. **Week 3**: Remove fallback logic and clean up

## Files to Update

### CLI Code
- [ ] `Architech/src/core/services/composition/v2-genome-handler.ts`
- [ ] `Architech/src/core/services/marketplace/marketplace-service.ts` (comments)
- [ ] `Architech/src/core/services/dependency/dependency-resolver-service.ts` (comments)

### Marketplace Scripts
- [ ] `marketplace/scripts/utilities/schema-loader.ts`
- [ ] `marketplace/scripts/generation/generate-marketplace-manifest.ts`
- [ ] `marketplace/scripts/generation/generate-capability-first-manifest.ts`

### Other Scripts
- [ ] `scripts/apply-prerequisites.ts`
- [ ] `architech-genome-transformer/src/core/parameter-distribution.ts`

### Schema Files (Rename)
- [ ] All `adapter.json` files
- [ ] All `connector.json` files
- [ ] All `feature.json` files

## Testing Checklist

- [ ] Code compiles without errors
- [ ] All schema files load correctly
- [ ] Manifest generation works
- [ ] Module loading works
- [ ] Dependency resolution works
- [ ] All tests pass

---

**Status**: Ready for Implementation
**Priority**: High (Code Best Practice)
**Estimated Effort**: 4-6 hours


