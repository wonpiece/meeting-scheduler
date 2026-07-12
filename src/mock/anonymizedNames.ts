/** 특정 회사가 연상되지 않도록 가상의 이름 풀 */
export const ANONYMIZED_FIRST_NAMES = [
  "리오", "에이든", "민수", "지은", "하늘", "소라", "준호", "유나",
  "태민", "서연", "도윤", "지아", "현우", "수빈", "건", "나래",
];

export function personFirstName(fullName: string) {
  return fullName.length > 1 ? fullName.slice(1) : fullName;
}

export function buildOneOnOneTitle(selfName: string, peerName: string) {
  return `${peerName} / ${selfName} 1:1`;
}

export function pickPeerName(exclude: string[], random: () => number) {
  const pool = ANONYMIZED_FIRST_NAMES.filter((name) => !exclude.includes(name));
  if (pool.length === 0) return ANONYMIZED_FIRST_NAMES[0];
  return pool[Math.floor(random() * pool.length) % pool.length];
}
