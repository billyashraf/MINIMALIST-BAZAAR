export interface ImportedProduct {
  title: string;
  description: string;
  images: string[];
  sourceStore: string;
  sourceUrl: string;
  sourcePrice: number;
  currency: string;
  deliveryEstimate: string;
}

export type ConnectorResult =
  | { success: true; data: ImportedProduct }
  | { success: false; error: string };

export interface StoreConnector {
  name: string;
  canHandle(url: string): boolean;
  fetch(url: string): Promise<ConnectorResult>;
}
