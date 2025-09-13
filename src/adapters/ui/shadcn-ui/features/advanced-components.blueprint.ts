import { Blueprint } from '../../../../types/adapter.js';

const advancedComponentsBlueprint: Blueprint = {
  id: "shadcn-ui-advanced-components",
  name: "Shadcn/ui Advanced Components",
  actions: [
    {
      type: "CREATE_FILE",
      path: "src/lib/ui/component-registry.ts",
      content: "// Component registry and utilities"
    }
  ]
};
export default advancedComponentsBlueprint;
