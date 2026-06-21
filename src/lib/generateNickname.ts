const ADJECTIVES = [
  "화가난", "잠꾸러기", "신나는", "졸린", "배고픈", "수줍은", "용감한", "게으른",
  "호기심많은", "엉뚱한", "귀여운", "당당한", "소심한", "활발한", "느긋한", "예민한",
  "사려깊은", "장난스러운", "진지한", "깜찍한",
];

const ANIMALS: { name: string; emoji: string }[] = [
  { name: "햄스터", emoji: "🐹" },
  { name: "판다", emoji: "🐼" },
  { name: "코알라", emoji: "🐨" },
  { name: "여우", emoji: "🦊" },
  { name: "늑대", emoji: "🐺" },
  { name: "곰", emoji: "🐻" },
  { name: "돼지", emoji: "🐷" },
  { name: "소", emoji: "🐮" },
  { name: "개구리", emoji: "🐸" },
  { name: "펭귄", emoji: "🐧" },
  { name: "병아리", emoji: "🐥" },
  { name: "올빼미", emoji: "🦉" },
  { name: "독수리", emoji: "🦅" },
  { name: "홍학", emoji: "🦩" },
  { name: "공작", emoji: "🦚" },
  { name: "앵무새", emoji: "🦜" },
  { name: "거북이", emoji: "🐢" },
  { name: "문어", emoji: "🐙" },
  { name: "게", emoji: "🦀" },
  { name: "나비", emoji: "🦋" },
  { name: "고양이", emoji: "🐱" },
  { name: "토끼", emoji: "🐰" },
  { name: "다람쥐", emoji: "🐿️" },
  { name: "말", emoji: "🐴" },
  { name: "유니콘", emoji: "🦄" },
  { name: "돌고래", emoji: "🐬" },
  { name: "고래", emoji: "🐳" },
  { name: "상어", emoji: "🦈" },
  { name: "악어", emoji: "🐊" },
  { name: "공룡", emoji: "🦕" },
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal.name} ${animal.emoji}`;
}
