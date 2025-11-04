# Template Processing Issue Analysis

## 🔍 **Problem**

Template variables like `{{module.parameters.reactVersion}}` in blueprint RUN_COMMAND actions are **not being replaced**. The literal `{{module.parameters.reactVersion}}` is being passed to the shell command, causing npm errors.

**Error:**
```
npm install react@{{module.parameters.reactVersion}} react-dom@{{module.parameters.reactVersion}} ...
npm error Invalid tag name "{{module.parameters.reactVersion}}"
```

---

## 📋 **Current Flow**

1. **Blueprint defines action:**
   ```typescript
   {
     type: RUN_COMMAND,
     command: 'npm install react@{{module.parameters.reactVersion}} ...',
     condition: '{{#if module.parameters.reactVersion}}'
   }
   ```

2. **BlueprintExecutor.executeBlueprint()** → calls `handleAction()`

3. **RunCommandHandler.handle()** → calls `TemplateService.processTemplate(command, context)`

4. **TemplateService.processTemplate()** → detects `{{` syntax → calls `processSimpleHandlebars()`

5. **processSimpleHandlebars()** → calls `getNestedValue(context, 'module.parameters.reactVersion')`

6. **getNestedValue()** → tries to access `context.module.parameters.reactVersion`

7. ❌ **PROBLEM:** `context.module.parameters.reactVersion` is undefined (framework module has empty parameters)

8. **getNestedValue()** returns `undefined` → template processor returns original `{{module.parameters.reactVersion}}`

---

## 🔍 **Root Cause Analysis**

### **Issue 1: Missing Condition Evaluation**
- Blueprint actions have `condition: '{{#if module.parameters.reactVersion}}'` but this is **never evaluated**
- Actions should be **skipped** if condition is false
- Currently: All actions are executed regardless of condition

### **Issue 2: Template Variable Not Replaced When Undefined**
- When `module.parameters.reactVersion` is undefined, template processor leaves `{{module.parameters.reactVersion}}` as-is
- Should either:
  - Skip the action if condition is false, OR
  - Replace undefined with empty string or default value

### **Issue 3: Framework Module Has Empty Parameters**
- Auto-included framework module: `{ id: 'adapters/framework/nextjs', parameters: {} }`
- No default values from `adapter.json` schema
- `reactVersion` parameter doesn't exist

---

## 🎯 **Solution Options**

### **Option A: Add Condition Evaluation + Skip Actions** ✅ **RECOMMENDED**
1. Evaluate `action.condition` before execution
2. Skip action if condition evaluates to false
3. Use `TemplateService` to evaluate condition (process it as a template, then check truthiness)

**Pros:**
- Handles conditional actions correctly
- Prevents undefined variables from being passed to commands
- Respects blueprint intent (only run if condition is true)

**Cons:**
- Requires adding condition evaluation logic
- Need to ensure template evaluation works for conditions

---

### **Option B: Provide Default Values for Framework Parameters**
1. When auto-including framework, load `adapter.json` schema
2. Use default values from schema
3. Merge defaults into module parameters

**Pros:**
- Framework modules have proper parameters
- Template variables resolve correctly

**Cons:**
- Doesn't solve condition evaluation (still need that)
- More complex (need to load schemas during transformation)

---

### **Option C: Improve Template Processing to Handle Undefined**
1. When variable is undefined and no fallback, skip the action or use empty string
2. Better error messages for missing variables

**Pros:**
- Simpler (only template service changes)

**Cons:**
- Doesn't respect blueprint conditions (actions still execute when they shouldn't)
- Less precise control

---

## ✅ **Recommended Solution: Hybrid Approach**

### **1. Add Condition Evaluation** (CRITICAL)
- Evaluate `action.condition` before executing action
- Skip action if condition is false/undefined
- Use `TemplateService.processTemplate()` to evaluate condition, then check truthiness

### **2. Load Framework Defaults** (NICE TO HAVE)
- When auto-including framework in transformer, load `adapter.json` defaults
- Merge defaults into module parameters

### **3. Improve Error Messages** (NICE TO HAVE)
- Better logging when conditions fail or variables are undefined

---

## 📝 **Implementation Plan**

### **Phase 1: Add Condition Evaluation**

**File:** `Architech/src/core/services/execution/blueprint/blueprint-executor.ts`

1. Add `evaluateActionCondition()` method:
   ```typescript
   private evaluateActionCondition(action: BlueprintAction, context: ProjectContext): boolean {
     if (!action.condition) return true; // No condition = always execute
     
     // Process condition as template (handles {{#if}} syntax)
     const processedCondition = TemplateService.processTemplate(action.condition, context);
     
     // Check if result is truthy
     // Conditions like "{{#if var}}" get processed, result should indicate truthiness
     return TemplateService.isTruthy(processedCondition);
   }
   ```

2. Update `executeBlueprint()` to check conditions:
   ```typescript
   for (const action of expandedActions) {
     // Evaluate condition first
     if (!this.evaluateActionCondition(action, context)) {
       console.log(`⏭️  Skipping action (condition false): ${action.type}`);
       continue;
     }
     
     // Execute action
     const result = await this.actionHandlerRegistry.handleAction(...);
   }
   ```

3. Update `executeActions()` similarly

---

### **Phase 2: Load Framework Defaults** (Optional, Future Enhancement)

**File:** `architech-genome-transformer/src/transformers/capability-normalizer.ts`

When auto-including framework:
1. Load `adapter.json` from marketplace
2. Extract `parameters` schema defaults
3. Merge into module parameters

---

## 🧪 **Testing**

After fix, test:
1. ✅ Action with condition `{{#if module.parameters.reactVersion}}` should be skipped if reactVersion is undefined
2. ✅ Action without condition should always execute
3. ✅ Template variables in commands should be replaced (if condition is true)
4. ✅ Multiple conditions in same blueprint should work

---

**Status:** Ready for implementation

