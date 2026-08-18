export const AGE_RANGE_OPTIONS = ["18-24", "25-34", "35-44", "45+", "不公開"] as const;
export type AgeRange = (typeof AGE_RANGE_OPTIONS)[number];

export type TrustProfile = {
  authSubject?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  gender?: "woman" | "man" | "non_binary" | "prefer_not_to_say" | null;
  ageRange?: string | null;
  interestTags?: string[] | null;
  preferredArea?: string | null;
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected" | null;
};

const profileSignals = (profile: TrustProfile) => [
  { key: "avatar", label: "公開頭像", complete: Boolean(profile.avatarUrl) },
  { key: "bio", label: "自我介紹", complete: (profile.bio?.trim().length ?? 0) >= 12 },
  { key: "ageRange", label: "年齡區間", complete: Boolean(profile.ageRange) },
  { key: "interests", label: "興趣標籤", complete: (profile.interestTags?.length ?? 0) > 0 },
  { key: "area", label: "常用活動區域", complete: Boolean(profile.preferredArea?.trim()) },
  { key: "gender", label: "性別公開偏好", complete: Boolean(profile.gender && profile.gender !== "prefer_not_to_say") },
];

export function calculateProfileTrust(profile: TrustProfile) {
  const signals = profileSignals(profile);
  const completed = signals.filter((signal) => signal.complete);
  const completionPercent = Math.round((completed.length / signals.length) * 100);
  const missingFields = signals.filter((signal) => !signal.complete).map((signal) => signal.label);
  const verificationLabel = profile.verificationStatus === "verified" ? "已驗證" : profile.verificationStatus === "pending" ? "驗證審核中" : "尚未驗證";
  const isMockAccount = profile.authSubject?.startsWith("mock-email-otp:") ?? false;
  const requiredMissing = signals.filter((signal) => ["avatar", "bio", "ageRange", "interests"].includes(signal.key) && !signal.complete).map((signal) => signal.label);
  return {
    completionPercent,
    completedCount: completed.length,
    totalCount: signals.length,
    missingFields,
    requiredMissing,
    verificationLabel,
    isMockAccount,
    canApply: isMockAccount || requiredMissing.length === 0,
    signals: signals.map(({ key, label, complete }) => ({ key, label, complete })),
  };
}
