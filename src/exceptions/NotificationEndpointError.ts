export class NotificationEndpointError extends Error {
    constructor(message: string) {
      super(message); 
      this.name = "NotificationEndpointError";
    }
  }