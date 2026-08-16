export type ReviewTaskEvent = { id: string; hostId: string };
export type ReviewTaskPeer = { id: string; displayName: string; avatarUrl: string | null };
export type ReviewTaskCandidate = { event: ReviewTaskEvent; peer: ReviewTaskPeer };

/**
 * Hosts may not have an event_attendances row because attendance is created at
 * application approval.  A completed hosted event is nevertheless eligible for
 * mutual reviews, so we build targets from both attendance peers and the host.
 */
export function pendingReviewTasks({
  userId,
  candidates,
  submittedKeys,
}: {
  userId: string;
  candidates: ReviewTaskCandidate[];
  submittedKeys: Set<string>;
}) {
  const seen = new Set<string>();
  return candidates.filter(({ event, peer }) => {
    const key = `${event.id}:${peer.id}`;
    if (peer.id === userId || submittedKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
