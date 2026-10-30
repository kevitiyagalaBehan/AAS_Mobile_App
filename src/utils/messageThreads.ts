import AsyncStorage from "@react-native-async-storage/async-storage";
import { Comments, Messages } from "../navigation/types";
import { getMessages, loadComments } from "./pimsApi";

// The Inbox API only returns each thread's subject, creator and start date. To show
// iMessage-style rows (who's in it, last message, last activity, unread) we read each
// thread's comments, caching them per thread until its commentCount changes.

export type ThreadSummary = {
  id: string;
  subject: string;
  participants: string[];
  lastText: string;
  lastDate: number;
  lastFromMe: boolean;
  unread: boolean;
};

type CachedThread = {
  commentCount: number;
  participants: string[];
  lastText: string;
  lastDate: number;
  lastFromMe: boolean;
};

type SeenState = {
  // Threads with no activity after this were never shown as unread (first run on this device)
  initAt: number;
  threads: Record<string, number>;
};

const cacheKey = (accountId: string) => `inboxThreadCache:${accountId}`;
const seenKey = (accountId: string) => `inboxSeen:${accountId}`;
const FETCH_CONCURRENCY = 4;

const readJson = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

export const isOwnComment = (comment: Comments, myName?: string | null) =>
  comment.isCurrentUser || (!!myName && comment.author === myName);

const summarise = (
  thread: Messages,
  comments: Comments[],
  myName?: string | null
): CachedThread => {
  const sorted = [...comments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const last = sorted[sorted.length - 1];
  const participants = Array.from(
    new Set(
      sorted
        .filter((c) => !isOwnComment(c, myName))
        .map((c) => c.author)
        .filter(Boolean)
    )
  );

  return {
    commentCount: thread.commentCount,
    participants,
    lastText: last?.comment ?? thread.description,
    lastDate: last ? new Date(last.date).getTime() : thread.uploadedDate,
    lastFromMe: last ? isOwnComment(last, myName) : !thread.fromPIMS,
  };
};

const getSeen = async (accountId: string): Promise<SeenState> => {
  const existing = await readJson<SeenState>(seenKey(accountId));
  if (existing) return existing;
  const fresh = { initAt: Date.now(), threads: {} };
  await writeJson(seenKey(accountId), fresh);
  return fresh;
};

export const markThreadSeen = async (
  accountId: string,
  threadId: string,
  lastDate: number
) => {
  const seen = await getSeen(accountId);
  if ((seen.threads[threadId] ?? 0) >= lastDate) return;
  seen.threads[threadId] = lastDate;
  await writeJson(seenKey(accountId), seen);
};

export const loadThreadSummaries = async (
  authToken: string,
  accountId: string,
  myName?: string | null
): Promise<ThreadSummary[]> => {
  const threads = (await getMessages(authToken, accountId)) ?? [];
  const cache =
    (await readJson<Record<string, CachedThread>>(cacheKey(accountId))) ?? {};
  const seen = await getSeen(accountId);

  const stale = threads.filter(
    (t) => cache[t.id]?.commentCount !== t.commentCount
  );
  for (let i = 0; i < stale.length; i += FETCH_CONCURRENCY) {
    await Promise.all(
      stale.slice(i, i + FETCH_CONCURRENCY).map(async (thread) => {
        try {
          const comments = await loadComments(authToken, accountId, thread.id);
          cache[thread.id] = summarise(thread, comments ?? [], myName);
        } catch {
          // Leave it uncached; the row falls back to the thread's own details
        }
      })
    );
  }

  // Drop threads that no longer exist so the cache doesn't grow forever
  const next: Record<string, CachedThread> = {};
  threads.forEach((t) => {
    if (cache[t.id]) next[t.id] = cache[t.id];
  });
  await writeJson(cacheKey(accountId), next);

  return threads
    .map((thread) => {
      const cached = next[thread.id];
      const lastDate = cached?.lastDate ?? thread.uploadedDate;
      const lastFromMe = cached?.lastFromMe ?? !thread.fromPIMS;
      const seenAt = Math.max(seen.threads[thread.id] ?? 0, seen.initAt);
      return {
        id: thread.id,
        subject: thread.description,
        participants:
          cached && cached.participants.length > 0
            ? cached.participants
            : [thread.fromPIMS ? thread.uploadedBy || "AAS" : "AAS"],
        lastText: cached?.lastText ?? thread.description,
        lastDate,
        lastFromMe,
        unread: !lastFromMe && lastDate > seenAt,
      };
    })
    .sort((a, b) => b.lastDate - a.lastDate);
};
