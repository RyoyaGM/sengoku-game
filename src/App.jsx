import React, { useState, useEffect, useRef, useMemo } from 'react';

import { Sword, Shield, ScrollText, RefreshCw, Trophy, Skull, Coins, Wheat, Hammer, Sprout, ArrowRightCircle, ZoomIn, ZoomOut, Move, BrickWall, Ship, Crown, Handshake, MessageCircle, Users, XCircle, Star, Scale, HeartHandshake, Scroll, Gift, Dumbbell, Smile, Flag, Hourglass, History, Activity, Map as MapIcon, ChevronRight, Target, Eye, Landmark, Zap } from 'lucide-react';



// --- 定数・ヘルパー関数 ---



const getFormattedDate = (turn) => {

  const startYear = 1560;

  const elapsedYears = Math.floor((turn - 1) / 4);

  const seasonIdx = (turn - 1) % 4;

  const seasons = ['春', '夏', '秋', '冬'];

  return `${startYear + elapsedYears}年 ${seasons[seasonIdx]}`;

};



const getRiceMarketPrice = (turn) => {

  const seasonIdx = (turn - 1) % 4;

  const prices = [1.5, 2.0, 0.6, 1.0]; // 春, 夏, 秋, 冬

  return prices[seasonIdx] || 1.0;

};



const getDistance = (p1, p2) => {

    return Math.sqrt(Math.pow(p1.cx - p2.cx, 2) + Math.pow(p1.cy - p2.cy, 2));

};



// コスト定義（action: 1 は行動力消費あり、0 はなし）

const COSTS = {

  // 内政

  develop: { gold: 100, rice: 0, boost: 10, action: 1 },

  cultivate: { gold: 50, rice: 50, boost: 10, action: 1 },

  pacify: { gold: 50, rice: 100, boost: 15, action: 1 },

  fortify: { gold: 80, rice: 0, boost: 10, action: 1 },

  market: { gold: 0, rice: 0, action: 0 }, // 楽市楽座はフリーアクション

  trade: { gold: 200, rice: 0, action: 1 }, // 貿易は実行時消費



  // 軍事

  recruit: { gold: 30, rice: 50, troops: 100, action: 1 },

  train: { gold: 30, rice: 0, boost: 5, action: 1 },

  attack: { gold: 20, rice: 80, action: 1 },

  move: { gold: 10, rice: 10, action: 1 },



  // 外交・名声

  donate: { gold: 0, rice: 0, action: 1 }, // 献金は実行時消費

  title_app: { gold: 1000, action: 1 },

  rank_app: { gold: 500, action: 1 },

  titles_check: { gold: 0, action: 0 }, // 確認だけならタダ

  alliance: { gold: 500, action: 1 },

  negotiate: { gold: 0, action: 1 }, // 交渉実行時消費

  gift: { gold: 200, favor: 10, action: 1 },

  coalition: { gold: 800, fameReq: 100, action: 1 },

};



// ID変更に伴い海路は一旦リセット（隣接定義で線は繋がります）

const SEA_ROUTES = [

    ['usukeshi', 'tsugaru'], ['awa_boso', 'misaki'], // 一部例

];



const DAIMYO_INFO = {

  // --- 主要大名 ---

  Oda: { name: '織田', color: 'bg-red-600', fill: '#dc2626', text: 'text-white', difficulty: '中' },

  Ashikaga: { name: '足利', color: 'bg-slate-800', fill: '#1e293b', text: 'text-white', difficulty: '難' },

  Takeda: { name: '武田', color: 'bg-orange-600', fill: '#ea580c', text: 'text-white', difficulty: '易' },

  Uesugi: { name: '上杉', color: 'bg-blue-600', fill: '#2563eb', text: 'text-white', difficulty: '易' },

  Hojo: { name: '北条', color: 'bg-yellow-500', fill: '#eab308', text: 'text-black', difficulty: '易' },

  Mori: { name: '毛利', color: 'bg-emerald-600', fill: '#059669', text: 'text-white', difficulty: '易' },

  Imagawa: { name: '今川', color: 'bg-emerald-800', fill: '#065f46', text: 'text-white', difficulty: '中' },

  Miyoshi: { name: '三好', color: 'bg-purple-500', fill: '#a855f7', text: 'text-white', difficulty: '易' },

  Otomo: { name: '大友', color: 'bg-yellow-600', fill: '#ca8a04', text: 'text-white', difficulty: '中' },

  Shimazu: { name: '島津', color: 'bg-rose-900', fill: '#881337', text: 'text-white', difficulty: '中' },

  Date: { name: '伊達', color: 'bg-green-600', fill: '#16a34a', text: 'text-white', difficulty: '中' },

  Tokugawa: { name: '松平', color: 'bg-blue-800', fill: '#1e40af', text: 'text-white', difficulty: '難' }, // 初期領土なしの可能性あり

  

  // --- その他大名（地域別） ---

  // 北海道・東北

  Kakizaki: { name: '蠣崎', color: 'bg-teal-700', fill: '#0f766e', text: 'text-white', difficulty: '難' },

  Ainu: { name: 'アイヌ', color: 'bg-stone-500', fill: '#78716c', text: 'text-white', difficulty: '難' },

  Nanbu: { name: '南部', color: 'bg-indigo-300', fill: '#a5b4fc', text: 'text-black', difficulty: '中' },

  Ando: { name: '安東', color: 'bg-cyan-800', fill: '#155e75', text: 'text-white', difficulty: '中' },

  Onodera: { name: '小野寺', color: 'bg-stone-600', fill: '#57534e', text: 'text-white', difficulty: '難' },

  Daihoji: { name: '大宝寺', color: 'bg-yellow-700', fill: '#a16207', text: 'text-white', difficulty: '難' },

  Mogami: { name: '最上', color: 'bg-teal-400', fill: '#2dd4bf', text: 'text-black', difficulty: '中' },

  Ashina: { name: '蘆名', color: 'bg-gray-700', fill: '#374151', text: 'text-white', difficulty: '難' },

  Iwaki: { name: '岩城', color: 'bg-orange-400', fill: '#fb923c', text: 'text-black', difficulty: '難' },

  Yuki_S: { name: '白河結城', color: 'bg-stone-400', fill: '#a8a29e', text: 'text-black', difficulty: '難' },



  // 関東

  Nasu: { name: '那須', color: 'bg-amber-200', fill: '#fde68a', text: 'text-black', difficulty: '難' },

  Utsunomiya: { name: '宇都宮', color: 'bg-amber-600', fill: '#d97706', text: 'text-white', difficulty: '難' },

  Satake: { name: '佐竹', color: 'bg-red-900', fill: '#7f1d1d', text: 'text-white', difficulty: '中' },

  Chiba: { name: '千葉', color: 'bg-blue-400', fill: '#60a5fa', text: 'text-black', difficulty: '難' },

  Uesugi_N: { name: '山内上杉', color: 'bg-blue-300', fill: '#93c5fd', text: 'text-black', difficulty: '難' },

  Satomi: { name: '里見', color: 'bg-pink-500', fill: '#ec4899', text: 'text-white', difficulty: '中' },



  // 北陸・甲信

  Honma: { name: '本間', color: 'bg-gray-500', fill: '#6b7280', text: 'text-white', difficulty: '難' },

  Jinbo: { name: '神保', color: 'bg-blue-200', fill: '#bfdbfe', text: 'text-black', difficulty: '難' },

  Hatakeyama: { name: '畠山', color: 'bg-sky-600', fill: '#0284c7', text: 'text-white', difficulty: '難' },

  Honganji: { name: '本願寺', color: 'bg-orange-300', fill: '#fdba74', text: 'text-black', difficulty: '中' },

  Asakura: { name: '朝倉', color: 'bg-cyan-700', fill: '#0e7490', text: 'text-white', difficulty: '中' },

  Takeda_W: { name: '若狭武田', color: 'bg-orange-300', fill: '#fdba74', text: 'text-black', difficulty: '難' },

  Anegakoji: { name: '姉小路', color: 'bg-pink-300', fill: '#f9a8d4', text: 'text-black', difficulty: '難' },



  // 東海

  Mizuno: { name: '水野', color: 'bg-cyan-600', fill: '#0891b2', text: 'text-white', difficulty: '難' },

  Saito: { name: '斎藤', color: 'bg-lime-600', fill: '#65a30d', text: 'text-white', difficulty: '難' },

  Endo: { name: '遠藤', color: 'bg-green-700', fill: '#15803d', text: 'text-white', difficulty: '難' },

  Kitabatake: { name: '北畠', color: 'bg-violet-600', fill: '#7c3aed', text: 'text-white', difficulty: '難' },

  Kuki: { name: '九鬼', color: 'bg-blue-900', fill: '#1e3a8a', text: 'text-white', difficulty: '難' },



  // 畿内

  Azai: { name: '浅井', color: 'bg-sky-400', fill: '#38bdf8', text: 'text-black', difficulty: '難' },

  Rokkaku: { name: '六角', color: 'bg-indigo-400', fill: '#818cf8', text: 'text-white', difficulty: '中' },

  Tsutsui: { name: '筒井', color: 'bg-stone-400', fill: '#a8a29e', text: 'text-black', difficulty: '難' },

  Saika: { name: '雑賀', color: 'bg-green-800', fill: '#166534', text: 'text-white', difficulty: '中' },

  Merchant: { name: '会合衆', color: 'bg-yellow-200', fill: '#fef08a', text: 'text-black', difficulty: '-' },

  Hatano: { name: '波多野', color: 'bg-lime-700', fill: '#4d7c0f', text: 'text-white', difficulty: '難' },

  Isshiki: { name: '一色', color: 'bg-emerald-400', fill: '#34d399', text: 'text-black', difficulty: '難' },



  // 中国・四国

  Akamatsu: { name: '赤松', color: 'bg-rose-300', fill: '#fda4af', text: 'text-black', difficulty: '難' },

  Yamana: { name: '山名', color: 'bg-amber-700', fill: '#b45309', text: 'text-white', difficulty: '難' },

  Mimura: { name: '三村', color: 'bg-indigo-700', fill: '#4338ca', text: 'text-white', difficulty: '難' },

  Ukita: { name: '宇喜多', color: 'bg-yellow-300', fill: '#fde047', text: 'text-black', difficulty: '中' },

  Amago: { name: '尼子', color: 'bg-indigo-600', fill: '#4f46e5', text: 'text-white', difficulty: '難' },

  Ouchi: { name: '大内', color: 'bg-rose-500', fill: '#f43f5e', text: 'text-white', difficulty: '難' }, // データに残存の可能性考慮

  Kono: { name: '河野', color: 'bg-blue-300', fill: '#93c5fd', text: 'text-black', difficulty: '難' },

  Chosokabe: { name: '長曾我部', color: 'bg-purple-700', fill: '#7e22ce', text: 'text-white', difficulty: '中' },

  Ichijo: { name: '一条', color: 'bg-purple-300', fill: '#d8b4fe', text: 'text-black', difficulty: '難' },



  // 九州・沖縄

  Ryuzoji: { name: '龍造寺', color: 'bg-red-800', fill: '#991b1b', text: 'text-white', difficulty: '中' },

  Matsuura: { name: '松浦', color: 'bg-cyan-400', fill: '#22d3ee', text: 'text-black', difficulty: '難' },

  Arima: { name: '有馬', color: 'bg-red-400', fill: '#f87171', text: 'text-black', difficulty: '難' },

  Aso: { name: '阿蘇', color: 'bg-red-300', fill: '#fca5a5', text: 'text-black', difficulty: '難' },

  Ida: { name: '井田', color: 'bg-gray-400', fill: '#9ca3af', text: 'text-black', difficulty: '難' },

  Sagara: { name: '相良', color: 'bg-teal-500', fill: '#14b8a6', text: 'text-white', difficulty: '難' },

  Ito: { name: '伊東', color: 'bg-cyan-500', fill: '#06b6d4', text: 'text-white', difficulty: '難' },

  Tanegashima: { name: '種子島', color: 'bg-orange-500', fill: '#f97316', text: 'text-white', difficulty: '難' },

  Ryukyu_Sho: { name: '第二尚氏', color: 'bg-teal-500', fill: '#14b8a6', text: 'text-white', difficulty: '易' },

  So: { name: '宗', color: 'bg-indigo-500', fill: '#6366f1', text: 'text-white', difficulty: '難' },

  Sho: { name: '尚', color: 'bg-teal-600', fill: '#0d9488', text: 'text-white', difficulty: '易' }, // 旧互換用



  Minor: { name: '諸勢力', color: 'bg-stone-300', fill: '#d6d3d1', text: 'text-black', difficulty: '-' },

};



const TITLES = [

  { id: 'shogun', name: '征夷大将軍', fameBonus: 300, reqProvinces: 15, reqRegion: ['kyoto'], reqDonation: 5000 },

  { id: 'kanrei', name: '管領', fameBonus: 100, reqProvinces: 5, reqRegion: ['kyoto', 'ishiyama', 'azuchi'], reqDonation: 2000 },

  { id: 'kanto_kanrei', name: '関東管領', fameBonus: 80, reqProvinces: 4, reqRegion: ['umayabashi', 'kawagoe', 'odawara'], reqDonation: 1000 },

  { id: 'oshu_tandai', name: '奥州探題', fameBonus: 50, reqProvinces: 2, reqRegion: ['rikuzen', 'rikuchu', 'matsumae'], reqDonation: 800 },

  { id: 'kyushu_tandai', name: '九州探題', fameBonus: 60, reqProvinces: 4, reqRegion: ['hakata', 'funai', 'saga', 'kagoshima'], reqDonation: 1500 },

  { id: 'ryukyu_king', name: '琉球王', fameBonus: 50, reqProvinces: 1, reqRegion: ['shuri'], reqDonation: 0, reqFame: 50 },

];



const COURT_RANKS = [

  { id: 'jugoi_ge', name: '従五位下', fameBonus: 10, reqProvinces: 2, reqDonation: 1000, waiverDonation: 5000 },

  { id: 'jugoi_jo', name: '従五位上', fameBonus: 20, reqProvinces: 4, reqDonation: 3000, waiverDonation: 10000 },

  { id: 'jushii_ge', name: '従四位下', fameBonus: 40, reqProvinces: 8, reqDonation: 8000, waiverDonation: 20000 },

  { id: 'jushii_jo', name: '従四位上', fameBonus: 60, reqProvinces: 12, reqDonation: 15000, waiverDonation: 35000 },

  { id: 'jusanmi', name: '従三位', fameBonus: 80, reqProvinces: 16, reqDonation: 25000, waiverDonation: 50000 },

  { id: 'shonii', name: '正二位', fameBonus: 150, reqProvinces: 25, reqDonation: 50000, waiverDonation: 100000 },

];



const HISTORICAL_FAME = {

    Ashikaga: 600, Kitabatake: 200, Ouchi: 180, Imagawa: 180, Hojo: 150, Uesugi: 150, Takeda: 140, Mori: 130, Otomo: 120, Shimazu: 120, Rokkaku: 110, Asakura: 110, Honganji: 100, Miyoshi: 100, Oda: 40, Tokugawa: 30, Minor: 0, Merchant: 500

};



const INITIAL_RESOURCES = Object.keys(DAIMYO_INFO).reduce((acc, key) => {

  const baseFame = HISTORICAL_FAME[key] || 50;

  acc[key] = { gold: 300, rice: 300, fame: baseFame, donatedImperial: 0, donatedShogunate: 0, titles: [], rank: null };

  return acc;

}, {});



if(INITIAL_RESOURCES['Ashikaga']) { INITIAL_RESOURCES['Ashikaga'].gold = 1000; INITIAL_RESOURCES['Ashikaga'].titles = ['征夷大将軍']; INITIAL_RESOURCES['Ashikaga'].rank = '従三位'; }

if(INITIAL_RESOURCES['Sho']) { INITIAL_RESOURCES['Sho'].titles = ['琉球王']; }

if(INITIAL_RESOURCES['Ryukyu_Sho']) { INITIAL_RESOURCES['Ryukyu_Sho'].titles = ['琉球王']; }

if(INITIAL_RESOURCES['Kitabatake']) { INITIAL_RESOURCES['Kitabatake'].titles = []; INITIAL_RESOURCES['Kitabatake'].rank = '従五位下'; }



const INITIAL_ALLIANCES = Object.keys(DAIMYO_INFO).reduce((acc, key) => ({...acc, [key]: []}), {});

const setAlliance = (a, b) => { if(INITIAL_ALLIANCES[a]) INITIAL_ALLIANCES[a].push(b); if(INITIAL_ALLIANCES[b]) INITIAL_ALLIANCES[b].push(a); };

setAlliance('Takeda', 'Hojo'); setAlliance('Takeda', 'Imagawa'); setAlliance('Hojo', 'Imagawa');

setAlliance('Oda', 'Tokugawa'); setAlliance('Azai', 'Asakura');



const INITIAL_CEASEFIRES = Object.keys(DAIMYO_INFO).reduce((acc, key) => ({...acc, [key]: {}}), {});



const getInitialRelations = () => {

    const rel = {};

    const ids = Object.keys(DAIMYO_INFO);

    ids.forEach(id => {

        rel[id] = {};

        ids.forEach(target => {

            if (id === target) return;

            let val = 50;

            if ((id === 'Oda' && target === 'Tokugawa') || (id === 'Takeda' && target === 'Hojo')) val = 90;

            if ((id === 'Oda' && target === 'Imagawa') || (id === 'Takeda' && target === 'Uesugi')) val = 10;

            rel[id][target] = val;

        });

    });

    return rel;

};

const INITIAL_RELATIONS = getInitialRelations();



const PROVINCE_DATA_BASE = [

  // --- 北海道 (蝦夷地) ---

  { id: 'matsumae', name: '松前', ownerId: 'Kakizaki', troops: 300, cx: 1750, cy: 50, neighbors: ['usukeshi', 'kudo'], commerce: 40, agriculture: 20, defense: 50 },

  { id: 'usukeshi', name: '宇須岸', ownerId: 'Kono', troops: 200, cx: 1790, cy: 70, neighbors: ['matsumae', 'sannohe', 'tsugaru', 'ishikari'], commerce: 60, agriculture: 10, defense: 30 },

  { id: 'kudo', name: '久遠', ownerId: 'Kakizaki', troops: 200, cx: 1720, cy: 40, neighbors: ['matsumae'], commerce: 30, agriculture: 20, defense: 30 },

  { id: 'ishikari', name: '石狩', ownerId: 'Ainu', troops: 400, cx: 1850, cy: 30, neighbors: ['usukeshi', 'soya'], commerce: 30, agriculture: 10, defense: 10 },

  { id: 'soya', name: '宗谷', ownerId: 'Ainu', troops: 200, cx: 1880, cy: -20, neighbors: ['ishikari'], commerce: 50, agriculture: 5, defense: 10 },



  // --- 東北 (奥羽) ---

  { id: 'tsugaru', name: '津軽', ownerId: 'Nanbu', troops: 400, cx: 1750, cy: 120, neighbors: ['usukeshi', 'sannohe', 'akita'], commerce: 40, agriculture: 40, defense: 40 },

  { id: 'sannohe', name: '三戸', ownerId: 'Nanbu', troops: 600, cx: 1800, cy: 150, neighbors: ['tsugaru', 'usukeshi', 'rikuchu'], commerce: 30, agriculture: 50, defense: 50 },

  { id: 'rikuchu', name: '陸中', ownerId: 'Nanbu', troops: 500, cx: 1800, cy: 250, neighbors: ['sannohe', 'senboku', 'rikuzen'], commerce: 30, agriculture: 40, defense: 40 },

  { id: 'akita', name: '秋田', ownerId: 'Ando', troops: 400, cx: 1680, cy: 230, neighbors: ['tsugaru', 'senboku', 'shonai'], commerce: 70, agriculture: 40, defense: 30 },

  { id: 'senboku', name: '仙北', ownerId: 'Onodera', troops: 300, cx: 1720, cy: 260, neighbors: ['akita', 'rikuchu', 'mogami'], commerce: 20, agriculture: 40, defense: 40 },

  { id: 'shonai', name: '庄内', ownerId: 'Daihoji', troops: 300, cx: 1640, cy: 320, neighbors: ['akita', 'mogami', 'kasugayama'], commerce: 60, agriculture: 70, defense: 30 },

  { id: 'mogami', name: '最上', ownerId: 'Mogami', troops: 500, cx: 1700, cy: 330, neighbors: ['senboku', 'shonai', 'yonezawa', 'rikuzen'], commerce: 50, agriculture: 60, defense: 40 },

  { id: 'rikuzen', name: '陸前', ownerId: 'Date', troops: 700, cx: 1780, cy: 380, neighbors: ['rikuchu', 'mogami', 'yonezawa', 'iwaki'], commerce: 50, agriculture: 60, defense: 40 },

  { id: 'yonezawa', name: '米沢', ownerId: 'Date', troops: 600, cx: 1730, cy: 430, neighbors: ['mogami', 'rikuzen', 'aizu', 'shirakawa'], commerce: 40, agriculture: 60, defense: 50 },

  { id: 'aizu', name: '会津', ownerId: 'Ashina', troops: 800, cx: 1660, cy: 450, neighbors: ['yonezawa', 'nasu', 'kanbara', 'shirakawa'], commerce: 40, agriculture: 80, defense: 70 },

  { id: 'iwaki', name: '岩城', ownerId: 'Iwaki', troops: 400, cx: 1780, cy: 480, neighbors: ['rikuzen', 'mito', 'shirakawa'], commerce: 30, agriculture: 40, defense: 20 },

  { id: 'shirakawa', name: '白河', ownerId: 'Yuki_S', troops: 400, cx: 1720, cy: 490, neighbors: ['nasu', 'aizu', 'iwaki', 'yonezawa'], commerce: 30, agriculture: 50, defense: 60 },



  // --- 関東 ---

  { id: 'nasu', name: '那須', ownerId: 'Nasu', troops: 300, cx: 1680, cy: 520, neighbors: ['aizu', 'mito', 'utsunomiya', 'shirakawa'], commerce: 20, agriculture: 40, defense: 40 },

  { id: 'utsunomiya', name: '宇都宮', ownerId: 'Utsunomiya', troops: 400, cx: 1650, cy: 560, neighbors: ['nasu', 'mito', 'kawagoe', 'umayabashi'], commerce: 40, agriculture: 60, defense: 40 },

  { id: 'mito', name: '水戸', ownerId: 'Satake', troops: 600, cx: 1750, cy: 540, neighbors: ['iwaki', 'nasu', 'utsunomiya', 'kashima', 'sakura'], commerce: 50, agriculture: 70, defense: 50 },

  { id: 'kashima', name: '鹿島', ownerId: 'Satake', troops: 400, cx: 1780, cy: 600, neighbors: ['mito', 'edo', 'sakura'], commerce: 60, agriculture: 50, defense: 30 },

  { id: 'sakura', name: '佐倉', ownerId: 'Chiba', troops: 500, cx: 1720, cy: 600, neighbors: ['edo', 'kashima', 'kazusa', 'mito'], commerce: 60, agriculture: 60, defense: 40 },

  { id: 'umayabashi', name: '厩橋', ownerId: 'Uesugi_N', troops: 500, cx: 1580, cy: 550, neighbors: ['utsunomiya', 'kawagoe', 'saku', 'kasugayama'], commerce: 30, agriculture: 50, defense: 50 },

  { id: 'kawagoe', name: '河越', ownerId: 'Hojo', troops: 700, cx: 1630, cy: 610, neighbors: ['utsunomiya', 'umayabashi', 'edo', 'odawara', 'kai'], commerce: 50, agriculture: 80, defense: 60 },

  { id: 'edo', name: '江戸', ownerId: 'Hojo', troops: 600, cx: 1680, cy: 640, neighbors: ['kawagoe', 'kashima', 'kazusa', 'sakura'], commerce: 80, agriculture: 70, defense: 50 },

  { id: 'kazusa', name: '上総', ownerId: 'Satomi', troops: 400, cx: 1720, cy: 680, neighbors: ['edo', 'awa_boso', 'sakura'], commerce: 40, agriculture: 50, defense: 30 },

  { id: 'awa_boso', name: '安房', ownerId: 'Satomi', troops: 500, cx: 1720, cy: 730, neighbors: ['kazusa'], commerce: 50, agriculture: 30, defense: 50 },

  { id: 'odawara', name: '小田原', ownerId: 'Hojo', troops: 1200, cx: 1620, cy: 680, neighbors: ['kawagoe', 'sunpu', 'kai', 'izu'], commerce: 70, agriculture: 60, defense: 120 },

  { id: 'izu', name: '伊豆', ownerId: 'Hojo', troops: 400, cx: 1620, cy: 740, neighbors: ['odawara', 'sunpu'], commerce: 40, agriculture: 20, defense: 40 },



  // --- 中部・北陸 ---

  { id: 'kasugayama', name: '春日山', ownerId: 'Uesugi', troops: 1100, cx: 1480, cy: 400, neighbors: ['shonai', 'kanbara', 'kawanakajima', 'etchu', 'umayabashi', 'sado'], commerce: 60, agriculture: 80, defense: 90 },

  { id: 'kanbara', name: '蒲原', ownerId: 'Uesugi', troops: 500, cx: 1550, cy: 380, neighbors: ['kasugayama', 'aizu'], commerce: 40, agriculture: 90, defense: 40 },

  { id: 'sado', name: '佐渡', ownerId: 'Honma', troops: 200, cx: 1450, cy: 330, neighbors: ['kasugayama'], commerce: 150, agriculture: 20, defense: 40 },

  { id: 'etchu', name: '越中', ownerId: 'Jinbo', troops: 400, cx: 1350, cy: 420, neighbors: ['kasugayama', 'kanazawa', 'hida'], commerce: 40, agriculture: 50, defense: 40 },

  { id: 'noto', name: '能登', ownerId: 'Hatakeyama', troops: 400, cx: 1300, cy: 360, neighbors: ['etchu', 'kanazawa'], commerce: 50, agriculture: 30, defense: 40 },

  { id: 'kanazawa', name: '金沢', ownerId: 'Honganji', troops: 1000, cx: 1250, cy: 430, neighbors: ['etchu', 'noto', 'ichijodani'], commerce: 70, agriculture: 90, defense: 80 },

  { id: 'ichijodani', name: '一乗谷', ownerId: 'Asakura', troops: 800, cx: 1200, cy: 500, neighbors: ['kanazawa', 'odani', 'inabayama', 'tsuruga'], commerce: 80, agriculture: 70, defense: 70 },

  { id: 'tsuruga', name: '敦賀', ownerId: 'Asakura', troops: 400, cx: 1150, cy: 510, neighbors: ['ichijodani', 'odani', 'obama'], commerce: 70, agriculture: 30, defense: 40 },

  { id: 'obama', name: '小浜', ownerId: 'Takeda_W', troops: 300, cx: 1100, cy: 510, neighbors: ['tsuruga', 'miyazu'], commerce: 60, agriculture: 30, defense: 30 },

  { id: 'kawanakajima', name: '川中島', ownerId: 'Uesugi', troops: 800, cx: 1450, cy: 480, neighbors: ['kasugayama', 'saku', 'azumi'], commerce: 30, agriculture: 50, defense: 60 },

  { id: 'saku', name: '佐久', ownerId: 'Takeda', troops: 500, cx: 1520, cy: 530, neighbors: ['kawanakajima', 'umayabashi', 'suwa'], commerce: 20, agriculture: 40, defense: 50 },

  { id: 'suwa', name: '諏訪', ownerId: 'Takeda', troops: 600, cx: 1480, cy: 580, neighbors: ['saku', 'kai', 'ina'], commerce: 40, agriculture: 40, defense: 60 },

  { id: 'kai', name: '甲斐', ownerId: 'Takeda', troops: 1000, cx: 1530, cy: 630, neighbors: ['suwa', 'odawara', 'sunpu', 'kawagoe'], commerce: 50, agriculture: 50, defense: 80 },

  { id: 'ina', name: '伊那', ownerId: 'Takeda', troops: 500, cx: 1430, cy: 620, neighbors: ['suwa', 'hamamatsu'], commerce: 30, agriculture: 50, defense: 40 },

  { id: 'azumi', name: '安曇', ownerId: 'Takeda', troops: 400, cx: 1400, cy: 520, neighbors: ['kawanakajima', 'hida'], commerce: 20, agriculture: 30, defense: 50 },

  { id: 'hida', name: '飛騨', ownerId: 'Anegakoji', troops: 300, cx: 1350, cy: 520, neighbors: ['etchu', 'azumi', 'gujo'], commerce: 20, agriculture: 20, defense: 40 },

  { id: 'sunpu', name: '駿府', ownerId: 'Imagawa', troops: 1500, cx: 1550, cy: 710, neighbors: ['kai', 'odawara', 'izu', 'hamamatsu'], commerce: 90, agriculture: 70, defense: 70 },

  { id: 'hamamatsu', name: '浜松', ownerId: 'Imagawa', troops: 800, cx: 1450, cy: 730, neighbors: ['sunpu', 'ina', 'okazaki'], commerce: 60, agriculture: 60, defense: 50 },

  { id: 'okazaki', name: '岡崎', ownerId: 'Imagawa', troops: 600, cx: 1360, cy: 710, neighbors: ['hamamatsu', 'kiyosu', 'chita'], commerce: 50, agriculture: 70, defense: 40 },

  { id: 'kiyosu', name: '清洲', ownerId: 'Oda', troops: 800, cx: 1290, cy: 660, neighbors: ['okazaki', 'inabayama', 'anotsu', 'chita'], commerce: 100, agriculture: 90, defense: 50 },

  { id: 'chita', name: '知多', ownerId: 'Mizuno', troops: 300, cx: 1310, cy: 710, neighbors: ['kiyosu', 'okazaki'], commerce: 60, agriculture: 30, defense: 30 },

  { id: 'inabayama', name: '稲葉山', ownerId: 'Saito', troops: 900, cx: 1280, cy: 590, neighbors: ['kiyosu', 'gujo', 'azuchi', 'ichijodani'], commerce: 70, agriculture: 80, defense: 90 },

  { id: 'gujo', name: '郡上', ownerId: 'Endo', troops: 300, cx: 1320, cy: 550, neighbors: ['inabayama', 'hida'], commerce: 20, agriculture: 20, defense: 60 },



  // --- 畿内 ---

  { id: 'anotsu', name: '安濃津', ownerId: 'Kitabatake', troops: 600, cx: 1220, cy: 700, neighbors: ['kiyosu', 'azuchi', 'nara', 'shima'], commerce: 60, agriculture: 70, defense: 40 },

  { id: 'shima', name: '志摩', ownerId: 'Kuki', troops: 200, cx: 1240, cy: 750, neighbors: ['anotsu'], commerce: 50, agriculture: 10, defense: 30 },

  { id: 'odani', name: '小谷', ownerId: 'Azai', troops: 600, cx: 1180, cy: 540, neighbors: ['azuchi', 'ichijodani', 'tsuruga'], commerce: 40, agriculture: 60, defense: 80 },

  { id: 'azuchi', name: '安土', ownerId: 'Rokkaku', troops: 700, cx: 1180, cy: 600, neighbors: ['odani', 'kyoto', 'inabayama', 'koga', 'anotsu'], commerce: 80, agriculture: 80, defense: 60 },

  { id: 'koga', name: '甲賀', ownerId: 'Rokkaku', troops: 400, cx: 1160, cy: 650, neighbors: ['azuchi', 'nara'], commerce: 30, agriculture: 30, defense: 70 },

  { id: 'kyoto', name: '京都', ownerId: 'Ashikaga', troops: 500, cx: 1120, cy: 610, neighbors: ['azuchi', 'ishiyama', 'nara', 'sasayama'], commerce: 200, agriculture: 50, defense: 60 },

  { id: 'nara', name: '奈良', ownerId: 'Tsutsui', troops: 500, cx: 1110, cy: 670, neighbors: ['kyoto', 'sakai', 'koga', 'anotsu', 'totsukawa'], commerce: 90, agriculture: 60, defense: 50 },

  { id: 'totsukawa', name: '十津川', ownerId: 'Hatakeyama', troops: 300, cx: 1110, cy: 750, neighbors: ['nara', 'wakayama'], commerce: 10, agriculture: 20, defense: 60 },

  { id: 'wakayama', name: '和歌山', ownerId: 'Saika', troops: 700, cx: 1050, cy: 780, neighbors: ['totsukawa', 'sakai', 'tokushima'], commerce: 60, agriculture: 30, defense: 70 },

  { id: 'sakai', name: '堺', ownerId: 'Merchant', troops: 300, cx: 1050, cy: 680, neighbors: ['ishiyama', 'nara', 'wakayama'], commerce: 250, agriculture: 10, defense: 70 },

  { id: 'ishiyama', name: '石山', ownerId: 'Honganji', troops: 1200, cx: 1070, cy: 640, neighbors: ['kyoto', 'sakai', 'hyogo', 'sasayama'], commerce: 100, agriculture: 70, defense: 150 },

  { id: 'hyogo', name: '兵庫', ownerId: 'Miyoshi', troops: 900, cx: 1010, cy: 640, neighbors: ['ishiyama', 'himeji', 'sasayama', 'sumoto'], commerce: 120, agriculture: 70, defense: 60 },

  { id: 'sasayama', name: '篠山', ownerId: 'Hatano', troops: 400, cx: 1040, cy: 580, neighbors: ['kyoto', 'ishiyama', 'hyogo', 'himeji', 'miyazu'], commerce: 30, agriculture: 50, defense: 60 },

  { id: 'miyazu', name: '宮津', ownerId: 'Isshiki', troops: 300, cx: 1060, cy: 500, neighbors: ['obama', 'sasayama', 'toyooka'], commerce: 50, agriculture: 30, defense: 40 },



  // --- 中国 ---

  { id: 'himeji', name: '姫路', ownerId: 'Akamatsu', troops: 500, cx: 940, cy: 640, neighbors: ['hyogo', 'sasayama', 'okayama', 'tottori'], commerce: 70, agriculture: 80, defense: 50 },

  { id: 'toyooka', name: '豊岡', ownerId: 'Yamana', troops: 400, cx: 960, cy: 520, neighbors: ['miyazu', 'tottori', 'himeji'], commerce: 30, agriculture: 40, defense: 50 },

  { id: 'tottori', name: '鳥取', ownerId: 'Yamana', troops: 400, cx: 880, cy: 540, neighbors: ['toyooka', 'himeji', 'gassan-toda', 'tsuyama'], commerce: 40, agriculture: 40, defense: 40 },

  { id: 'tsuyama', name: '津山', ownerId: 'Mimura', troops: 400, cx: 860, cy: 580, neighbors: ['tottori', 'himeji', 'okayama', 'niimi'], commerce: 30, agriculture: 50, defense: 40 },

  { id: 'okayama', name: '岡山', ownerId: 'Ukita', troops: 600, cx: 860, cy: 650, neighbors: ['himeji', 'tsuyama', 'niimi', 'takamatsu_s'], commerce: 70, agriculture: 70, defense: 50 },

  { id: 'niimi', name: '新見', ownerId: 'Mimura', troops: 400, cx: 800, cy: 610, neighbors: ['tsuyama', 'okayama', 'fukuyama', 'gassan-toda'], commerce: 30, agriculture: 50, defense: 50 },

  { id: 'gassan-toda', name: '月山富田', ownerId: 'Amago', troops: 1000, cx: 780, cy: 550, neighbors: ['tottori', 'niimi', 'fukuyama', 'iwami-ginzan', 'oki'], commerce: 50, agriculture: 60, defense: 110 },

  { id: 'oki', name: '隠岐', ownerId: 'Amago', troops: 200, cx: 780, cy: 480, neighbors: ['gassan-toda'], commerce: 40, agriculture: 10, defense: 30 },

  { id: 'fukuyama', name: '福山', ownerId: 'Mori', troops: 500, cx: 740, cy: 640, neighbors: ['niimi', 'gassan-toda', 'yoshida-koriyama', 'imabari'], commerce: 50, agriculture: 60, defense: 40 },

  { id: 'yoshida-koriyama', name: '吉田郡山', ownerId: 'Mori', troops: 1000, cx: 710, cy: 650, neighbors: ['fukuyama', 'iwami-ginzan', 'itsukushima'], commerce: 40, agriculture: 60, defense: 100 },

  { id: 'iwami-ginzan', name: '石見銀山', ownerId: 'Mori', troops: 600, cx: 680, cy: 580, neighbors: ['yoshida-koriyama', 'gassan-toda', 'hagi'], commerce: 350, agriculture: 10, defense: 70 },

  { id: 'itsukushima', name: '厳島', ownerId: 'Mori', troops: 400, cx: 670, cy: 700, neighbors: ['yoshida-koriyama', 'hagi', 'imabari'], commerce: 120, agriculture: 20, defense: 50 },

  { id: 'hagi', name: '萩', ownerId: 'Mori', troops: 500, cx: 580, cy: 640, neighbors: ['itsukushima', 'iwami-ginzan', 'shimonoseki'], commerce: 40, agriculture: 50, defense: 50 },

  { id: 'shimonoseki', name: '下関', ownerId: 'Mori', troops: 500, cx: 500, cy: 660, neighbors: ['hagi', 'hakata'], commerce: 100, agriculture: 30, defense: 50 },



  // --- 四国 ---

  { id: 'sumoto', name: '洲本', ownerId: 'Miyoshi', troops: 300, cx: 980, cy: 700, neighbors: ['hyogo', 'tokushima'], commerce: 40, agriculture: 30, defense: 40 },

  { id: 'tokushima', name: '徳島', ownerId: 'Miyoshi', troops: 700, cx: 920, cy: 750, neighbors: ['sumoto', 'wakayama', 'takamatsu_s', 'kochi'], commerce: 60, agriculture: 60, defense: 40 },

  { id: 'takamatsu_s', name: '高松', ownerId: 'Miyoshi', troops: 600, cx: 860, cy: 710, neighbors: ['tokushima', 'imabari', 'kochi', 'okayama'], commerce: 60, agriculture: 60, defense: 40 },

  { id: 'imabari', name: '今治', ownerId: 'Kono', troops: 500, cx: 760, cy: 760, neighbors: ['takamatsu_s', 'kochi', 'itsukushima', 'funai', 'fukuyama'], commerce: 50, agriculture: 50, defense: 40 },

  { id: 'kochi', name: '高知', ownerId: 'Chosokabe', troops: 600, cx: 820, cy: 830, neighbors: ['tokushima', 'takamatsu_s', 'imabari', 'shimanto'], commerce: 30, agriculture: 50, defense: 50 },

  { id: 'shimanto', name: '四万十', ownerId: 'Ichijo', troops: 400, cx: 750, cy: 850, neighbors: ['kochi', 'imabari'], commerce: 40, agriculture: 40, defense: 30 },



  // --- 九州・沖縄 ---

  { id: 'hakata', name: '博多', ownerId: 'Otomo', troops: 800, cx: 380, cy: 660, neighbors: ['shimonoseki', 'funai', 'saga', 'kokura'], commerce: 180, agriculture: 60, defense: 50 },

  { id: 'kokura', name: '小倉', ownerId: 'Otomo', troops: 500, cx: 450, cy: 670, neighbors: ['hakata', 'funai', 'shimonoseki'], commerce: 70, agriculture: 50, defense: 60 },

  { id: 'funai', name: '府内', ownerId: 'Otomo', troops: 1200, cx: 480, cy: 750, neighbors: ['hakata', 'kokura', 'asou', 'usuki', 'imabari'], commerce: 110, agriculture: 70, defense: 70 },

  { id: 'usuki', name: '臼杵', ownerId: 'Otomo', troops: 600, cx: 500, cy: 800, neighbors: ['funai', 'obi'], commerce: 80, agriculture: 40, defense: 60 },

  { id: 'saga', name: '佐賀', ownerId: 'Ryuzoji', troops: 700, cx: 320, cy: 710, neighbors: ['hakata', 'matsuura', 'arima', 'kumamoto'], commerce: 60, agriculture: 80, defense: 50 },

  { id: 'matsuura', name: '松浦', ownerId: 'Matsuura', troops: 400, cx: 270, cy: 680, neighbors: ['saga', 'iki'], commerce: 90, agriculture: 40, defense: 40 },

  { id: 'arima', name: '有馬', ownerId: 'Arima', troops: 500, cx: 280, cy: 760, neighbors: ['saga', 'kumamoto'], commerce: 80, agriculture: 40, defense: 50 },

  { id: 'asou', name: '阿蘇', ownerId: 'Aso', troops: 400, cx: 410, cy: 790, neighbors: ['funai', 'hitoyoshi', 'obi', 'kumamoto'], commerce: 20, agriculture: 50, defense: 70 },

  { id: 'kumamoto', name: '熊本', ownerId: 'Ida', troops: 600, cx: 350, cy: 780, neighbors: ['saga', 'asou', 'arima', 'hitoyoshi'], commerce: 60, agriculture: 80, defense: 50 },

  { id: 'hitoyoshi', name: '人吉', ownerId: 'Sagara', troops: 500, cx: 380, cy: 850, neighbors: ['asou', 'izumi_k', 'kagoshima', 'kumamoto'], commerce: 30, agriculture: 50, defense: 60 },

  { id: 'obi', name: '飫肥', ownerId: 'Ito', troops: 600, cx: 440, cy: 880, neighbors: ['usuki', 'asou', 'kagoshima'], commerce: 40, agriculture: 50, defense: 50 },

  { id: 'izumi_k', name: '出水', ownerId: 'Shimazu', troops: 500, cx: 330, cy: 860, neighbors: ['hitoyoshi', 'kagoshima'], commerce: 30, agriculture: 40, defense: 50 },

  { id: 'kagoshima', name: '鹿児島', ownerId: 'Shimazu', troops: 1100, cx: 320, cy: 930, neighbors: ['izumi_k', 'hitoyoshi', 'obi', 'tanegashima'], commerce: 80, agriculture: 60, defense: 90 },

  { id: 'tanegashima', name: '種子島', ownerId: 'Tanegashima', troops: 300, cx: 350, cy: 1000, neighbors: ['kagoshima', 'amami'], commerce: 120, agriculture: 20, defense: 30 },

  { id: 'amami', name: '奄美', ownerId: 'Ryukyu_Sho', troops: 200, cx: 250, cy: 1020, neighbors: ['tanegashima', 'shuri'], commerce: 40, agriculture: 30, defense: 20 },

  { id: 'tsushima', name: '対馬', ownerId: 'So', troops: 300, cx: 200, cy: 600, neighbors: ['iki'], commerce: 150, agriculture: 10, defense: 50 },

  { id: 'iki', name: '壱岐', ownerId: 'Matsuura', troops: 200, cx: 230, cy: 640, neighbors: ['tsushima', 'matsuura'], commerce: 60, agriculture: 20, defense: 30 },

  { id: 'shuri', name: '首里', ownerId: 'Sho', troops: 500, cx: 150, cy: 1100, neighbors: ['amami'], commerce: 200, agriculture: 30, defense: 40 }

];



// データの整合性チェック・自動修正

function validateAndFixData(db) {

    const idMap = new Map();

    db.forEach(p => idMap.set(p.id, p));



    db.forEach(p => {

        p.neighbors.forEach(neighborId => {

            const neighbor = idMap.get(neighborId);

            if (neighbor) {

                if (!neighbor.neighbors.includes(p.id)) {

                    neighbor.neighbors.push(p.id); // 相互リンクを自動追加

                }

            } else {

                console.error(`Error: Province ${p.id} references missing neighbor ${neighborId}`);

            }

        });

    });

    // console.log("Province data validation complete.");

}



// 起動時にデータを修正

validateAndFixData(PROVINCE_DATA_BASE);



const INITIAL_PROVINCES = PROVINCE_DATA_BASE.map(p => ({

  ...p,

  cx: p.cx * 2, cy: p.cy * 2,

  troops: p.troops || 500,

  commerce: p.commerce || 40,

  agriculture: p.agriculture || 40,

  defense: p.defense || 30,

  loyalty: 60, training: 50, actionsLeft: 3

}));





// --- UI コンポーネント ---



const StartScreen = ({ onSelectDaimyo }) => (

    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-white">

      <h1 className="text-5xl font-bold mb-8 text-yellow-500 flex items-center gap-4">

        <Sword size={48} /> 戦国国盗り絵巻 <Trophy size={48} />

      </h1>

      <p className="mb-6 text-stone-400">大名家を選択して天下統一を目指せ</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto max-h-[60vh] w-full px-4">

        {Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor').map(id => (

          <button key={id} onClick={() => onSelectDaimyo(id)} className={`p-4 rounded border-2 border-stone-700 hover:border-yellow-500 hover:bg-stone-800 transition-all flex flex-col items-center gap-2 ${DAIMYO_INFO[id].color}`}>

            <span className="font-bold text-lg">{DAIMYO_INFO[id].name}</span>

            <span className="text-xs bg-black/50 px-2 py-1 rounded">難易度: {DAIMYO_INFO[id].difficulty || '普通'}</span>

          </button>

        ))}

      </div>

    </div>

);



const IncomingRequestModal = ({ request, onAccept, onReject }) => {

  if (!request || !request.sourceId) return null; 

  return (

    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

      <div className="bg-stone-800 text-white p-6 rounded-xl border border-stone-500 shadow-2xl w-full max-w-md animate-bounce-in">

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400"><MessageCircle size={24} /> {DAIMYO_INFO[request.sourceId].name}家からの使者</h3>

        <p className="mb-6 text-lg">

          {request.type === 'alliance' && "同盟を求めています。受諾しますか？"}

          {request.type === 'ceasefire' && "停戦(5期間)を求めています。金300を持参しました。"}

          {request.type === 'threaten' && "資金の提供を要求しています。「断れば攻め込む」とのことです..."}

        </p>

        <div className="flex gap-4">

          <button onClick={onReject} className="flex-1 py-3 rounded bg-red-800 hover:bg-red-700 font-bold">拒否</button>

          <button onClick={onAccept} className="flex-1 py-3 rounded bg-blue-800 hover:bg-blue-700 font-bold">受諾</button>

        </div>

      </div>

    </div>

  );

};



const LogHistoryModal = ({ logs, onClose }) => (

    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>

        <div className="bg-stone-800 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl border border-stone-500 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            <div className="p-4 border-b border-stone-600 flex justify-between items-center bg-stone-900">

                <h3 className="text-lg font-bold flex items-center gap-2"><History size={20}/> 履歴</h3>

                <button onClick={onClose} className="p-1 hover:bg-stone-700 rounded"><XCircle size={20}/></button>

            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1 font-mono text-sm bg-stone-900/50">

                {logs.length === 0 && <div className="text-stone-500 text-center">履歴はありません</div>}

                {[...logs].reverse().map((log, i) => <div key={i} className="border-b border-stone-700/50 pb-1 text-stone-300"><span className="text-stone-500 mr-2">[{logs.length - i}]</span> {log}</div>)}

            </div>

        </div>

    </div>

);



const MarketModal = ({ currentGold, currentRice, price, onTrade, onClose }) => {

  const buyPrice = Math.floor(price * 1.2 * 10) / 10;

  const sellPrice = Math.floor(price * 0.8 * 10) / 10;

  const [mode, setMode] = useState('buy'); 

  const [amount, setAmount] = useState(100);

  const maxBuy = Math.floor(currentGold / buyPrice);

  const maxSell = currentRice;

  const maxVal = mode === 'buy' ? Math.max(10, maxBuy) : Math.max(10, maxSell);

  const currentVal = Math.min(amount, maxVal);

  const cost = Math.floor(currentVal * buyPrice);

  const gain = Math.floor(currentVal * sellPrice);



  return (

    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

      <div className="bg-stone-800 text-white p-6 rounded-xl border border-teal-500 shadow-2xl w-full max-w-sm">

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-teal-400"><Scale size={24} /> 楽市楽座 <span className="text-xs bg-stone-700 px-2 py-1 rounded text-white ml-2 border border-stone-500">AP消費なし</span></h3>

        <div className="flex gap-2 mb-4">

          <button onClick={() => { setMode('buy'); setAmount(100); }} className={`flex-1 py-2 rounded border ${mode === 'buy' ? 'bg-teal-700 border-teal-400' : 'bg-stone-700 border-stone-600'}`}>購入 (単価:{buyPrice})</button>

          <button onClick={() => { setMode('sell'); setAmount(100); }} className={`flex-1 py-2 rounded border ${mode === 'sell' ? 'bg-orange-700 border-orange-400' : 'bg-stone-700 border-stone-600'}`}>売却 (単価:{sellPrice})</button>

        </div>

        <div className="text-center mb-4"><div className="text-4xl font-mono font-bold mb-2">{currentVal} <span className="text-sm">石</span></div><div className="text-sm text-stone-300">{mode === 'buy' ? `費用: ${cost}金` : `売上: ${gain}金`}</div></div>

        <input type="range" min="10" max={maxVal} step="10" value={currentVal} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer mb-6 accent-teal-500" />

        <div className="flex gap-4">

          <button onClick={onClose} className="flex-1 py-2 rounded bg-stone-600 font-bold">やめる</button>

          <button onClick={() => onTrade(mode, currentVal, mode === 'buy' ? cost : gain)} disabled={(mode === 'buy' && currentGold < cost) || (mode === 'sell' && currentRice < currentVal)} className="flex-1 py-2 rounded font-bold bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50">取引実行</button>

        </div>

      </div>

    </div>

  );

};



const TitlesModal = ({ daimyoStats, provinces, daimyoId, onClose, onApply, onApplyRank }) => {

    const [tab, setTab] = useState('titles');

    const myStats = daimyoStats[daimyoId];

    const myOwnedProvinces = provinces.filter(p => p.ownerId === daimyoId).map(p => p.id);

    const existingTitles = Object.values(daimyoStats).flatMap(s => s.titles || []);

    const relevantDonation = provinces.some(p => p.ownerId === 'Ashikaga') ? myStats.donatedShogunate : myStats.donatedImperial;

    

    return (

        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

             <div className="bg-stone-900 text-white p-6 rounded-xl border border-yellow-600 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

                <div className="flex items-center gap-4 mb-4 border-b border-stone-700 pb-2">

                    <button onClick={() => setTab('titles')} className={`text-2xl font-bold flex items-center gap-2 ${tab==='titles' ? 'text-yellow-500' : 'text-stone-500'}`}><Crown size={32}/> 役職 <span className="text-xs font-normal text-stone-400">(確認のみ: AP消費なし)</span></button>

                    <button onClick={() => setTab('ranks')} className={`text-2xl font-bold flex items-center gap-2 ${tab==='ranks' ? 'text-purple-500' : 'text-stone-500'}`}><Landmark size={32}/> 官位</button>

                </div>

                <div className="overflow-y-auto flex-1 pr-2 space-y-2">

                    {tab === 'titles' && TITLES.map(title => {

                        if (title.id === 'ryukyu_king') return null;

                        const canApply = !myStats.titles.includes(title.name) && !existingTitles.includes(title.name) && myOwnedProvinces.length >= title.reqProvinces && relevantDonation >= title.reqDonation && myStats.gold >= COSTS.title_app.gold;

                        return (

                            <div key={title.id} className="p-4 rounded border border-stone-600 bg-stone-800 flex justify-between items-center">

                                <div><div className="text-lg font-bold text-yellow-200">{title.name}</div><div className="text-xs text-stone-400">必要国:{title.reqProvinces} 献金:{title.reqDonation}</div></div>

                                {myStats.titles.includes(title.name) ? <span className="text-yellow-500">就任中</span> : <button onClick={() => onApply(title)} disabled={!canApply} className="px-4 py-2 rounded bg-yellow-600 disabled:opacity-50 text-black font-bold flex items-center gap-1">申請 <Zap size={12}/> 1</button>}

                            </div>

                        );

                    })}

                    {tab === 'ranks' && COURT_RANKS.map(rank => {

                         const canApply = myOwnedProvinces.length >= rank.reqProvinces && myStats.donatedImperial >= rank.reqDonation && myStats.gold >= COSTS.rank_app.gold && myStats.rank !== rank.name;

                         return (

                             <div key={rank.id} className="p-4 rounded border border-stone-600 bg-stone-800 flex justify-between items-center">

                                 <div><div className="text-lg font-bold text-purple-200">{rank.name}</div><div className="text-xs text-stone-400">必要国:{rank.reqProvinces} 献金:{rank.reqDonation}</div></div>

                                 {myStats.rank === rank.name ? <span className="text-purple-500">叙任中</span> : <button onClick={() => onApplyRank(rank)} disabled={!canApply} className="px-4 py-2 rounded bg-purple-600 disabled:opacity-50 text-white font-bold flex items-center gap-1">申請 <Zap size={12}/> 1</button>}

                             </div>

                         );

                    })}

                </div>

                <div className="mt-6 flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-stone-700 hover:bg-stone-600 rounded text-white font-bold">閉じる</button></div>

             </div>

        </div>

    );

};



const DonateModal = ({ currentGold, shogunName, isShogun, onConfirm, onCancel }) => {

  const [amount, setAmount] = useState(100);

  const [target, setTarget] = useState('imperial'); 

  const fameGain = target === 'imperial' ? Math.floor(amount / 100) : Math.floor(amount / 200);



  return (

    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

      <div className="bg-stone-800 text-white p-6 rounded-xl border border-purple-500 shadow-2xl w-full max-w-sm">

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400"><Crown size={24} /> 献金</h3>

        <div className="flex gap-2 mb-4">

          <button onClick={() => setTarget('imperial')} className={`flex-1 py-2 rounded border ${target === 'imperial' ? 'bg-purple-700 border-purple-400' : 'bg-stone-700 border-stone-600'}`}>朝廷</button>

          {!isShogun && <button onClick={() => setTarget('shogunate')} className={`flex-1 py-2 rounded border ${target === 'shogunate' ? 'bg-yellow-700 border-yellow-400' : 'bg-stone-700 border-stone-600'}`}>幕府</button>}

        </div>

        <div className="text-center mb-4"><div className="text-4xl font-mono font-bold mb-2 text-yellow-400">{amount}金</div><div className="text-sm text-stone-300">名声期待値: +{fameGain}</div></div>

        <input type="range" min="100" max={Math.max(100, currentGold)} step="100" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer mb-6 accent-purple-500" />

        <div className="flex gap-4"><button onClick={onCancel} className="flex-1 py-2 rounded bg-stone-600 font-bold">やめる</button><button onClick={() => onConfirm(target, amount, fameGain)} disabled={currentGold < amount} className="flex-1 py-2 rounded font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 flex items-center justify-center gap-1">献上実行 <Zap size={14} className="text-yellow-400"/> 1</button></div>

      </div>

    </div>

  );

};



const TradeModal = ({ onConfirm, onCancel }) => (

    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

      <div className="bg-stone-800 text-white p-6 rounded-xl border border-teal-500 shadow-2xl w-full max-w-md">

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-teal-400"><Ship size={24} /> 交易選択</h3>

        <div className="space-y-4">

            <button onClick={() => onConfirm('nanban')} className="w-full p-4 rounded bg-stone-700 hover:bg-teal-900 border border-stone-500 hover:border-teal-400 transition-all flex flex-col gap-1 relative group">

                <span className="font-bold text-lg flex items-center gap-2 text-teal-200"><Star size={18}/> 南蛮貿易</span>

                <span className="text-xs text-stone-300">ハイリスク・ハイリターン。鉄砲入手や巨万の富を得る可能性があるが、一揆のリスクも。</span>

                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center gap-1 border border-stone-500"><Zap size={10} className="text-yellow-400"/> 実行消費: 1</div>

            </button>

            <button onClick={() => onConfirm('domestic')} className="w-full p-4 rounded bg-stone-700 hover:bg-blue-900 border border-stone-500 hover:border-blue-400 transition-all flex flex-col gap-1 relative group">

                <span className="font-bold text-lg flex items-center gap-2 text-blue-200"><Handshake size={18}/> 近隣交易</span>

                <span className="text-xs text-stone-300">ローリスク。書物(名声)や安定した利益を得やすい。</span>

                <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs flex items-center gap-1 border border-stone-500"><Zap size={10} className="text-yellow-400"/> 実行消費: 1</div>

            </button>

        </div>

        <button onClick={onCancel} className="mt-6 w-full py-2 rounded bg-stone-600 hover:bg-stone-500 font-bold">やめる</button>

      </div>

    </div>

);



const NegotiationScene = ({ targetDaimyoId, targetDaimyo, isAllied, onConfirm, onCancel }) => (

    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">

        <div className="flex flex-col items-center mb-8 z-10">

            <div className={`w-32 h-32 rounded-full ${targetDaimyo.color} flex items-center justify-center border-4 border-white shadow-lg mb-4`}><span className="text-4xl font-bold text-white">{targetDaimyo.name[0]}</span></div>

            <h2 className="text-3xl font-bold text-white mb-2">{targetDaimyo.name}家</h2>

        </div>

        <div className="w-full max-w-2xl bg-stone-900 border-2 border-stone-600 rounded-xl p-6 shadow-2xl z-10">

            <div className="text-right text-xs mb-2 text-stone-400">※実行時に行動力を1消費します</div>

            <div className="grid grid-cols-2 gap-4">

                {isAllied ? (

                    <><button onClick={() => onConfirm('request_aid')} className="p-3 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-500 rounded text-white font-bold flex justify-between items-center">援助要請 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button><button onClick={() => onConfirm('break_alliance')} className="p-3 bg-red-900/50 hover:bg-red-800 border border-red-500 rounded text-white font-bold flex justify-between items-center">同盟破棄 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button></>

                ) : (

                    <>

                        <button onClick={() => onConfirm('gift')} className="p-3 bg-pink-900/50 hover:bg-pink-800 border border-pink-500 rounded text-white font-bold flex justify-between items-center"><div>贈答 <span className="text-xs font-normal">(金{COSTS.gift.gold})</span></div> <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>

                        <button onClick={() => onConfirm('ceasefire')} className="p-3 bg-green-900/50 hover:bg-green-800 border border-green-500 rounded text-white font-bold flex justify-between items-center"><div>停戦協定 <span className="text-xs font-normal">(金300)</span></div> <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>

                        <button onClick={() => onConfirm('threaten')} className="p-3 bg-red-900/50 hover:bg-red-800 border border-red-500 rounded text-white font-bold flex justify-between items-center">脅迫 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>

                        <button onClick={() => onConfirm('surrender')} className="p-3 bg-orange-900/50 hover:bg-orange-800 border border-orange-500 rounded text-white font-bold flex justify-between items-center">降伏勧告 <span className="flex items-center gap-1 text-xs bg-black/30 px-2 rounded"><Zap size={10}/>1</span></button>

                    </>

                )}

            </div>

            <div className="mt-6 flex justify-center"><button onClick={onCancel} className="px-8 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded font-bold">戻る (消費なし)</button></div>

        </div>

    </div>

);



const DaimyoListModal = ({ provinces, daimyoStats, alliances, ceasefires, relations, onClose, playerDaimyoId, coalition, onViewOnMap }) => {

  const activeDaimyos = Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor').map(id => {

    const count = provinces.filter(p => p.ownerId === id).length;

    const stats = daimyoStats[id];

    return { id, ...DAIMYO_INFO[id], count, stats };

  }).sort((a,b) => b.stats.fame - a.stats.fame);



  return (

    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

      <div className="bg-stone-800 text-white p-6 rounded-xl border border-stone-600 shadow-2xl w-full max-w-6xl h-3/4 flex flex-col">

        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><Users size={24} /> 勢力一覧</h3><button onClick={onClose}><XCircle size={24}/></button></div>

        <div className="flex-1 overflow-y-auto">

          <table className="w-full text-sm text-left">

            <thead className="text-xs text-stone-400 uppercase bg-stone-700 sticky top-0"><tr><th className="p-2">大名</th><th className="p-2">名声</th><th className="p-2">国数</th><th className="p-2">金</th><th className="p-2">兵糧</th><th className="p-2">役職・官位</th><th className="p-2">関係</th><th className="p-2">地図</th></tr></thead>

            <tbody>

              {activeDaimyos.map((d) => (

                <tr key={d.id} className="border-b border-stone-700 hover:bg-stone-700/50">

                  <td className="p-2 flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${d.color}`}></span>{d.name}</td>

                  <td className="p-2 font-mono text-purple-300">{d.stats.fame}</td><td className="p-2 font-mono">{d.count}</td><td className="p-2 font-mono text-yellow-300">{d.stats.gold}</td><td className="p-2 font-mono text-green-300">{d.stats.rice}</td>

                  <td className="p-2 text-xs">

                     {d.stats.titles.map(t=><div key={t} className="bg-yellow-900/50 text-yellow-200 px-1 rounded border border-yellow-700 inline-block mr-1">{t}</div>)}

                     {d.stats.rank && <div className="bg-purple-900/50 text-purple-200 px-1 rounded border border-purple-700 inline-block">{d.stats.rank}</div>}

                  </td>

                  <td className="p-2">{d.id === playerDaimyoId ? '-' : relations[playerDaimyoId][d.id]}</td>

                  <td className="p-2"><button onClick={() => onViewOnMap(d.id)} className="p-1 bg-stone-600 rounded"><Eye size={14}/></button></td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};



const TroopSelector = ({ maxTroops, onConfirm, onCancel, type }) => {

  const [amount, setAmount] = useState(Math.floor(maxTroops / 2));

  return (

    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

      <div className="bg-stone-800 text-white p-6 rounded-xl border border-stone-600 shadow-2xl w-full max-w-sm">

        <h3 className="text-xl font-bold mb-4">{type === 'attack' ? '出陣' : '輸送'}兵数</h3>

        <div className="text-center mb-6 text-4xl font-mono font-bold text-yellow-400">{amount}</div>

        <input type="range" min="1" max={maxTroops-1} value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} className="w-full h-2 bg-stone-600 rounded-lg appearance-none cursor-pointer mb-6" />

        <div className="flex gap-4"><button onClick={onCancel} className="flex-1 py-2 bg-stone-600 rounded">キャンセル</button><button onClick={() => onConfirm(amount)} className="flex-1 py-2 bg-blue-600 rounded font-bold">決定 (消費:1AP)</button></div>

      </div>

    </div>

  );

};



const BattleScene = ({ battleData, onFinish }) => {

  const [logs, setLogs] = useState(["合戦開始！"]);

  const [atkTroops, setAtkTroops] = useState(battleData?.attackerAmount || 0);

  const [defTroops, setDefTroops] = useState(battleData?.defender?.troops || 0);

  const [phase, setPhase] = useState('fighting');

  const [round, setRound] = useState(0);

  

  const attackerDaimyo = DAIMYO_INFO[battleData.attacker.ownerId];

  const defenderDaimyo = DAIMYO_INFO[battleData.defender.ownerId];



  useEffect(() => {

    if (phase !== 'fighting') return;

    const timer = setTimeout(() => {

        if (atkTroops <= 0 || defTroops <= 0 || round >= 10) {

            setPhase('result');

            if (atkTroops <= 0) setLogs(prev => [...prev, "攻撃軍 敗走！"]);

            else if (defTroops <= 0) setLogs(prev => [...prev, "防衛軍 壊滅！"]);

            else setLogs(prev => [...prev, "日没！ 引き分け（痛み分け）"]);

        } else {

            setRound(r => r + 1);

            // 簡易戦闘ロジック

            const dmgA = Math.floor(atkTroops * 0.15 * (0.8 + Math.random() * 0.4));

            const dmgD = Math.floor(defTroops * 0.15 * (0.8 + Math.random() * 0.4));

            setAtkTroops(prev => Math.max(0, prev - dmgD));

            setDefTroops(prev => Math.max(0, prev - dmgA));

            setLogs(prev => [...prev, `第${round + 1}合: 攻${dmgA} / 防${dmgD}`]);

        }

    }, 1000);

    return () => clearTimeout(timer);

  }, [atkTroops, defTroops, phase, round]);



  return (

    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col items-center justify-center p-4 animate-fade-in">

        <div className="flex justify-between w-full max-w-4xl items-center mb-8">

            <div className="flex flex-col items-center">

                <div className={`w-24 h-24 rounded-full ${attackerDaimyo.color} flex items-center justify-center border-4 border-white shadow-[0_0_20px_rgba(255,0,0,0.5)] mb-2 relative`}>

                    <span className="text-3xl font-bold">{attackerDaimyo.name[0]}</span>

                    <div className="absolute -bottom-2 bg-red-700 px-2 rounded-full text-xs font-bold border border-red-400">攻撃軍</div>

                </div>

                <div className="text-xl font-bold mb-1">{attackerDaimyo.name}家</div>

                <div className="text-4xl font-mono font-bold text-red-400 flex items-center gap-2"><Sword size={32}/> {atkTroops}</div>

            </div>



            <div className="flex flex-col items-center justify-center">

                 <div className="text-6xl font-black italic text-yellow-500 mb-2">VS</div>

                 <div className="text-xl font-bold text-stone-400">Round {round}/10</div>

            </div>



            <div className="flex flex-col items-center">

                <div className={`w-24 h-24 rounded-full ${defenderDaimyo.color} flex items-center justify-center border-4 border-white shadow-[0_0_20px_rgba(0,0,255,0.5)] mb-2 relative`}>

                    <span className="text-3xl font-bold">{defenderDaimyo.name[0]}</span>

                    <div className="absolute -bottom-2 bg-blue-700 px-2 rounded-full text-xs font-bold border border-blue-400">防衛軍</div>

                </div>

                <div className="text-xl font-bold mb-1">{defenderDaimyo.name}家</div>

                <div className="text-4xl font-mono font-bold text-blue-400 flex items-center gap-2"><Shield size={32}/> {defTroops}</div>

            </div>

        </div>



        <div className="w-full max-w-2xl bg-stone-900/80 border border-stone-600 rounded-lg h-48 overflow-y-auto p-4 mb-6 font-mono text-sm">

            {logs.slice().reverse().map((l, i) => (

                <div key={i} className={`mb-1 ${l.includes('勝利') ? 'text-yellow-400 font-bold text-lg' : 'text-stone-300'}`}>{l}</div>

            ))}

        </div>

        {phase === 'result' && <button onClick={() => onFinish({ attackerRemaining: atkTroops, defenderRemaining: defTroops })} className="px-10 py-4 bg-yellow-600 text-black text-xl font-bold rounded-full animate-pulse shadow-lg hover:scale-105 transition-transform">結果を確認</button>}

    </div>

  );

};



// --- サブコンポーネント (マップ・ポップアップ・HUD) ---



const GameMap = ({ provinces, viewingRelationId, playerDaimyoId, alliances, ceasefires, coalition, selectedProvinceId, attackSourceId, transportSourceId, onSelectProvince }) => {

    // 視点ID決定

    const currentViewId = viewingRelationId || playerDaimyoId;



    return (

        <svg viewBox="0 0 4000 2400" className="w-[4000px] h-[2400px] select-none overflow-visible">

            {/* 接続線 */}

            {provinces.map(p => p.neighbors.map(nid => {

                const n = provinces.find(neighbor => neighbor.id === nid);

                if (!n || p.id > n.id) return null;

                const isSeaRoute = SEA_ROUTES.some(pair => (pair[0]===p.id && pair[1]===n.id) || (pair[1]===p.id && pair[0]===n.id));

                return <line key={`${p.id}-${n.id}`} x1={p.cx} y1={p.cy} x2={n.cx} y2={n.cy} stroke={isSeaRoute ? "#0ea5e9" : "white"} strokeWidth={isSeaRoute ? "2" : "1"} strokeDasharray={isSeaRoute ? "6,4" : "3,3"} opacity={isSeaRoute ? "0.6" : "0.3"} />;

            }))}

            

            {/* 国（ノード） */}

            {provinces.map((p) => {

                const daimyo = DAIMYO_INFO[p.ownerId] || { fill: '#6b7280' };

                const isSelected = selectedProvinceId === p.id;

                

                let strokeColor = "#fff"; 

                let strokeWidth = "1";

                let radius = 24;



                // 関係性による色分け

                if (currentViewId && p.ownerId !== currentViewId && p.ownerId !== 'Minor') {

                    const isAllied = alliances[currentViewId]?.includes(p.ownerId);

                    const isCeasefire = ceasefires[currentViewId]?.[p.ownerId] > 0;

                    const isCoalitionMember = coalition?.members.includes(p.ownerId);

                    const amICoalitionMember = coalition?.members.includes(currentViewId);



                    if (isAllied) { strokeColor = "#3b82f6"; strokeWidth = "3"; }

                    else if (isCoalitionMember && amICoalitionMember) { strokeColor = "#facc15"; strokeWidth = "3"; }

                    else if (isCeasefire) { strokeColor = "#22c55e"; strokeWidth = "3"; }

                    else if (coalition?.target === p.ownerId && amICoalitionMember) { strokeColor = "#ef4444"; strokeWidth = "3"; }

                }



                // 選択・ターゲット状態

                const isTargetable = attackSourceId && provinces.find(pr => pr.id === attackSourceId)?.neighbors.includes(p.id) && p.ownerId !== playerDaimyoId;

                const isTransportTarget = transportSourceId && provinces.find(pr => pr.id === transportSourceId)?.neighbors.includes(p.id) && p.ownerId === playerDaimyoId;



                if (isSelected || attackSourceId === p.id || transportSourceId === p.id) { strokeColor = "#facc15"; strokeWidth = "4"; radius = 28; }

                else if (isTargetable) { strokeColor = "#ef4444"; strokeWidth = "4"; }

                else if (isTransportTarget) { strokeColor = "#3b82f6"; strokeWidth = "4"; }



                return (

                    <g key={p.id} onClick={() => onSelectProvince(p.id, isTargetable, isTransportTarget)} className="cursor-pointer transition-all duration-300">

                        <circle cx={p.cx} cy={p.cy} r={radius} fill={daimyo.fill} stroke={strokeColor} strokeWidth={strokeWidth} className={(isTargetable || isTransportTarget) ? 'animate-pulse' : ''} />

                        <text x={p.cx + (p.labelOffset?.x || 0)} y={p.cy + (p.labelOffset?.y || 0) - 8} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" className="pointer-events-none drop-shadow-md" style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.8)' }}>{p.name}</text>

                        <g transform={`translate(${p.cx-15}, ${p.cy+5})`} className="pointer-events-none"><rect x="0" y="0" width="30" height="18" rx="4" fill="rgba(0,0,0,0.5)" /><text x="15" y="13" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{p.troops}</text></g>

                        {p.loyalty < 30 && <text x={p.cx + 20} y={p.cy - 20} className="animate-bounce" fontSize="16">🔥</text>}

                        {isTargetable && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">攻</text>}

                        {isTransportTarget && <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="28" fill="white" fontWeight="bold" className="animate-pulse pointer-events-none">輸</text>}

                        {coalition?.target === p.ownerId && <text x={p.cx} y={p.cy-30} className="animate-pulse" fontSize="20">🎯</text>}

                    </g>

                );

            })}

        </svg>

    );

};



const ProvincePopup = ({ selectedProvince, daimyoStats, playerDaimyoId, isPlayerTurn, viewingRelationId, shogunId, alliances, ceasefires, coalition, onClose, onAction }) => {

    if (!selectedProvince) return null;

    const p = selectedProvince;

    const isOwned = p.ownerId === playerDaimyoId;

    const daimyo = DAIMYO_INFO[p.ownerId] || { name: '不明', color: 'bg-gray-500' };

    const stats = daimyoStats[p.ownerId];

    const [tab, setTab] = useState('military');



    const canInteract = !viewingRelationId && isPlayerTurn;

    const isAllied = alliances[playerDaimyoId]?.includes(p.ownerId);

    const isCeasefire = ceasefires[playerDaimyoId]?.[p.ownerId] > 0;



    // APバッジコンポーネント

    const CostBadge = ({ ap = 1 }) => (

        ap > 0 ? <span className="absolute top-0 right-0 bg-yellow-600 text-black text-[9px] px-1 rounded-bl-md font-bold flex items-center">⚡{ap}</span> : null

    );



    return (

        <div className="fixed top-[100px] left-[20px] z-30 w-80 bg-stone-800/95 text-white p-4 rounded-lg border border-stone-500 shadow-2xl backdrop-blur-sm animate-fade-in max-h-[calc(100vh-120px)] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>

            <div className="flex justify-between items-center border-b border-stone-600 pb-2 mb-2">

                <div>

                    <span className="font-bold text-lg">{p.name}</span>

                    <span className={`ml-2 text-xs ${daimyo.color} px-2 py-0.5 rounded text-white`}>{daimyo.name}</span>

                    {isAllied && <span className="ml-1 text-xs bg-blue-600 px-1 rounded">同盟</span>}

                    {isCeasefire && <span className="ml-1 text-xs bg-green-700 px-1 rounded">停戦</span>}

                    {shogunId === p.ownerId && <span className="ml-1 text-xs bg-yellow-600 px-1 rounded">将軍</span>}

                </div>

                <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>

            </div>

            

            {/* 情報表示 */}

            <div className="grid grid-cols-3 gap-1 mb-2 text-xs bg-black/30 p-2 rounded">

                <div className="flex items-center gap-1 text-yellow-300"><Coins size={10}/>{stats.gold}</div>

                <div className="flex items-center gap-1 text-green-300"><Wheat size={10}/>{stats.rice}</div>

                <div className="flex items-center gap-1 text-purple-300"><Crown size={10}/>{stats.fame}</div>

            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">

                <div>兵数: {p.troops}</div><div>防御: {p.defense}</div>

                <div>訓練: {p.training}</div><div>民忠: {p.loyalty}</div>

                <div>商業: {p.commerce}</div><div>石高: {p.agriculture}</div>

                <div className="col-span-2">行動力: {p.actionsLeft}/3</div>

            </div>



            {/* アクションボタン */}

            {canInteract ? (

                isOwned ? (

                    <div>

                        <div className="flex border-b border-stone-600 mb-2">

                             {['military', 'domestic', 'fame'].map(t => (

                                 <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1 text-xs font-bold ${tab===t ? 'bg-stone-600 text-white' : 'text-stone-400'}`}>

                                     {t==='military'?'軍事':t==='domestic'?'内政':'名声'}

                                 </button>

                             ))}

                        </div>

                        <div className="grid grid-cols-2 gap-2">

                            {tab === 'military' && (

                                <>

                                <button onClick={() => onAction('attack', p.id)} className="cmd-btn relative col-span-2 bg-red-900/50 border-red-700 text-red-100">出陣 <span className="text-[10px] ml-1">({COSTS.attack.gold}/{COSTS.attack.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('transport', p.id)} className="cmd-btn relative col-span-2 bg-blue-900/50 border-blue-700 text-blue-100">輸送 <span className="text-[10px] ml-1">({COSTS.move.gold}/{COSTS.move.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('recruit', p.id)} className="cmd-btn relative bg-blue-900/50 border-blue-700 text-blue-100">徴兵 <span className="text-[10px] ml-1">({COSTS.recruit.gold}/{COSTS.recruit.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('train', p.id)} className="cmd-btn relative bg-orange-900/50 border-orange-700 text-orange-100">訓練 <span className="text-[10px] ml-1">({COSTS.train.gold})</span><CostBadge/></button>

                                <button onClick={() => onAction('fortify', p.id)} className="cmd-btn relative bg-stone-700 border-stone-500 text-stone-100 col-span-2">普請 <span className="text-[10px] ml-1">({COSTS.fortify.gold})</span><CostBadge/></button>

                                </>

                            )}

                            {tab === 'domestic' && (

                                <>

                                <button onClick={() => onAction('develop', p.id)} className="cmd-btn relative bg-yellow-900/50 border-yellow-700 text-yellow-100">商業 <span className="text-[10px] ml-1">({COSTS.develop.gold})</span><CostBadge/></button>

                                <button onClick={() => onAction('cultivate', p.id)} className="cmd-btn relative bg-green-900/50 border-green-700 text-green-100">開墾 <span className="text-[10px] ml-1">({COSTS.cultivate.gold}/{COSTS.cultivate.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('pacify', p.id)} className="cmd-btn relative bg-pink-900/50 border-pink-700 text-pink-100 col-span-2">施し <span className="text-[10px] ml-1">({COSTS.pacify.gold}/{COSTS.pacify.rice})</span><CostBadge/></button>

                                <button onClick={() => onAction('market', p.id)} className="cmd-btn relative bg-orange-700 border-orange-500 text-white col-span-2">楽市楽座 <span className="text-[9px] ml-1 opacity-80">(FREE)</span></button>

                                <button onClick={() => onAction('trade', p.id)} className="cmd-btn relative bg-teal-800 border-teal-500 text-white col-span-2">貿易 <span className="text-[10px] ml-1">({COSTS.trade.gold})</span><CostBadge/></button>

                                </>

                            )}

                            {tab === 'fame' && (

                                <>

                                <button onClick={() => onAction('donate', p.id)} className="cmd-btn relative bg-purple-900/60 border-purple-600 text-purple-100 col-span-2 py-3">献金<CostBadge/></button>

                                <button onClick={() => onAction('titles', p.id)} className="cmd-btn relative bg-yellow-600 border-yellow-300 text-black font-bold col-span-2 py-3">役職・官位 <span className="text-[9px] opacity-70 block font-normal">(確認無料/申請時消費)</span></button>

                                </>

                            )}

                        </div>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 gap-2">

                        {!isAllied && !isCeasefire && <button onClick={() => onAction('alliance', p.id)} className="cmd-btn relative bg-indigo-700 border-indigo-500 text-white h-10">同盟申請 <span className="text-[10px] ml-1">(500)</span><CostBadge/></button>}

                        {!isCeasefire && <button onClick={() => onAction('negotiate', p.id)} className="cmd-btn relative bg-pink-800 border-pink-500 text-white h-10">{isAllied ? '外交' : '交渉'}<CostBadge/></button>}

                        {isCeasefire && <div className="text-center text-green-300 bg-green-900/30 border border-green-700 p-2 rounded">停戦中</div>}

                    </div>

                )

            ) : (

                <div className="text-center p-4 bg-stone-900/50 rounded text-stone-400">操作不可</div>

            )}

        </div>

    );

};



const ResourceBar = ({ stats, turn, isPlayerTurn, shogunId, playerId, coalition }) => (

    <>

        <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">

            <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-stone-600 shadow-lg flex items-center gap-4 text-white">

                <div className="flex flex-col"><span className="text-xs text-stone-400">資金</span><div className="flex items-center gap-1 text-yellow-400 font-bold font-mono text-xl"><Coins size={18}/> {stats?.gold || 0}</div></div>

                <div className="w-px h-8 bg-stone-600"></div>

                <div className="flex flex-col"><span className="text-xs text-stone-400">兵糧</span><div className="flex items-center gap-1 text-green-400 font-bold font-mono text-xl"><Wheat size={18}/> {stats?.rice || 0}</div></div>

                <div className="w-px h-8 bg-stone-600"></div>

                <div className="flex flex-col"><span className="text-xs text-stone-400">名声</span><div className="flex items-center gap-1 text-purple-400 font-bold font-mono text-xl"><Crown size={18}/> {stats?.fame || 0}</div></div>

                {shogunId === playerId && <div className="ml-2 bg-yellow-600 px-2 py-1 rounded text-xs font-bold text-black border border-yellow-400 animate-pulse">将軍</div>}

            </div>

        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2 pointer-events-auto">

             <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-stone-600 shadow-lg text-right pointer-events-none text-white">

                <div className="text-xs text-stone-400">{getFormattedDate(turn)}</div>

                <div className={`text-lg font-bold ${isPlayerTurn ? 'text-red-500 animate-pulse' : 'text-stone-300'}`}>{isPlayerTurn ? "【あなたの手番】" : `他国 行動中...`}</div>

            </div>

        </div>

        {coalition && (

            <div className="absolute top-20 left-4 z-10 pointer-events-none animate-fade-in">

                <div className="bg-red-900/80 backdrop-blur-md p-2 rounded-lg border border-red-500 shadow-lg flex items-center gap-2">

                    <Target className="text-red-300" size={20} />

                    <div><div className="text-xs text-red-200 font-bold">対{DAIMYO_INFO[coalition.target]?.name}包囲網</div><div className="text-[10px] text-stone-300">残: {coalition.duration}季</div></div>

                </div>

            </div>

        )}

    </>

);



const ControlPanel = ({ lastLog, onHistoryClick, onEndTurn, onCancelSelection, isPlayerTurn, hasSelection, onViewBack, viewingRelationId, onDaimyoList }) => (

    <>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-3/4 max-w-2xl pointer-events-auto flex items-center gap-2">

            <div className="flex-1 bg-black/70 text-white px-4 py-2 rounded-full text-center border border-stone-500 shadow-lg text-sm flex items-center justify-center">

                <ScrollText className="inline mr-2 w-4 h-4 text-yellow-400"/> <span className="truncate">{lastLog}</span>

            </div>

            <button onClick={onHistoryClick} className="bg-stone-700 hover:bg-stone-600 text-white p-2 rounded-full border border-stone-500"><History size={20}/></button>

        </div>

        

        <div className="absolute top-4 right-44 z-10">

             <button onClick={onDaimyoList} className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-stone-600 hover:bg-stone-700 text-stone-300"><Users size={20}/></button>

        </div>



        {viewingRelationId && (

            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">

                <button onClick={onViewBack} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-xl border-2 border-indigo-300 flex items-center gap-2 animate-bounce">自軍視点に戻る</button>

            </div>

        )}



        {isPlayerTurn && !viewingRelationId && <button onClick={onEndTurn} className="absolute bottom-8 right-8 z-20 bg-red-700 hover:bg-red-600 text-white px-6 py-4 rounded-full font-bold shadow-xl border-4 border-stone-800 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">行動終了 <ArrowRightCircle size={24}/></button>}

        {hasSelection && <button onClick={onCancelSelection} className="absolute bottom-8 left-8 z-20 bg-stone-700 hover:bg-stone-600 text-white px-6 py-4 rounded-full font-bold shadow-xl border-4 border-stone-800 transition-transform hover:scale-105">選択キャンセル</button>}

    </>

);





// --- Main App Component ---



const App = () => {

  // 1. State Definitions

  const [provinces, setProvinces] = useState(INITIAL_PROVINCES);

  const [daimyoStats, setDaimyoStats] = useState(INITIAL_RESOURCES);

  const [alliances, setAlliances] = useState(INITIAL_ALLIANCES);

  const [ceasefires, setCeasefires] = useState(INITIAL_CEASEFIRES);

  const [relations, setRelations] = useState(INITIAL_RELATIONS);

  const [coalition, setCoalition] = useState(null);

  

  const [shogunId, setShogunId] = useState('Ashikaga'); 

  const [playerDaimyoId, setPlayerDaimyoId] = useState(null); 

  const [turn, setTurn] = useState(1);

  const [gameState, setGameState] = useState('playing'); 



  // UI State

  const [selectedProvinceId, setSelectedProvinceId] = useState(null);

  const [attackSourceId, setAttackSourceId] = useState(null);

  const [transportSourceId, setTransportSourceId] = useState(null);

  const [viewingRelationId, setViewingRelationId] = useState(null);

  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 0.6 });

  const [isDragging, setIsDragging] = useState(false);

  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });



  // Modal State

  const [modalState, setModalState] = useState({ type: null, data: null }); // 'donate', 'trade', 'market', 'negotiate', 'titles', 'list', 'battle', 'troop', 'request', 'history'

  const [logs, setLogs] = useState([]);

  const [lastLog, setLastLog] = useState('大名を選択して天下統一を目指せ。');



  // Turn Logic State

  const [turnOrder, setTurnOrder] = useState([]);

  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);

  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  const provincesRef = useRef(provinces);



  // 2. Effects

  useEffect(() => { provincesRef.current = provinces; }, [provinces]);



  useEffect(() => {

    if (!playerDaimyoId) return;

    const playerCount = provinces.filter(p => p.ownerId === playerDaimyoId).length;

    if (playerCount === provinces.length) setGameState('won');

    else if (playerCount === 0) setGameState('lost');

  }, [provinces, playerDaimyoId]);



  useEffect(() => { if (playerDaimyoId && turnOrder.length === 0) startNewSeason(); }, [playerDaimyoId]);

  

  useEffect(() => {

      if (turn > 1) { showLog(`${getFormattedDate(turn)}になりました。`); startNewSeason(); }

  }, [turn]);



  useEffect(() => {

      if (turnOrder.length === 0 || currentTurnIndex === -1) return;

      if (currentTurnIndex >= turnOrder.length) { setTurn(t => t + 1); return; }

      const currentDaimyo = turnOrder[currentTurnIndex];

      // 滅亡済みチェック

      if (!provinces.some(p => p.ownerId === currentDaimyo)) { advanceTurn(); return; }

      

      if (currentDaimyo === playerDaimyoId) {

          setIsPlayerTurn(true); showLog(`我が軍の手番です。`);

      } else {

          setIsPlayerTurn(false); setTimeout(() => processAiTurn(currentDaimyo), 800);

      }

  }, [currentTurnIndex, turnOrder]);



  // 3. Helper Logic

  const showLog = (text) => { setLastLog(text); setLogs(prev => [...prev, `${getFormattedDate(turn)}: ${text}`]); };

  

  const updateResource = (id, g, r, f=0, d=0) => {

      setDaimyoStats(prev => ({...prev, [id]: { ...prev[id], gold: Math.max(0,(prev[id].gold||0)+g), rice: Math.max(0,(prev[id].rice||0)+r), fame: Math.max(0,(prev[id].fame||0)+f) }}));

  };

  const updateRelation = (target, diff) => setRelations(prev => ({...prev, [playerDaimyoId]: {...(prev[playerDaimyoId]||{}), [target]: Math.min(100, Math.max(0, (prev[playerDaimyoId]?.[target]||50)+diff))}}));

  const consumeAction = (pid) => setProvinces(prev => prev.map(p => p.id === pid ? { ...p, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p));



  const startNewSeason = () => {

      const isAutumn = (turn - 1) % 4 === 2;

      setCeasefires(prev => {

          const next = { ...prev };

          Object.keys(next).forEach(k => Object.keys(next[k]).forEach(t => { if(next[k][t]>0) next[k][t]--; }));

          return next;

      });

      if (coalition) {

          if (coalition.duration <= 1) { setCoalition(null); showLog("包囲網が解散しました。"); }

          else setCoalition(prev => ({...prev, duration: prev.duration - 1}));

      }

      setProvinces(curr => curr.map(p => ({...p, actionsLeft: 3})));

      Object.keys(DAIMYO_INFO).forEach(id => {

          const owned = provincesRef.current.filter(p => p.ownerId === id);

          // 内政収入

          if (owned.length) {

              const commerceIncome = owned.reduce((s,p)=>s+p.commerce,0);

              const agIncome = isAutumn ? owned.reduce((s,p)=>s+p.agriculture,0)*2 : 0;

              updateResource(id, commerceIncome, agIncome);

          }

      });

      setTimeout(determineTurnOrder, 500);

  };



  const determineTurnOrder = () => {

      const active = Object.keys(DAIMYO_INFO).filter(id => id !== 'Minor' && provincesRef.current.some(p => p.ownerId === id));

      active.sort((a,b) => (daimyoStats[b]?.fame||0) - (daimyoStats[a]?.fame||0));

      setTurnOrder(active); setCurrentTurnIndex(0);

  };



  const advanceTurn = () => { setSelectedProvinceId(null); setAttackSourceId(null); setTransportSourceId(null); setCurrentTurnIndex(prev => prev + 1); };



  const processAiTurn = (aiId) => {

      let changes = {};

      setProvinces(curr => {

          const next = curr.map(p => ({...p}));

          const myProvs = next.filter(p => p.ownerId === aiId);

          let { gold, rice } = daimyoStats[aiId] || { gold:0, rice:0 };



          myProvs.forEach(p => {

              // 徴兵

              if (gold > COSTS.recruit.gold && p.troops < 300) { 

                  gold -= COSTS.recruit.gold; p.troops += 150;

              }

              // 攻撃判断

              const targets = p.neighbors.map(n => next.find(x => x.id === n)).filter(n => n && n.ownerId !== aiId && !alliances[aiId]?.includes(n.ownerId));

              if (targets.length && rice > COSTS.attack.rice && p.troops > 400 && Math.random() > 0.7) { 

                   const target = targets[0];

                   rice -= COSTS.attack.rice;

                   let atk = Math.floor(p.troops * 0.6); p.troops -= atk;

                   let def = target.troops;

                   // 簡易戦闘 (最大10ラウンド)

                   for(let r=0; r<10; r++) {

                       if(atk<=0 || def<=0) break;

                       atk -= Math.floor(def*0.1); 

                       def -= Math.floor(atk*0.15); 

                   }

                   if (def <= 0) { target.ownerId = aiId; target.troops = Math.max(1, atk); showLog(`${DAIMYO_INFO[aiId].name}が${target.name}を制圧！`); }

                   else { target.troops = def; }

              }

          });

          setTimeout(() => updateResource(aiId, gold - (daimyoStats[aiId].gold), rice - (daimyoStats[aiId].rice)), 0);

          return next;

      });

      setTimeout(advanceTurn, 500);

  };



  // 4. Action Handlers (Categorized)

  

  const handleWheel = (e) => {

    const scaleAmount = -e.deltaY * 0.001;

    const newScale = Math.min(Math.max(0.2, mapTransform.scale + scaleAmount), 3);

    const ratio = newScale / mapTransform.scale;

    const newX = e.clientX - (e.clientX - mapTransform.x) * ratio;

    const newY = e.clientY - (e.clientY - mapTransform.y) * ratio;

    setMapTransform({ x: newX, y: newY, scale: newScale });

  };



  // Domestic Actions

  const handleDomesticAction = (type, pid) => {

      const p = provinces.find(x => x.id === pid);

      // 即時実行系のアクションのみ、ここで行動力をチェックして消費

      const isImmediate = ['develop', 'cultivate', 'pacify', 'fortify'].includes(type);

      

      if (isImmediate) {

          if (p.actionsLeft <= 0) return showLog("行動力不足");

          const cost = COSTS[type];

          const stats = daimyoStats[playerDaimyoId];

          if (stats.gold < cost.gold || stats.rice < cost.rice) return showLog("資源不足");



          updateResource(playerDaimyoId, -cost.gold, -cost.rice);

          consumeAction(pid);



          if (type === 'develop') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, commerce: pr.commerce + cost.boost} : pr)); showLog("商業開発完了"); }

          if (type === 'cultivate') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, agriculture: pr.agriculture + cost.boost} : pr)); showLog("開墾完了"); }

          if (type === 'pacify') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, loyalty: Math.min(100, pr.loyalty + cost.boost)} : pr)); showLog("施しを行いました"); }

          if (type === 'fortify') { setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, defense: pr.defense + cost.boost} : pr)); showLog("普請完了"); }

      } else {

          

          if (type === 'market') setModalState({ type: 'market', data: { pid } });

          if (type === 'trade') setModalState({ type: 'trade', data: { pid } });

          if (type === 'donate') setModalState({ type: 'donate', data: { pid } });

          if (type === 'titles') setModalState({ type: 'titles', data: { pid } });

      }

  };



  // Military Actions

  const handleMilitaryAction = (type, pid) => {

      const p = provinces.find(x => x.id === pid);

      if (p.actionsLeft <= 0) return showLog("行動力不足");

      

      if (type === 'train') {

          if (daimyoStats[playerDaimyoId].gold < COSTS.train.gold) return showLog("金不足");

          updateResource(playerDaimyoId, -COSTS.train.gold, 0);

          setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, training: Math.min(100, pr.training + COSTS.train.boost)} : pr));

          consumeAction(pid); showLog("訓練完了");

      }

      if (type === 'recruit') {

           const c = COSTS.recruit;

           if (daimyoStats[playerDaimyoId].gold < c.gold || daimyoStats[playerDaimyoId].rice < c.rice) return showLog("資源不足");

           updateResource(playerDaimyoId, -c.gold, -c.rice);

           setProvinces(prev => prev.map(pr => pr.id === pid ? {...pr, troops: pr.troops + c.troops, loyalty: pr.loyalty - 5} : pr));

           consumeAction(pid); showLog("徴兵完了");

      }

      if (type === 'attack') { setAttackSourceId(pid); setTransportSourceId(null); setSelectedProvinceId(null); showLog("攻撃目標を選択してください"); }

      if (type === 'transport') { setTransportSourceId(pid); setAttackSourceId(null); setSelectedProvinceId(null); showLog("輸送先を選択してください"); }

  };



  const handleTroopAction = (amount) => {

      const { type, sourceId, targetId } = modalState.data;

      setModalState({ type: null });

      const src = provinces.find(p => p.id === sourceId);

      const tgt = provinces.find(p => p.id === targetId);



      if (type === 'transport') {

          updateResource(playerDaimyoId, -COSTS.move.gold, -COSTS.move.rice);

          setProvinces(prev => prev.map(p => {

              if (p.id === sourceId) return {...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft-1)};

              if (p.id === targetId) return {...p, troops: p.troops + amount};

              return p;

          }));

          showLog("輸送完了");

      } else if (type === 'attack') {

          updateResource(playerDaimyoId, -COSTS.attack.gold, -COSTS.attack.rice);

          setProvinces(prev => prev.map(p => p.id === sourceId ? {...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft-1)} : p));

          setModalState({ type: 'battle', data: { attacker: src, defender: tgt, attackerAmount: amount } });

      }

      setAttackSourceId(null); setTransportSourceId(null);

  };



  // Diplomatic & Map Interaction

  const handleMapSelect = (pid, isTargetable, isTransportTarget) => {

      if (isDragging) return;

      if (isTargetable || isTransportTarget) {

          const type = isTargetable ? 'attack' : 'transport';

          const srcId = isTargetable ? attackSourceId : transportSourceId;

          const src = provinces.find(p => p.id === srcId);

          setModalState({ type: 'troop', data: { type, sourceId: srcId, targetId: pid, maxTroops: src.troops } });

      } else {

          if (!attackSourceId && !transportSourceId) setSelectedProvinceId(pid === selectedProvinceId ? null : pid);

      }

  };



  const handleDiplomacy = (type, pidOrTargetId) => {

      const p = provinces.find(x => x.id === selectedProvinceId);

      if (p && p.actionsLeft <= 0) return showLog("行動力不足"); // 外交の入り口でチェック（ただし交渉画面を開くのはタダにしたい場合はここを緩める）



      if (type === 'alliance') {

         const targetId = provinces.find(x => x.id === pidOrTargetId)?.ownerId;

         const cost = 500;

         if (daimyoStats[playerDaimyoId].gold < cost) return showLog("金不足");

         updateResource(playerDaimyoId, -cost, 0);

         setAlliances(prev => ({...prev, [playerDaimyoId]: [...prev[playerDaimyoId], targetId], [targetId]: [...prev[targetId], playerDaimyoId]}));

         showLog("同盟締結"); consumeAction(selectedProvinceId);

      }

      if (type === 'negotiate') {

          // 交渉画面を開くのはタダにするため、ここでは消費しない

          setModalState({ type: 'negotiate', data: { targetId: pidOrTargetId, provinceId: selectedProvinceId } });

      }

  };



  // 5. Render

  if (!playerDaimyoId) return <StartScreen onSelectDaimyo={setPlayerDaimyoId} />;



  return (

    <div className="relative w-full h-screen overflow-hidden font-sans select-none text-stone-100 flex flex-col items-center justify-center bg-[#0f172a]">

        {/* 背景 */}

        <div className="absolute inset-0 z-0 bg-sky-900" style={{ backgroundImage: `radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.03) 21%, transparent 22%), radial-gradient(circle at 0% 50%, transparent 20%, rgba(255,255,255,0.03) 21%, transparent 22%), radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.2) 100%)`, backgroundSize: '100px 100px' }}><div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }}></div></div>



        {/* HUD */}

        <ResourceBar stats={daimyoStats[playerDaimyoId]} turn={turn} isPlayerTurn={isPlayerTurn} shogunId={shogunId} playerId={playerDaimyoId} coalition={coalition} />



        {/* メインマップ */}

        <div className="relative z-0 w-full h-full overflow-hidden cursor-move" 

             onMouseDown={(e) => { setDragStartPos({x:e.clientX, y:e.clientY}); setIsDragging(false); }}

             onMouseMove={(e) => { if(e.buttons===1 && (Math.abs(e.clientX-dragStartPos.x)>5 || Math.abs(e.clientY-dragStartPos.y)>5)) { setIsDragging(true); setMapTransform(p => ({...p, x:p.x+e.movementX, y:p.y+e.movementY})); } }}

             onWheel={handleWheel}>

            <div style={{ transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})` }} className="absolute origin-top-left transition-transform duration-75">

                <GameMap 

                    provinces={provinces} viewingRelationId={viewingRelationId} playerDaimyoId={playerDaimyoId}

                    alliances={alliances} ceasefires={ceasefires} coalition={coalition}

                    selectedProvinceId={selectedProvinceId} attackSourceId={attackSourceId} transportSourceId={transportSourceId}

                    onSelectProvince={handleMapSelect}

                />

            </div>

        </div>



        {/* コントロール & ポップアップ */}

        <ProvincePopup 

            selectedProvince={selectedProvinceId ? provinces.find(p => p.id === selectedProvinceId) : null}

            daimyoStats={daimyoStats} playerDaimyoId={playerDaimyoId} isPlayerTurn={isPlayerTurn} viewingRelationId={viewingRelationId}

            shogunId={shogunId} alliances={alliances} ceasefires={ceasefires} coalition={coalition}

            onClose={() => setSelectedProvinceId(null)}

            onAction={(type, pid) => {

                if (['develop','cultivate','pacify','fortify','market','trade','donate','titles'].includes(type)) handleDomesticAction(type, pid);

                else if (['attack','transport','recruit','train'].includes(type)) handleMilitaryAction(type, pid);

                else handleDiplomacy(type, provinces.find(p=>p.id===pid).ownerId);

            }}

        />



        <ControlPanel 

            lastLog={lastLog} onHistoryClick={() => setModalState({type:'history'})} 

            onEndTurn={() => { setIsPlayerTurn(false); advanceTurn(); }} 

            onCancelSelection={() => { setAttackSourceId(null); setTransportSourceId(null); }}

            isPlayerTurn={isPlayerTurn} hasSelection={attackSourceId || transportSourceId}

            onViewBack={() => setViewingRelationId(null)} viewingRelationId={viewingRelationId}

            onDaimyoList={() => setModalState({type: 'list'})}

        />



        {/* モーダル表示制御 */}

        {modalState.type === 'history' && <LogHistoryModal logs={logs} onClose={() => setModalState({type: null})} />}

        {modalState.type === 'list' && <DaimyoListModal provinces={provinces} daimyoStats={daimyoStats} alliances={alliances} ceasefires={ceasefires} relations={relations} playerDaimyoId={playerDaimyoId} coalition={coalition} onClose={() => setModalState({type: null})} onViewOnMap={(id) => { setViewingRelationId(id); setModalState({type:null}); }} />}

        {modalState.type === 'battle' && <BattleScene battleData={modalState.data} onFinish={(res) => {

             const { attacker, defender, attackerAmount } = modalState.data;

             const { attackerRemaining, defenderRemaining } = res;



             // 兵力回復計算

             const atkLost = attackerAmount - attackerRemaining;

             const atkRecovered = Math.floor(atkLost * 0.3);

             const atkReturning = attackerRemaining + atkRecovered;



             const defLost = defender.troops - defenderRemaining;

             const defRecovered = Math.floor(defLost * 0.3);

             const defFinal = defenderRemaining + defRecovered;



             setProvinces(prev => prev.map(p => {

                 // 防衛国処理

                 if (p.id === defender.id) {

                     if (defenderRemaining <= 0) {

                         return { ...p, ownerId: attacker.ownerId, troops: attackerRemaining, actionsLeft: 0, loyalty: 30, defense: Math.max(0, p.defense - 20) };

                     } else {

                         return { ...p, troops: defFinal };

                     }

                 }

                 // 攻撃元国処理

                 if (p.id === attacker.id) {

                     if (defenderRemaining <= 0) {

                         // 勝利時：出陣兵は戻らないが、回復分は戻る（あるいは占領地にいくが、ここではシンプルに元に戻す）

                         return { ...p, troops: p.troops + atkRecovered, actionsLeft: 0 };

                     } else {

                         // 敗北/引き分け時：残存兵+回復分が戻る

                         return { ...p, troops: p.troops + atkReturning, actionsLeft: 0 };

                     }

                 }

                 return p;

             }));

             

             if (defenderRemaining <= 0) {

                 showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍が${defender.name}を制圧！`);

             } else if (attackerRemaining <= 0) {

                 showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}攻略に失敗。`);

             } else {

                 showLog(`${DAIMYO_INFO[attacker.ownerId].name}軍、${defender.name}を攻めきれず撤退（引き分け）。`);

             }

             setModalState({ type: null }); 

        }} />}

        {modalState.type === 'troop' && <TroopSelector maxTroops={modalState.data.maxTroops} type={modalState.data.type} onConfirm={handleTroopAction} onCancel={() => setModalState({type: null})} />}

        

        {modalState.type === 'negotiate' && <NegotiationScene targetDaimyoId={modalState.data.targetId} targetDaimyo={DAIMYO_INFO[modalState.data.targetId]} isAllied={alliances[playerDaimyoId]?.includes(modalState.data.targetId)} onConfirm={(t) => {

            const p = provinces.find(x => x.id === modalState.data.provinceId);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.provinceId); // 実行時に消費

            

            if(t==='gift') { updateResource(playerDaimyoId, -COSTS.gift.gold, 0); updateRelation(modalState.data.targetId, 10); showLog("贈答を行いました"); }

            if(t==='ceasefire') { updateResource(playerDaimyoId, -300, 0); setCeasefires(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], [modalState.data.targetId]: 5}})); showLog("停戦成立"); }

            if(t==='threaten') { showLog("脅迫しました..."); updateRelation(modalState.data.targetId, -20); }

            if(t==='surrender') { showLog("勧告しました..."); }

            if(t==='request_aid') { showLog("援助を要請しました"); }

            if(t==='break_alliance') { showLog("同盟を破棄しました"); setAlliances(prev => ({...prev, [playerDaimyoId]: prev[playerDaimyoId].filter(id => id !== modalState.data.targetId), [modalState.data.targetId]: prev[modalState.data.targetId].filter(id => id !== playerDaimyoId)})); }

            

            setModalState({type:null});

        }} onCancel={() => setModalState({type: null})} />}

        

        {modalState.type === 'market' && <MarketModal currentGold={daimyoStats[playerDaimyoId].gold} currentRice={daimyoStats[playerDaimyoId].rice} price={getRiceMarketPrice(turn)} onClose={() => setModalState({type:null})} onTrade={(m, a, c) => {

            // 楽市楽座は消費なし

            updateResource(playerDaimyoId, m==='buy'?-c:c, m==='buy'?a:-a); setModalState({type:null}); showLog("取引完了");

        }} />}

        

        {modalState.type === 'titles' && <TitlesModal daimyoStats={daimyoStats} provinces={provinces} daimyoId={playerDaimyoId} onClose={() => setModalState({type:null})} onApply={(t) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 申請時に消費

            

            updateResource(playerDaimyoId, -COSTS.title_app.gold, 0, t.fameBonus);

            setDaimyoStats(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], titles: [...prev[playerDaimyoId].titles, t.name]}}));

            setModalState({type:null}); showLog("役職就任");

        }} onApplyRank={(r) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 申請時に消費



            updateResource(playerDaimyoId, -COSTS.rank_app.gold, 0, r.fameBonus);

            setDaimyoStats(prev => ({...prev, [playerDaimyoId]: {...prev[playerDaimyoId], rank: r.name}}));

            setModalState({type:null}); showLog("官位叙任");

        }} />}

        

        {modalState.type === 'donate' && <DonateModal currentGold={daimyoStats[playerDaimyoId].gold} shogunName={DAIMYO_INFO[shogunId]?.name} isShogun={playerDaimyoId===shogunId} onCancel={() => setModalState({type:null})} onConfirm={(tgt, amt, fame) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 実行時に消費



            updateResource(playerDaimyoId, -amt, 0, fame); setModalState({type:null}); showLog("献金完了");

        }} />}

        

        {modalState.type === 'trade' && <TradeModal onCancel={() => setModalState({type:null})} onConfirm={(t) => {

            const p = provinces.find(x => x.id === modalState.data.pid);

            if (p.actionsLeft <= 0) { showLog("行動力不足"); return; }

            consumeAction(modalState.data.pid); // 実行時に消費



            updateResource(playerDaimyoId, -COSTS.trade.gold, 0); setModalState({type:null}); showLog("貿易完了");

        }} />}



        {/* ゲームオーバー画面 */}

        {gameState !== 'playing' && (

            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">

                <div className="text-center animate-bounce mb-6">

                    {gameState === 'won' ? <><Trophy size={80} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-5xl font-bold text-yellow-400">天下統一！</h2></> : <><Skull size={80} className="text-gray-500 mx-auto mb-4" /><h2 className="text-5xl font-bold text-gray-400">落城...</h2></>}

                </div>

                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xl flex items-center gap-3"><RefreshCw size={24} /> 再挑戦</button>

            </div>

        )}



        <style>{`.cmd-btn { @apply flex items-center justify-center gap-1 py-2 px-1 rounded border shadow-sm transition-all active:translate-y-0.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed; } .animate-fade-in { animation: fadeIn 0.3s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

    </div>

  );

};



export default App;