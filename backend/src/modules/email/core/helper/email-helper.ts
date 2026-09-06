export function extractEmailBody(payload: any): string {
  let encodedBody = '';

  const findBody = (part: any): string | null => {
    if (part.body && part.body.data) {
      return part.body.data;
    }

    if (part.parts) {
      const textPart = part.parts.find((p: any) => p.mimeType === 'text/plain');
      if (textPart) {
        const body = findBody(textPart);
        if (body) return body;
      }

      for (const subPart of part.parts) {
        const body = findBody(subPart);
        if (body) return body;
      }
    }

    return null;
  };

  encodedBody = findBody(payload) || '';

  if (encodedBody) {
    const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  return 'No readable text found';
}

/**
 * Generic helper to extract a specific mime-type part from Gmail payload
 */
export function extractPart(part: any, mimeType: string): string | null {
  if (part.mimeType === mimeType && part.body && part.body.data) {
    return this.decodeBase64(part.body.data);
  }

  if (part.parts) {
    for (const subPart of part.parts) {
      const body = this.extractPart(subPart, mimeType);
      if (body) return body;
    }
  }

  return null;
}

export function decodeBase64(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}
