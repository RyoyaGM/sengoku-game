// src/data/daimyos.js

export const DAIMYO_INFO = {
  // --- 主要大名 ---
  Oda: { name: '織田', color: 'bg-red-600', fill: '#dc2626', text: 'text-white', difficulty: '中', strategy: 'aggressive', targetProvince: 'kyoto', homeProvinceId: 'kiyosu' },
  Takeda: { name: '武田', color: 'bg-orange-600', fill: '#ea580c', text: 'text-white', difficulty: '易', strategy: 'aggressive', targetProvince: 'kyoto', homeProvinceId: 'kai' },
  Uesugi: { name: '上杉', color: 'bg-blue-600', fill: '#2563eb', text: 'text-white', difficulty: '易', strategy: 'aggressive', targetProvince: 'kyoto', homeProvinceId: 'kasugayama' },
  Hojo: { name: '北条', color: 'bg-yellow-500', fill: '#eab308', text: 'text-black', difficulty: '易', strategy: 'aggressive', targetProvince: 'umayabashi', homeProvinceId: 'odawara' },
  Mori: { name: '毛利', color: 'bg-emerald-600', fill: '#059669', text: 'text-white', difficulty: '易', strategy: 'aggressive', targetProvince: 'kyoto', homeProvinceId: 'yoshida-koriyama' },
  Shimazu: { name: '島津', color: 'bg-rose-900', fill: '#881337', text: 'text-white', difficulty: '中', strategy: 'aggressive', targetProvince: 'hakata', homeProvinceId: 'satsuma' },
  Date: { name: '伊達', color: 'bg-green-600', fill: '#16a34a', text: 'text-white', difficulty: '中', strategy: 'aggressive', targetProvince: 'kurokawa', homeProvinceId: 'yonezawa' },
  Miyoshi: { name: '三好', color: 'bg-purple-500', fill: '#a855f7', text: 'text-white', difficulty: '易', strategy: 'aggressive', targetProvince: 'kyoto', homeProvinceId: 'koshimizu' },
  Otomo: { name: '大友', color: 'bg-yellow-600', fill: '#ca8a04', text: 'text-white', difficulty: '中', strategy: 'aggressive', targetProvince: 'hakata', homeProvinceId: 'funai' },

  // --- 実力者 ---
  Tokugawa: { name: '松平', color: 'bg-blue-800', fill: '#1e40af', text: 'text-white', difficulty: '難', strategy: 'balanced', targetProvince: 'kyoto', homeProvinceId: 'okazaki' },
  Imagawa: { name: '今川', color: 'bg-emerald-800', fill: '#065f46', text: 'text-white', difficulty: '中', strategy: 'balanced', targetProvince: 'kyoto', homeProvinceId: 'sunpu' },
  Honganji: { name: '本願寺', color: 'bg-orange-300', fill: '#fdba74', text: 'text-black', difficulty: '中', strategy: 'defensive', homeProvinceId: 'ishiyama' },
  Ryuzoji: { name: '龍造寺', color: 'bg-red-800', fill: '#991b1b', text: 'text-white', difficulty: '中', strategy: 'aggressive', targetProvince: 'hakata', homeProvinceId: 'saga' },
  Chosokabe: { name: '長曾我部', color: 'bg-purple-700', fill: '#7e22ce', text: 'text-white', difficulty: '中', strategy: 'aggressive', targetProvince: 'imabari', homeProvinceId: 'kochi' },
  Satake: { name: '佐竹', color: 'bg-red-900', fill: '#7f1d1d', text: 'text-white', difficulty: '中', strategy: 'balanced', homeProvinceId: 'mito' },
  Ukita: { name: '宇喜多', color: 'bg-yellow-300', fill: '#fde047', text: 'text-black', difficulty: '中', strategy: 'balanced', homeProvinceId: 'okayama' },
  Rokkaku: { name: '六角', color: 'bg-indigo-400', fill: '#818cf8', text: 'text-white', difficulty: '中', strategy: 'defensive', homeProvinceId: 'azuchi' },
  Asakura: { name: '朝倉', color: 'bg-cyan-700', fill: '#0e7490', text: 'text-white', difficulty: '中', strategy: 'defensive', homeProvinceId: 'ichijodani' },

  // --- その他大名 ---
  Ashikaga: { name: '足利', color: 'bg-slate-800', fill: '#1e293b', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'kyoto' },
  Kakizaki: { name: '蠣崎', color: 'bg-teal-700', fill: '#0f766e', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'matsumae' },
  Ainu: { name: 'アイヌ', color: 'bg-stone-500', fill: '#78716c', text: 'text-white', difficulty: '特殊', strategy: 'ainu', homeProvinceId: 'ishikari_ainu' },
  Nanbu: { name: '南部', color: 'bg-indigo-300', fill: '#a5b4fc', text: 'text-black', difficulty: '中', strategy: 'balanced', homeProvinceId: 'sannohe' },
  Ando: { name: '安東', color: 'bg-cyan-800', fill: '#155e75', text: 'text-white', difficulty: '中', strategy: 'balanced', homeProvinceId: 'akita' },
  Onodera: { name: '小野寺', color: 'bg-stone-600', fill: '#57534e', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'yokote' },
  Daihoji: { name: '大宝寺', color: 'bg-yellow-700', fill: '#a16207', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'oura' },
  Mogami: { name: '最上', color: 'bg-teal-400', fill: '#2dd4bf', text: 'text-black', difficulty: '中', strategy: 'balanced', homeProvinceId: 'yamagata' },
  Ashina: { name: '蘆名', color: 'bg-gray-700', fill: '#374151', text: 'text-white', difficulty: '難', strategy: 'balanced', homeProvinceId: 'kurokawa' },
  Iwaki: { name: '岩城', color: 'bg-orange-400', fill: '#fb923c', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'iwaki' },
  Yuki_S: { name: '白河結城', color: 'bg-stone-400', fill: '#a8a29e', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'shirakawa' },
  
  Kasai: { name: '葛西', color: 'bg-emerald-500', fill: '#10b981', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'teraike' },
  Soma: { name: '相馬', color: 'bg-yellow-600', fill: '#ca8a04', text: 'text-white', difficulty: '難', strategy: 'balanced', homeProvinceId: 'odaka' },
  Bessho: { name: '別所', color: 'bg-red-400', fill: '#f87171', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'miki' },

  Nasu: { name: '那須', color: 'bg-amber-200', fill: '#fde68a', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'nasu' },
  Utsunomiya: { name: '宇都宮', color: 'bg-amber-600', fill: '#d97706', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'utsunomiya' },
  Chiba: { name: '千葉', color: 'bg-blue-400', fill: '#60a5fa', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'sakura' },
  Uesugi_N: { name: '山内上杉', color: 'bg-blue-300', fill: '#93c5fd', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'umayabashi' },
  Satomi: { name: '里見', color: 'bg-pink-500', fill: '#ec4899', text: 'text-white', difficulty: '中', strategy: 'balanced', homeProvinceId: 'awa_boso' },

  Honma: { name: '本間', color: 'bg-gray-500', fill: '#6b7280', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'sado' },
  Jinbo: { name: '神保', color: 'bg-blue-200', fill: '#bfdbfe', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'toyama' },
  Hatakeyama: { name: '畠山', color: 'bg-sky-600', fill: '#0284c7', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'noto' },
  Takeda_W: { name: '若狭武田', color: 'bg-orange-300', fill: '#fdba74', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'obama' },
  Anegakoji: { name: '姉小路', color: 'bg-pink-300', fill: '#f9a8d4', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'hida' },
  Kiso: { name: '木曽', color: 'bg-stone-500', fill: '#57534e', text: 'text-white', difficulty: '難', strategy: 'defensive' },

  Mizuno: { name: '水野', color: 'bg-cyan-600', fill: '#0891b2', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'chita' },
  Saito: { name: '斎藤', color: 'bg-lime-600', fill: '#65a30d', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'inabayama' },
  Endo: { name: '遠藤', color: 'bg-green-700', fill: '#15803d', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'gujo' },
  Kitabatake: { name: '北畠', color: 'bg-violet-600', fill: '#7c3aed', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'anotsu' },
  Kuki: { name: '九鬼', color: 'bg-blue-900', fill: '#1e3a8a', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'shima' },

  Azai: { name: '浅井', color: 'bg-sky-400', fill: '#38bdf8', text: 'text-black', difficulty: '難', strategy: 'balanced', homeProvinceId: 'odani' },
  Tsutsui: { name: '筒井', color: 'bg-stone-400', fill: '#a8a29e', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'yamato' },
  Saika: { name: '雑賀', color: 'bg-green-800', fill: '#166534', text: 'text-white', difficulty: '中', strategy: 'balanced', homeProvinceId: 'wakayama' },
  Merchant: { name: '会合衆', color: 'bg-yellow-200', fill: '#fef08a', text: 'text-black', difficulty: '-', strategy: 'defensive', homeProvinceId: 'sakai' },
  Hatano: { name: '波多野', color: 'bg-lime-700', fill: '#4d7c0f', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'sasayama' },
  Isshiki: { name: '一色', color: 'bg-emerald-400', fill: '#34d399', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'miyazu' },

  Akamatsu: { name: '赤松', color: 'bg-rose-300', fill: '#fda4af', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'harima' },
  Yamana: { name: '山名', color: 'bg-amber-700', fill: '#b45309', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'toyooka' },
  Mimura: { name: '三村', color: 'bg-indigo-700', fill: '#4338ca', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'niimi' },
  Amago: { name: '尼子', color: 'bg-indigo-600', fill: '#4f46e5', text: 'text-white', difficulty: '難', strategy: 'aggressive', homeProvinceId: 'gassan-toda' },
  Ouchi: { name: '大内', color: 'bg-rose-500', fill: '#f43f5e', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'hagi' }, // 初期は毛利領だが旧領として設定
  Kono: { name: '河野', color: 'bg-blue-300', fill: '#93c5fd', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'imabari' },
  Ichijo: { name: '一条', color: 'bg-purple-300', fill: '#d8b4fe', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'shimanto' },

  Matsuura: { name: '松浦', color: 'bg-cyan-400', fill: '#22d3ee', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'matsuura' },
  Arima: { name: '有馬', color: 'bg-red-400', fill: '#f87171', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'arima' },
  Aso: { name: '阿蘇', color: 'bg-red-300', fill: '#fca5a5', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'asou' },
  Ida: { name: '井田', color: 'bg-gray-400', fill: '#9ca3af', text: 'text-black', difficulty: '難', strategy: 'defensive', homeProvinceId: 'kumamoto' },
  Sagara: { name: '相良', color: 'bg-teal-500', fill: '#14b8a6', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'hitoyoshi' },
  Ito: { name: '伊東', color: 'bg-cyan-500', fill: '#06b6d4', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'obi' },
  Tanegashima: { name: '種子島', color: 'bg-orange-500', fill: '#f97316', text: 'text-white', difficulty: '難', strategy: 'balanced', homeProvinceId: 'tanegashima' },
  Ryukyu_Sho: { name: '第二尚氏', color: 'bg-teal-500', fill: '#14b8a6', text: 'text-white', difficulty: '易', strategy: 'defensive', homeProvinceId: 'amami' },
  So: { name: '宗', color: 'bg-indigo-500', fill: '#6366f1', text: 'text-white', difficulty: '難', strategy: 'defensive', homeProvinceId: 'tsushima' },
  Sho: { name: '尚', color: 'bg-teal-600', fill: '#0d9488', text: 'text-white', difficulty: '易', strategy: 'defensive', homeProvinceId: 'shuri' },

  Minor: { name: '諸勢力', color: 'bg-stone-300', fill: '#d6d3d1', text: 'text-black', difficulty: '-', strategy: 'defensive' },
};

export const TITLES = [
  { id: 'shogun', name: '征夷大将軍', fameBonus: 300, reqProvinces: 15, reqRegion: ['kyoto'], reqDonation: 5000 },
  { id: 'kanrei', name: '管領', fameBonus: 100, reqProvinces: 5, reqRegion: ['kyoto', 'ishiyama', 'azuchi'], reqDonation: 2000 },
  { id: 'kanto_kanrei', name: '関東管領', fameBonus: 80, reqProvinces: 4, reqRegion: ['umayabashi', 'kawagoe', 'odawara'], reqDonation: 1000 },
  { id: 'oshu_tandai', name: '奥州探題', fameBonus: 50, reqProvinces: 2, reqRegion: ['nakaniida', 'kozukata', 'matsumae'], reqDonation: 800 },
  { id: 'kyushu_tandai', name: '九州探題', fameBonus: 60, reqProvinces: 4, reqRegion: ['hakata', 'funai', 'saga', 'satsuma'], reqDonation: 1500 },
  { id: 'ryukyu_king', name: '琉球王', fameBonus: 50, reqProvinces: 1, reqRegion: ['shuri'], reqDonation: 0, reqFame: 50 },
];

export const COURT_RANKS = [
  { id: 'jugoi_ge', name: '従五位下', fameBonus: 10, reqProvinces: 2, reqDonation: 1000, waiverDonation: 5000 },
  { id: 'jugoi_jo', name: '従五位上', fameBonus: 40, reqProvinces: 4, reqDonation: 3000, waiverDonation: 10000 },
  { id: 'jushii_ge', name: '従四位下', fameBonus: 40, reqProvinces: 8, reqDonation: 8000, waiverDonation: 20000 },
  { id: 'jushii_jo', name: '従四位上', fameBonus: 60, reqProvinces: 12, reqDonation: 15000, waiverDonation: 35000 },
  { id: 'jusanmi', name: '従三位', fameBonus: 80, reqProvinces: 16, reqDonation: 25000, waiverDonation: 50000 },
  { id: 'shonii', name: '正二位', fameBonus: 150, reqProvinces: 25, reqDonation: 50000, waiverDonation: 100000 },
];

export const HISTORICAL_FAME = {
    Ashikaga: 600, Kitabatake: 200, Ouchi: 180, Imagawa: 180, Hojo: 150, Uesugi: 150, Takeda: 140, Mori: 130, Otomo: 120, Shimazu: 120, Rokkaku: 110, Asakura: 110, Honganji: 100, Miyoshi: 100, Oda: 40, Tokugawa: 30, Minor: 0, Merchant: 500
};