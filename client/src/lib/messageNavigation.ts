/**
 * Returns a valid message recipient from a dashboard URL query string.
 * The recipient is checked against the active-recipient list before use.
 */
export function getPreselectedMessageRecipientId(search: string, activeRecipientIds: number[]): number | null {
  const rawRecipientId = new URLSearchParams(search).get("recipient");
  if (!rawRecipientId || !/^\d+$/.test(rawRecipientId)) return null;

  const recipientId = Number(rawRecipientId);
  return Number.isSafeInteger(recipientId) && activeRecipientIds.includes(recipientId)
    ? recipientId
    : null;
}
