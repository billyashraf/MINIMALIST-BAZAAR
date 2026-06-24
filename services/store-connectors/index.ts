import type { StoreConnector, ConnectorResult } from "./types";
import { amazonConnector } from "./amazon";
import { shopifyConnector } from "./shopify";
import { ebayConnector } from "./ebay";
import { etsyConnector } from "./etsy";
import { aliexpressConnector } from "./aliexpress";
import { walmartConnector } from "./walmart";
import { genericConnector } from "./generic";

// Specific connectors checked first; generic catches everything else
const connectors: StoreConnector[] = [
  amazonConnector,
  ebayConnector,
  etsyConnector,
  aliexpressConnector,
  walmartConnector,
  shopifyConnector, // must be before generic (matches /products/ URLs)
  genericConnector,
];

export async function importFromUrl(url: string): Promise<ConnectorResult> {
  const connector = connectors.find((c) => c.canHandle(url)) ?? genericConnector;
  return connector.fetch(url);
}
