import type { StoreConnector, ConnectorResult } from "./types";
import { amazonConnector } from "./amazon";
import { genericConnector } from "./generic";

// Ordered: specific connectors first, generic fallback last
const connectors: StoreConnector[] = [
  amazonConnector,
  genericConnector,
];

export async function importFromUrl(url: string): Promise<ConnectorResult> {
  const connector = connectors.find((c) => c.canHandle(url)) ?? genericConnector;
  return connector.fetch(url);
}
