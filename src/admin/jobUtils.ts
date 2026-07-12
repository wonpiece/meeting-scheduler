export interface Job {
  id: string;
  name: string;
  short: string;
}

/** 기본 제공 직무 축약명 */
export const DEFAULT_JOB_SHORTS: Record<string, string> = {
  "Product Manager": "PM",
  "Product Designer": "PD",
  "Operations Manager": "OM",
  Frontend: "FE",
  Backend: "BE",
  "Business Development Manager": "BDM",
};

/** 영어 직무명 → 축약명 자동 생성 (알려진 직무는 고정 매핑) */
export function inferJobShort(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "NEW";

  const known = DEFAULT_JOB_SHORTS[trimmed];
  if (known) return known;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && /^[A-Za-z]/.test(trimmed)) {
    return words
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 5);
  }

  if (/^[A-Za-z]/.test(trimmed)) {
    return trimmed.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "NEW";
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function createJob(name = "New Role"): Job {
  return {
    id: `job-${Date.now()}`,
    name,
    short: inferJobShort(name),
  };
}

export function resolveJobShort(jobs: Job[], roleName: string) {
  return jobs.find((job) => job.name === roleName)?.short ?? inferJobShort(roleName);
}
