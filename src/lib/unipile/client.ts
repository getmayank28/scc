// Server-only wrapper around the Unipile REST API.
//
// This is the ONLY file that knows Unipile exists. Swapping providers (Nylas,
// Aurinko, raw IMAP) should touch this file and nothing else — keep the
// exported surface provider-neutral.
//
// Never import from a client component: UNIPILE_API_KEY must not reach the
// browser.

import "server-only";

import type {
  ListEmailsParams,
  UnipileAttachmentFile,
  UnipileEmail,
  UnipileEmailList,
  UnipileHostedAuthLink,
} from "./types";

export class UnipileError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "UnipileError";
  }
}

function config() {
  const dsn = process.env.UNIPILE_DSN;
  const apiKey = process.env.UNIPILE_API_KEY;
  if (!dsn || !apiKey) {
    throw new UnipileError(
      "UNIPILE_DSN and UNIPILE_API_KEY must be set in .env.local",
      500,
    );
  }
  // Tolerate a DSN pasted with or without scheme / trailing slash.
  const base = /^https?:\/\//.test(dsn) ? dsn : `https://${dsn}`;
  return { base: base.replace(/\/$/, ""), apiKey };
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { base, apiKey } = config();
  const res = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: {
      "X-API-KEY": apiKey,
      accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Surface Unipile's own message when it sends one; it is far more useful
    // than a bare status code while wiring things up.
    const detail = await res.text().catch(() => "");
    throw new UnipileError(
      `Unipile ${res.status} on ${path}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

/**
 * Creates a short-lived hosted-auth URL. `name` is echoed back to `notify_url`
 * on success, so we pass our user `_id` and use it to match the account.
 */
export async function createHostedAuthLink(opts: {
  name: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  notifyUrl: string;
  expiresInMinutes?: number;
  providers?: string[];
}): Promise<UnipileHostedAuthLink> {
  const { base } = config();
  const expiresOn = new Date(
    Date.now() + (opts.expiresInMinutes ?? 15) * 60_000,
  ).toISOString();

  return request<UnipileHostedAuthLink>("/hosted/accounts/link", {
    method: "POST",
    body: JSON.stringify({
      type: "create",
      providers: opts.providers ?? ["GOOGLE"],
      api_url: base,
      expiresOn,
      name: opts.name,
      success_redirect_url: opts.successRedirectUrl,
      failure_redirect_url: opts.failureRedirectUrl,
      notify_url: opts.notifyUrl,
    }),
  });
}

/** Lists emails. Filtering (sender, date, search) happens server-side. */
export async function listEmails(
  params: ListEmailsParams,
): Promise<UnipileEmailList> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  return request<UnipileEmailList>(`/emails?${qs.toString()}`);
}

export async function getEmail(
  emailId: string,
  accountId: string,
): Promise<UnipileEmail> {
  const qs = new URLSearchParams({ account_id: accountId });
  return request<UnipileEmail>(
    `/emails/${encodeURIComponent(emailId)}?${qs.toString()}`,
  );
}

/**
 * Downloads one attachment. Returns raw bytes — the caller decides whether to
 * stream, inspect, or discard. Nothing is written to disk here.
 */
export async function getAttachment(
  // Must be the email's `provider_id`, not its `id` — see UnipileEmail.
  emailProviderId: string,
  attachmentId: string,
  accountId: string,
): Promise<UnipileAttachmentFile> {
  const { base, apiKey } = config();
  const qs = new URLSearchParams({ account_id: accountId });
  const res = await fetch(
    `${base}/api/v1/emails/${encodeURIComponent(emailProviderId)}/attachments/${encodeURIComponent(attachmentId)}?${qs.toString()}`,
    { headers: { "X-API-KEY": apiKey }, cache: "no-store" },
  );

  if (!res.ok) {
    throw new UnipileError(
      `Unipile ${res.status} downloading attachment ${attachmentId}`,
      res.status,
    );
  }

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);

  return {
    buffer: await res.arrayBuffer(),
    contentType:
      res.headers.get("content-type") ?? "application/octet-stream",
    filename: match?.[1] ? decodeURIComponent(match[1]) : undefined,
  };
}

/** Lists connected accounts — used by the demo to pick an account_id. */
export async function listAccounts(): Promise<{
  items: Array<{ id: string; type?: string; name?: string }>;
}> {
  return request("/accounts");
}

/** One account's details — used to capture the connected email address. */
export async function getAccount(accountId: string): Promise<{
  id: string;
  type?: string;
  name?: string;
  // Unipile nests the mailbox address differently per provider; we probe a few.
  connection_params?: {
    mail?: { username?: string; email?: string };
    im?: { username?: string };
  };
}> {
  return request(`/accounts/${encodeURIComponent(accountId)}`);
}

/** Best-effort extraction of the mailbox address from an account object. */
export function accountEmail(
  account: Awaited<ReturnType<typeof getAccount>>,
): string | undefined {
  const p = account.connection_params?.mail;
  return p?.email ?? p?.username ?? account.name;
}
