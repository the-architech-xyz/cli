# CLI Dependency Update Plan

## 📊 Current Status

### Published Packages (npm)
- ✅ `@thearchitech.xyz/marketplace` - v0.9.2 (published)
- ✅ `@thearchitech.xyz/types` - v0.8.1 (published)
- ✅ `@thearchitech.xyz/validator` - v0.1.1 (published)
- ❌ `@thearchitech.xyz/genome-transformer` - v1.0.0 (NOT published)

### Current CLI Dependencies (file: paths)
```json
{
  "@thearchitech.xyz/genome-transformer": "file:../architech-genome-transformer",
  "@thearchitech.xyz/marketplace": "file:../marketplace",
  "@thearchitech.xyz/types": "^0.8.1",
  "@thearchitech.xyz/validator": "file:../validator"
}
```

## 🎯 Action Plan

### Step 1: Publish `@thearchitech.xyz/genome-transformer`
- ✅ Package is built (dist/ exists)
- ✅ Version is 1.0.0
- ⏳ Need to publish to npm

### Step 2: Update CLI package.json
Replace file: dependencies with npm package versions:
- `@thearchitech.xyz/genome-transformer`: `^1.0.0`
- `@thearchitech.xyz/marketplace`: `^0.9.2` (already correct format)
- `@thearchitech.xyz/validator`: `^0.1.1`
- `@thearchitech.xyz/types`: `^0.8.1` (already correct)

## 📝 Recommended Approach

**Use npm packages** for all dependencies:
- ✅ Consistent with marketplace
- ✅ Version management
- ✅ Easier for users/clients
- ✅ Standard npm workflow

**Do NOT use GitHub** because:
- ❌ Requires git authentication
- ❌ Slower install times
- ❌ More complex setup
- ❌ npm packages are already established

















