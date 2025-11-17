declare module '@thearchitech.xyz/marketplace/adapter' {
  import type { MarketplaceAdapter } from '@thearchitech.xyz/types';
  const adapter: MarketplaceAdapter;
  export default adapter;
  export { adapter as coreMarketplaceAdapter };
}
