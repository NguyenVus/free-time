/**
 * HaikuData.ts
 * Poetic Haiku verses celebrating Cherry Blossoms (Sakura),
 * translated into evocative Vietnamese with Japanese originals & poet names.
 */

export interface HaikuPoem {
  lines: string[];
  japanese: string;
  author: string;
}

export const SAKURA_HAIKUS: HaikuPoem[] = [
  {
    lines: [
      "Hoa đào rụng rơi",
      "Như tuyết bay trong gió sớm",
      "Vấn vương lòng người"
    ],
    japanese: "花散りて また咲く春を 待つ心",
    author: "Yosa Buson (与謝蕪村)"
  },
  {
    lines: [
      "Dưới bóng hoa anh đào",
      "Chẳng ai là người xa lạ",
      "Trong buổi chiều xuân"
    ],
    japanese: "花の陰 あかの他人は なかりけり",
    author: "Kobayashi Issa (小林一茶)"
  },
  {
    lines: [
      "Chuông chùa ngân tiếng vẳng",
      "Hoa anh đào rực rỡ buông lơi",
      "Chiều lắng êm đềm"
    ],
    japanese: "鐘消えて 花の香は鐘く 夕べ哉",
    author: "Matsuo Bashō (松尾芭蕉)"
  },
  {
    lines: [
      "Gió xuân thổi qua vườn vắng",
      "Mặt hồ gợn ngàn sóng nhỏ",
      "Cánh hồng xuôi dòng trôi"
    ],
    japanese: "春風や 水に落ちたる 花の影",
    author: "Masaoka Shiki (正岡子規)"
  },
  {
    lines: [
      "Một thoáng trần gian",
      "Ngắm ngàn cánh hoa đào rơi",
      "Đẹp tựa chiêm bao"
    ],
    japanese: "世の中は 三日見ぬ間に 桜かな",
    author: "Ryōkan Taigu (良寛大愚)"
  },
  {
    lines: [
      "Đêm xuân trăng thanh tỏ",
      "Hương hoa anh đào theo gió",
      "Thấm đẫm tâm hồn"
    ],
    japanese: "春の夜や 桜に匂ふ 月の影",
    author: "Chiyo-ni (千代尼)"
  }
];
