export type DOMEEvent = {
    id: number;
    ethereumAddress: string;
    publisherAddress: string;
    timestamp: number;
    eventType: string;
    dataLocation: string;
    relevantMetadata: string[];
    entityId: string;
    previousEntityHash: string;
  }


export type Subscription = { eventTypes: string[]; metadata: string[] ; notificationEndpoint?: string; };
