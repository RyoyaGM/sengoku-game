// src/data/daimyos.js

export const DAIMYO_INFO = {
  // --- 主要大名 (天下を狙う好戦派) ---
  Oda: { name: '織田', color: 'bg-red-600', fill: '#dc2626', text: 'text-white', difficulty: '中', strategy: 'aggressive' },
  Takeda: { name: '武田', color: 'bg-orange-600', fill: '#ea580c', text: 'text-white', difficulty: '易', strategy: 'aggressive' },
  Uesugi: { name: '上杉', color: 'bg-blue-600', fill: '#2563eb', text: 'text-white', difficulty: '易', strategy: 'aggressive' },
  Hojo: { name: '北条', color: 'bg-yellow-500', fill: '#eab308', text: 'text-black', difficulty: '易', strategy: 'aggressive' },
  Mori: { name: '毛利', color: 'bg-emerald-600', fill: '#059669', text: 'text-white', difficulty: '易', strategy: 'aggressive' },
  Shimazu: { name: '島津', color: 'bg-rose-900', fill: '#881337', text: 'text-white', difficulty: '中', strategy: 'aggressive' },
  Date: { name: '伊達', color: 'bg-green-600', fill: '#16a34a', text: 'text-white', difficulty: '中', strategy: 'aggressive' },
  Miyoshi: { name: '三好', color: 'bg-purple-500', fill: '#a855f7', text: 'text-white', difficulty: '易', strategy: 'aggressive' },
  Otomo: { name: '大友', color: 'bg-yellow-600', fill: '#ca8a04', text: 'text-white', difficulty: '中', strategy: 'aggressive' },

  // --- 実力者 (バランス型) ---
  Tokugawa: { name: '松平', color: 'bg-blue-800', fill: '#1e40af', text: 'text-white', difficulty: '難', strategy: 'balanced' },
  Imagawa: { name: '今川', color: 'bg-emerald-800', fill: '#065f46', text: 'text-white', difficulty: '中', strategy: 'balanced' },
  Honganji: { name: '本願寺', color: 'bg-orange-300', fill: '#fdba74', text: 'text-black', difficulty: '中', strategy: 'defensive' }, // 守備重視
  Ryuzoji: { name: '龍造寺', color: 'bg-red-800', fill: '#991b1b', text: 'text-white', difficulty: '中', strategy: 'aggressive' },
  Chosokabe: { name: '長曾我部', color: 'bg-purple-700', fill: '#7e22ce', text: 'text-white', difficulty: '中', strategy: 'aggressive' },
  Satake: { name: '佐竹', color: 'bg-red-900', fill: '#7f1d1d', text: 'text-white', difficulty: '中', strategy: 'balanced' },
  Ukita: { name: '宇喜多', color: 'bg-yellow-300', fill: '#fde047', text: 'text-black', difficulty: '中', strategy: 'balanced' },
  Rokkaku: { name: '六角', color: 'bg-indigo-400', fill: '#818cf8', text: 'text-white', difficulty: '中', strategy: 'defensive' },
  Asakura: { name: '朝倉', color: 'bg-cyan-700', fill: '#0e7490', text: 'text-white', difficulty: '中', strategy: 'defensive' },

  // --- その他大名 (守勢・消極的) ---
  Ashikaga: { name: '足利', color: 'bg-slate-800', fill: '#1e293b', text: 'text-white', difficulty: '難', strategy: 'defensive' }, // 将軍家は守り
  Kakizaki: { name: '蠣崎', color: 'bg-teal-700', fill: '#0f766e', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Ainu: { name: 'アイヌ', color: 'bg-stone-500', fill: '#78716c', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Nanbu: { name: '南部', color: 'bg-indigo-300', fill: '#a5b4fc', text: 'text-black', difficulty: '中', strategy: 'balanced' },
  Ando: { name: '安東', color: 'bg-cyan-800', fill: '#155e75', text: 'text-white', difficulty: '中', strategy: 'balanced' },
  Onodera: { name: '小野寺', color: 'bg-stone-600', fill: '#57534e', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Daihoji: { name: '大宝寺', color: 'bg-yellow-700', fill: '#a16207', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Mogami: { name: '最上', color: 'bg-teal-400', fill: '#2dd4bf', text: 'text-black', difficulty: '中', strategy: 'balanced' },
  Ashina: { name: '蘆名', color: 'bg-gray-700', fill: '#374151', text: 'text-white', difficulty: '難', strategy: 'balanced' },
  Iwaki: { name: '岩城', color: 'bg-orange-400', fill: '#fb923c', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Yuki_S: { name: '白河結城', color: 'bg-stone-400', fill: '#a8a29e', text: 'text-black', difficulty: '難', strategy: 'defensive' },

  Nasu: { name: '那須', color: 'bg-amber-200', fill: '#fde68a', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Utsunomiya: { name: '宇都宮', color: 'bg-amber-600', fill: '#d97706', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Chiba: { name: '千葉', color: 'bg-blue-400', fill: '#60a5fa', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Uesugi_N: { name: '山内上杉', color: 'bg-blue-300', fill: '#93c5fd', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Satomi: { name: '里見', color: 'bg-pink-500', fill: '#ec4899', text: 'text-white', difficulty: '中', strategy: 'balanced' },

  Honma: { name: '本間', color: 'bg-gray-500', fill: '#6b7280', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Jinbo: { name: '神保', color: 'bg-blue-200', fill: '#bfdbfe', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Hatakeyama: { name: '畠山', color: 'bg-sky-600', fill: '#0284c7', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Takeda_W: { name: '若狭武田', color: 'bg-orange-300', fill: '#fdba74', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Anegakoji: { name: '姉小路', color: 'bg-pink-300', fill: '#f9a8d4', text: 'text-black', difficulty: '難', strategy: 'defensive' },

  Mizuno: { name: '水野', color: 'bg-cyan-600', fill: '#0891b2', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Saito: { name: '斎藤', color: 'bg-lime-600', fill: '#65a30d', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Endo: { name: '遠藤', color: 'bg-green-700', fill: '#15803d', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Kitabatake: { name: '北畠', color: 'bg-violet-600', fill: '#7c3aed', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Kuki: { name: '九鬼', color: 'bg-blue-900', fill: '#1e3a8a', text: 'text-white', difficulty: '難', strategy: 'defensive' },

  Azai: { name: '浅井', color: 'bg-sky-400', fill: '#38bdf8', text: 'text-black', difficulty: '難', strategy: 'balanced' },
  Tsutsui: { name: '筒井', color: 'bg-stone-400', fill: '#a8a29e', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Saika: { name: '雑賀', color: 'bg-green-800', fill: '#166534', text: 'text-white', difficulty: '中', strategy: 'balanced' },
  Merchant: { name: '会合衆', color: 'bg-yellow-200', fill: '#fef08a', text: 'text-black', difficulty: '-', strategy: 'defensive' },
  Hatano: { name: '波多野', color: 'bg-lime-700', fill: '#4d7c0f', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Isshiki: { name: '一色', color: 'bg-emerald-400', fill: '#34d399', text: 'text-black', difficulty: '難', strategy: 'defensive' },

  Akamatsu: { name: '赤松', color: 'bg-rose-300', fill: '#fda4af', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Yamana: { name: '山名', color: 'bg-amber-700', fill: '#b45309', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Mimura: { name: '三村', color: 'bg-indigo-700', fill: '#4338ca', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Amago: { name: '尼子', color: 'bg-indigo-600', fill: '#4f46e5', text: 'text-white', difficulty: '難', strategy: 'aggressive' }, // 尼子は再興を目指し好戦的
  Ouchi: { name: '大内', color: 'bg-rose-500', fill: '#f43f5e', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Kono: { name: '河野', color: 'bg-blue-300', fill: '#93c5fd', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Ichijo: { name: '一条', color: 'bg-purple-300', fill: '#d8b4fe', text: 'text-black', difficulty: '難', strategy: 'defensive' },

  Matsuura: { name: '松浦', color: 'bg-cyan-400', fill: '#22d3ee', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Arima: { name: '有馬', color: 'bg-red-400', fill: '#f87171', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Aso: { name: '阿蘇', color: 'bg-red-300', fill: '#fca5a5', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Ida: { name: '井田', color: 'bg-gray-400', fill: '#9ca3af', text: 'text-black', difficulty: '難', strategy: 'defensive' },
  Sagara: { name: '相良', color: 'bg-teal-500', fill: '#14b8a6', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Ito: { name: '伊東', color: 'bg-cyan-500', fill: '#06b6d4', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Tanegashima: { name: '種子島', color: 'bg-orange-500', fill: '#f97316', text: 'text-white', difficulty: '難', strategy: 'balanced' },
  Ryukyu_Sho: { name: '第二尚氏', color: 'bg-teal-500', fill: '#14b8a6', text: 'text-white', difficulty: '易', strategy: 'defensive' },
  So: { name: '宗', color: 'bg-indigo-500', fill: '#6366f1', text: 'text-white', difficulty: '難', strategy: 'defensive' },
  Sho: { name: '尚', color: 'bg-teal-600', fill: '#0d9488', text: 'text-white', difficulty: '易', strategy: 'defensive' },

  Minor: { name: '諸勢力', color: 'bg-stone-300', fill: '#d6d3d1', text: 'text-black', difficulty: '-', strategy: 'defensive' },
};

// ... (TITLES, COURT_RANKS, HISTORICAL_FAME は変更なし) ...
export const TITLES = [
  { id: 'shogun', name: '征夷大将軍', fameBonus: 300, reqProvinces: 15, reqRegion: ['kyoto'], reqDonation: 5000 },
  { id: 'kanrei', name: '管領', fameBonus: 100, reqProvinces: 5, reqRegion: ['kyoto', 'ishiyama', 'azuchi'], reqDonation: 2000 },
  { id: 'kanto_kanrei', name: '関東管領', fameBonus: 80, reqProvinces: 4, reqRegion: ['umayabashi', 'kawagoe', 'odawara'], reqDonation: 1000 },
  { id: 'oshu_tandai', name: '奥州探題', fameBonus: 50, reqProvinces: 2, reqRegion: ['rikuzen', 'rikuchu', 'matsumae'], reqDonation: 800 },
  { id: 'kyushu_tandai', name: '九州探題', fameBonus: 60, reqProvinces: 4, reqRegion: ['hakata', 'funai', 'saga', 'kagoshima'], reqDonation: 1500 },
  { id: 'ryukyu_king', name: '琉球王', fameBonus: 50, reqProvinces: 1, reqRegion: ['shuri'], reqDonation: 0, reqFame: 50 },
];

export const COURT_RANKS = [
  { id: 'jugoi_ge', name: '従五位下', fameBonus: 10, reqProvinces: 2, reqDonation: 1000, waiverDonation: 5000 },
  { id: 'jugoi_jo', name: '従五位上', fameBonus: 20, reqProvinces: 4, reqDonation: 3000, waiverDonation: 10000 },
  { id: 'jushii_ge', name: '従四位下', fameBonus: 40, reqProvinces: 8, reqDonation: 8000, waiverDonation: 20000 },
  { id: 'jushii_jo', name: '従四位上', fameBonus: 60, reqProvinces: 12, reqDonation: 15000, waiverDonation: 35000 },
  { id: 'jusanmi', name: '従三位', fameBonus: 80, reqProvinces: 16, reqDonation: 25000, waiverDonation: 50000 },
  { id: 'shonii', name: '正二位', fameBonus: 150, reqProvinces: 25, reqDonation: 50000, waiverDonation: 100000 },
];

export const HISTORICAL_FAME = {
    Ashikaga: 600, Kitabatake: 200, Ouchi: 180, Imagawa: 180, Hojo: 150, Uesugi: 150, Takeda: 140, Mori: 130, Otomo: 120, Shimazu: 120, Rokkaku: 110, Asakura: 110, Honganji: 100, Miyoshi: 100, Oda: 40, Tokugawa: 30, Minor: 0, Merchant: 500
};
