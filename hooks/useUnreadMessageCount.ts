import { useMessageThreads } from "./useMessageThreads";

// Number of message threads with replies the user hasn't opened yet
export const useUnreadMessageCount = (refreshTrigger?: number) => {
  const { threads } = useMessageThreads(refreshTrigger);
  return threads.filter((t) => t.unread).length;
};
