export type NotificationTarget = {
  type: string;
  relatedModule?: string | null;
  relatedId?: number | null;
};

export function getNotificationNavigationTarget(notification: NotificationTarget): string | null {
  if (notification.type === "message" && notification.relatedModule === "messages" && notification.relatedId) {
    return `/dashboard/messages?message=${notification.relatedId}`;
  }
  return null;
}
