function toSafeName(value) {
    if (
      typeof value !== 'string' ||
      /[<>]/.test(value) ||
      /&#/.test(value) ||
      /&[a-z][a-z0-9]*;/i.test(value) ||
      /javascript\s*:/i.test(value) ||
      /\bon[a-z]+\s*=/i.test(value)
    ) {
      return '';
    }
    return value
      .replace(/[\u200B\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .substring(0, NAME_MAX_LENGTH);
  }
