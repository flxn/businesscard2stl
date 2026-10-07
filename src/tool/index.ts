import { defineTool } from '@/core/tool';
import faq from './faq';
import { defaultOptions, isReadyForUpdate, normalizeOptions } from './options';
import ToolPanel from './ToolPanel.vue';

/** The business card tool: settings (options.ts), geometry (generator.ts) and sidebar (ToolPanel.vue). */
export default defineTool({
  defaultOptions,
  isReadyForUpdate,
  normalizeOptions,
  panel: ToolPanel,
  faq,
});
