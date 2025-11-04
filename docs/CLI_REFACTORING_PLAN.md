# CLI Refactoring Plan

## 📊 **Current State Analysis**

### **What's Working:**
✅ Transformation code exists in `new.ts` (lines 119-147)  
✅ Flow: Transform → Validate → Execute orchestrator

### **What's Broken:**
❌ Old `convertGenomeToRecipe()` function still exists (unused, would fail)  
❌ Orchestrator still tries to transform genome (duplicate work, lines 223-250)  
❌ Orchestrator line 228 assumes `genome.modules.length` exists (fails for capability-first)  
❌ `CLICapabilityResolver` exists but unused (dead code)

---

## 🎯 **Refactoring Plan**

### **Phase 1: Clean Command (`new.ts`)** ⚠️ **NEEDS VERIFICATION**

**Current Flow (Lines 110-182):**
```
1. Execute genome → rawGenome
2. Transform genome → validatedGenome ✅ (ALREADY DONE)
3. Validate → validateRecipe(validatedGenome)
4. Execute orchestrator → executeRecipe(validatedGenome)
```

**Action Required:**
- ✅ Keep transformation code (lines 119-147) - **ALREADY CORRECT**
- ❌ Remove `convertGenomeToRecipe()` function (lines 269-295) - **DEAD CODE**
- ✅ Verify `validateRecipe()` works with transformed genome

---

### **Phase 2: Clean Orchestrator (`orchestrator-agent.ts`)** 🔴 **CRITICAL**

**Current Flow (Lines 223-250):**
```
1. Validate genome (expects modules)
2. Transform genome ← PROBLEM: Genome already transformed!
3. Update genome.modules
4. Feature resolution
```

**Actions Required:**

1. **Remove Genome Transformation Step (Lines 223-250)**
   ```typescript
   // REMOVE THIS ENTIRE SECTION:
   // 1.3. GENOME TRANSFORMATION - Unified transformation pipeline
   ExecutionTracer.logOperation(traceId, "Genome transformation");
   Logger.info("🎯 Starting genome transformation pipeline", {...});
   await this.initializeGenomeTransformer();
   const transformationResult = await this.genomeTransformer!.transform(genome);
   // ... etc
   ```

2. **Update Validation Comment**
   ```typescript
   // 1. Validate genome (already transformed in command, guaranteed to have modules)
   ExecutionTracer.logOperation(traceId, "Validating genome");
   const validationResult = this.validateRecipe(genome);
   ```

3. **Remove/Keep Transformer Instance**
   - Option A: Remove `genomeTransformer` property entirely
   - Option B: Keep but mark as unused (for future UI resolution?)
   - **Recommendation: Remove it** (can be added back if needed)

---

### **Phase 3: Remove Dead Code** 🧹

**Files to Delete:**
- ❌ `Architech/src/core/services/capability-resolution/cli-capability-resolver.ts`
  - Reason: Replaced by genome transformer
  - Check for imports first

**Functions to Remove:**
- ❌ `convertGenomeToRecipe()` in `new.ts` (lines 266-295)
  - Reason: Replaced by genome transformer
  - Not currently called, but exists as dead code

**Imports to Remove:**
- Search for `CLICapabilityResolver` imports - remove if unused
- Search for `convertGenomeToRecipe` - verify not called elsewhere

---

### **Phase 4: Update Validation** ✅

**Verify `validateRecipe()` works correctly:**
- Should expect `genome.modules` array to exist (already transformed)
- Should validate structure, not format conversion

**Location:** Check where `validateRecipe` is defined and ensure it handles transformed genomes.

---

## 📝 **Detailed Changes**

### **File 1: `Architech/src/commands/new.ts`**

**Remove:**
- Lines 266-295: `convertGenomeToRecipe()` function
- Any imports related to old conversion logic

**Keep:**
- Lines 119-147: Genome transformation (already correct)
- Validation and orchestrator execution

**Verify:**
- No calls to `convertGenomeToRecipe()` anywhere
- `validateRecipe()` handles transformed genomes correctly

---

### **File 2: `Architech/src/agents/orchestrator-agent.ts`**

**Remove:**
- Lines 223-250: Genome transformation step
- Line 104: `genomeTransformer` property (or keep if future use planned)
- Lines 159-172: `initializeGenomeTransformer()` method (or keep if future use)

**Update:**
- Line 228: Remove `genome.modules.length` check (should always exist now)
- Validation comment to note genome is pre-transformed
- Update logging to reflect transformation already done

**Keep:**
- All other execution logic (feature resolution, module execution, etc.)

---

### **File 3: Delete `CLICapabilityResolver`**

**Before Deletion:**
1. Search for imports: `grep -r "CLICapabilityResolver" Architech/src`
2. Verify no usage
3. Delete file
4. Remove from exports if exported

---

## ✅ **Expected Results**

### **After Refactoring:**

1. **Command Flow (`new.ts`):**
   ```
   Load → Transform → Validate → Execute
   ✅ All genomes work (capability-first, module-first)
   ✅ Clear error messages
   ✅ Single transformation point
   ```

2. **Orchestrator Flow (`orchestrator-agent.ts`):**
   ```
   Receive → Validate → Resolve → Execute
   ✅ Receives normalized genome
   ✅ No duplicate transformation
   ✅ Focused on execution logic
   ```

3. **Code Quality:**
   - ✅ No dead code
   - ✅ Clear separation of concerns
   - ✅ Single responsibility per component
   - ✅ Easier to maintain

---

## 🧪 **Testing Checklist**

After changes, test:

1. ✅ Capability-first genome (`saas-platform-capability.genome.ts`)
   - Should transform correctly
   - Should execute successfully

2. ✅ Module-first genome (`01-hello-world.genome.ts`)
   - Should pass through transformation
   - Should execute successfully

3. ✅ Invalid genome (missing project)
   - Should fail early with clear error

4. ✅ Dry run mode
   - Should show preview correctly

---

## ⚠️ **Risks & Considerations**

1. **Breaking Changes:**
   - None expected (removing dead code)
   - Verify `validateRecipe()` handles all cases

2. **Future Considerations:**
   - UI marketplace resolution might need transformer
   - Keep transformer import available if needed

3. **Performance:**
   - Should improve (no duplicate transformation)
   - Earlier validation = faster feedback

---

## 📋 **Implementation Order**

1. ✅ Verify current `new.ts` transformation code works
2. ❌ Remove `convertGenomeToRecipe()` from `new.ts`
3. ❌ Remove transformation from orchestrator
4. ❌ Remove `CLICapabilityResolver` if unused
5. ✅ Test with capability-first genome
6. ✅ Test with module-first genome
7. ✅ Update documentation

---

**Status:** Ready for review and approval

