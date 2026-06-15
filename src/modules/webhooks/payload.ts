export type JsonRecord = Record<string, unknown>;

export function flattenPayload(
  value: unknown,
  prefix = "",
  result: Record<string, unknown> = {},
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenPayload(item, prefix ? `${prefix}.${index}` : `${index}`, result);
    });
    return result;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as JsonRecord)) {
      const path = prefix ? `${prefix}.${key}` : key;
      flattenPayload(child, path, result);
    }
    return result;
  }

  if (prefix) {
    result[prefix] = value;
  }

  return result;
}

export function getValueAtPath(payload: JsonRecord, path: string) {
  if (!path.includes(".")) {
    return payload[path];
  }

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in (current as JsonRecord)) {
      return (current as JsonRecord)[segment];
    }

    return undefined;
  }, payload);
}

export function normalizeWebhookValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export function normalizePhoneToDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return `+${digits}`;
  }

  return `+55${digits}`;
}
