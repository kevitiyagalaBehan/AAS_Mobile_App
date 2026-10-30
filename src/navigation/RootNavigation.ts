import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Messages is a drawer screen (opened from the Home header) for every account type
export function inboxRoute(
  screen: "InboxList" | "InboxDetail",
  params?: object
) {
  return { screen: "Inbox", params: { screen, params } };
}

export function navigate(
  name: keyof RootStackParamList,
  params?: object
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  }
}
