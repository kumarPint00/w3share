import { useMutation } from '@tanstack/react-query';
import { apiService } from '@/lib/api';

export function useSubscribeNotifications() {
  return useMutation({
    mutationFn: (email: string) => apiService.subscribeToNotifications(email),
    onSuccess: () => {
      console.log('Successfully subscribed to notifications');
    },
  });
}

export function useUnsubscribeNotifications() {
  return useMutation({
    mutationFn: (email: string) => apiService.unsubscribeFromNotifications(email),
    onSuccess: () => {
      console.log('Successfully unsubscribed from notifications');
    },
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: ({ event, data }: { event: string; data: any }) =>
      apiService.trackEvent(event, data),
  });
}