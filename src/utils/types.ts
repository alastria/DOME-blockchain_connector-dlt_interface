export type DOMEEvent = {
    id: number;
    timestamp: number;
    eventType: string;
    dataLocation: string;
    relevantMetadata: string[];
    entityId: string;
    previousEntityHash: string;
  }