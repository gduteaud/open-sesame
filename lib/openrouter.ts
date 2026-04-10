export type ProvisionKeyResult = {
  key: string;
  hash: string;
};

export async function provisionOpenRouterKey(params: {
  name: string;
  limitUsd: number;
  /** ISO 8601 UTC (OpenRouter rejects non-UTC offsets). */
  expiresAtIso: string;
}): Promise<ProvisionKeyResult> {
  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  if (!managementKey) {
    throw new Error("OPENROUTER_MANAGEMENT_KEY is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/keys", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${managementKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.name,
      limit: params.limitUsd,
      expires_at: params.expiresAtIso,
    }),
  });

  const json = (await res.json()) as {
    key?: string;
    data?: { hash?: string };
    error?: { message?: string };
  };

  if (!res.ok) {
    const msg =
      json.error?.message ?? `OpenRouter error ${res.status}`;
    throw new Error(msg);
  }

  if (!json.key || !json.data?.hash) {
    throw new Error("Unexpected OpenRouter response");
  }

  return { key: json.key, hash: json.data.hash };
}
