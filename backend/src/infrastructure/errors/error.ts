export class AuthError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ConnectionError extends Error {
  constructor(message = 'Connection failed') {
    super(message);
    this.name = 'ConnectionError';
  }
}
