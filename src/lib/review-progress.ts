export type ReviewPair = { reviewerId: string; revieweeId: string };

export function calculateReviewProgress({ viewerId, participantIds, reviews, reviewDueAt, now = new Date() }: { viewerId: string; participantIds: string[]; reviews: ReviewPair[]; reviewDueAt: Date | null; now?: Date }) {
  const participants = [...new Set(participantIds)];
  const pairs = reviews.filter((review) => participants.includes(review.reviewerId) && participants.includes(review.revieweeId) && review.reviewerId !== review.revieweeId);
  const submitted = new Set(pairs.map((review) => `${review.reviewerId}:${review.revieweeId}`));
  const totalForCurrentUser = participants.filter((id) => id !== viewerId).length;
  const completedForCurrentUser = participants.filter((id) => id !== viewerId && submitted.has(`${viewerId}:${id}`)).length;
  const expectedReviewCount = participants.length * Math.max(0, participants.length - 1);
  return {
    completedReviewCount: pairs.length,
    expectedReviewCount,
    completedForCurrentUser,
    totalForCurrentUser,
    reviewDueAt: reviewDueAt?.toISOString() ?? null,
    overdue: Boolean(reviewDueAt && reviewDueAt.getTime() <= now.getTime() && pairs.length < expectedReviewCount),
  };
}

export function pendingReviewRecipients(participantIds: string[], reviews: ReviewPair[]) {
  const participants = [...new Set(participantIds)];
  const submitted = new Set(reviews.map((review) => `${review.reviewerId}:${review.revieweeId}`));
  return participants.filter((reviewerId) => participants.some((revieweeId) => reviewerId !== revieweeId && !submitted.has(`${reviewerId}:${revieweeId}`)));
}
