class IllegalArgumentError extends Error {
    constructor(message: string) {
      super(message); 
      this.name = "IllegalArgumentError";
    }
  }