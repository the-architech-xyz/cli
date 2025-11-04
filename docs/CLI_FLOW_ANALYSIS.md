# CLI Flow Architecture Analysis

## 🔍 **Current State**

### **Issue Identified**
Error: `"Invalid genome structure: missing project or modules"` occurs in `convertGenomeToRecipe()` which expects `modules` array, but capability-first genomes don't have one.

### **Current Flow (Problematic)**

```
1. new.ts command
   ├─ executeTypeScriptGenome() → raw genome (capability-first or module-first)
   ├─ convertGenomeToRecipe() ❌ FAILS HERE - expects modules array
   └─ validateRecipe() → validates genome structure
   
2. orchestrator.executeRecipe()
   ├─ validateRecipe() → validates again
   ├─ initializeGenomeTransformer() → creates transformer
   ├─ genomeTransformer.transform() → transforms genome (BUT expects modules to exist!)
   ├─ featureModuleResolver.resolveFeatureModules()
   └─ ... execution continues
```

**Problems:**
1. ❌ `convertGenomeToRecipe()` fails for capability-first genomes (expects `modules`)
2. ❌ Transformation happens in orchestrator, but orchestrator validation expects `modules` to exist
3. ❌ Transformation happens TWICE if we fix `new.ts` (already some code there)
4. ❌ Orchestrator line 228: `genome.modules.length` will fail for capability-first genomes

---

## 🎯 **Desired Flow**

### **Proper Architecture**

```
1. INPUT HANDLING (new.ts command)
   ├─ Load genome file → raw genome (any format)
   ├─ Transform genome → normalized genome (always module-first)
   ├─ Validate genome → ensure structure is correct
   └─ Pass to orchestrator

2. EXECUTION (orchestrator-agent.ts)
   ├─ Receive transformed genome (guaranteed to have modules)
   ├─ Validate (already done, but double-check)
   ├─ Initialize project structure
   ├─ Resolve modules (dependency resolution, auto-inclusion)
   ├─ Execute modules (blueprint execution)
   └─ Return result
```

**Key Principle:** Transform ONCE at the boundary between input handling and execution.

---

## 🤔 **Design Decisions**

### **Question 1: Where Should Transformation Happen?**

**Option A: In Command (`new.ts`)** ✅ **RECOMMENDED**
- ✅ Early validation - fail fast with clear errors
- ✅ Orchestrator receives clean, normalized input
- ✅ Better separation of concerns (command = input, orchestrator = execution)
- ✅ Can provide better user feedback during transformation

**Option B: In Orchestrator (`orchestrator-agent.ts`)**
- ✅ Encapsulation - orchestrator owns all execution logic
- ❌ Orchestrator validation step would need to handle both formats
- ❌ Less clear when transformation errors occur
- ❌ More complex orchestrator responsibilities

**Decision:** **Option A** - Transform in command, orchestrator receives normalized genome.

---

### **Question 2: What Should Orchestrator Assume?**

The orchestrator should assume:
- ✅ Genome always has `modules` array (not undefined/empty)
- ✅ Genome is already transformed (capabilities → modules)
- ✅ Genome structure is valid (passed validation)

The orchestrator should NOT:
- ❌ Handle capability-first genomes directly
- ❌ Transform genomes (already done)
- ❌ Handle undefined `modules` array

---

### **Question 3: Should Orchestrator Still Transform?**

**Current orchestrator transformation (lines 223-250):**

Looking at what it does:
- Module expansion (forEach loops, etc.)
- Connector auto-inclusion
- Dependency resolution
- Parameter distribution

**But these should be separate concerns:**
- **Transformation** = Convert capability-first → module-first (happens once)
- **Resolution** = Expand modules, resolve dependencies (happens during execution)

**Decision:** Remove transformation from orchestrator, keep only resolution steps.

---

## 📋 **Implementation Plan**

### **Phase 1: Fix Command Flow** (`new.ts`)

1. **Remove/Update `convertGenomeToRecipe()`**
   - Remove old validation logic that expects `modules`
   - Replace with genome transformation logic

2. **Add Genome Transformation**
   - Transform raw genome (handles both capability-first and module-first)
   - Ensure output always has `modules` array

3. **Update Validation**
   - Validate transformed genome (now guaranteed to have modules)

4. **Update Orchestrator Call**
   - Pass transformed genome to orchestrator

---

### **Phase 2: Clean Orchestrator** (`orchestrator-agent.ts`)

1. **Remove Genome Transformation Step**
   - Remove lines 223-250 (genome transformation)
   - Remove `initializeGenomeTransformer()` method (or keep for future use)
   - Remove `genomeTransformer` instance variable

2. **Update Validation**
   - Orchestrator validation should expect `modules` array always exists

3. **Update Logging**
   - Remove transformation logging
   - Update to reflect that genome is pre-transformed

---

### **Phase 3: Clean Dead Code**

1. **Remove `CLICapabilityResolver`**
   - Old capability resolution logic
   - Replaced by genome transformer

2. **Update `convertGenomeToRecipe()`**
   - Remove or simplify (now just passes through transformed genome)

3. **Remove `CLICapabilityResolver` imports/usage**
   - Search and remove all references

---

### **Phase 4: Add UI Marketplace Resolution** (Future)

After transformation in command:
- Resolve UI components based on framework
- This happens AFTER transformation, before orchestrator

---

## 🔧 **Files to Update**

### **Modify:**
1. `Architech/src/commands/new.ts`
   - Replace `convertGenomeToRecipe()` logic
   - Add genome transformation before validation
   - Update flow to transform → validate → execute

2. `Architech/src/agents/orchestrator-agent.ts`
   - Remove genome transformation step (lines 223-250)
   - Update validation to expect modules always exist
   - Remove/update `initializeGenomeTransformer()` if not needed

### **Delete:**
3. `Architech/src/core/services/capability-resolution/cli-capability-resolver.ts`
   - Old capability resolution (replaced by genome transformer)

### **Verify:**
4. Check all imports of `CLICapabilityResolver` and remove
5. Check all references to old `convertGenomeToRecipe()` logic

---

## ✅ **Expected Outcome**

After changes:
- ✅ Capability-first genomes work correctly
- ✅ Module-first genomes work correctly
- ✅ Transformation happens once (in command)
- ✅ Orchestrator receives clean, normalized genome
- ✅ No duplicate transformation
- ✅ Clear separation of concerns
- ✅ Better error messages

---

## 🧪 **Testing**

Test cases:
1. ✅ Capability-first genome (`saas-platform-capability.genome.ts`)
2. ✅ Module-first genome (`01-hello-world.genome.ts`)
3. ✅ Hybrid genome (has both `capabilities` and `modules`)
4. ✅ Invalid genome (fail fast with clear error)

