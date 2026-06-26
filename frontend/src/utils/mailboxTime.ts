import { TFunction } from 'i18next';

export function formatMailboxTimeLeft(
  expiresAt: number,
  t: TFunction,
  options?: { later?: boolean; empty?: string },
): string {
  if (!expiresAt) return options?.empty ?? '';

  const now = Math.floor(Date.now() / 1000);
  const timeLeftSeconds = expiresAt - now;

  if (timeLeftSeconds <= 0) return t('mailbox.expired');

  const hours = Math.floor(timeLeftSeconds / 3600);
  const minutes = Math.floor((timeLeftSeconds % 3600) / 60);

  if (options?.later) {
    if (hours > 0) return t('mailbox.expiresInTimeLater', { hours, minutes });
    return t('mailbox.expiresInMinutesLater', { minutes });
  }

  if (hours > 0) return t('mailbox.expiresInTime', { hours, minutes });
  return t('mailbox.expiresInMinutes', { minutes });
}
