// src/data/constants.js

// コスト定義（action: 1 は行動力消費あり、0 はなし）
export const COSTS = {
  // 内政 (UIでの自由投資制へ移行のため、基本コストは0とする)
  develop: { gold: 0, rice: 0, boost: 0, action: 1, rate: 10 }, // 投資10につき効果+1
  cultivate: { gold: 0, rice: 0, boost: 0, action: 1, rate: 10 }, // 投資10につき効果+1
  
  pacify: { gold: 50, rice: 100, boost: 15, action: 1 },
  fortify: { gold: 80, rice: 0, boost: 10, action: 1 },
  market: { gold: 0, rice: 0, action: 0 }, // 楽市楽座はフリーアクション
  trade: { gold: 200, rice: 0, action: 1 }, // 貿易は実行時消費

  // 軍事
  // B案: 初期兵力規模に合わせて、徴兵の効果とコストを5倍に引き上げ
  recruit: { gold: 150, rice: 250, troops: 500, action: 1 },
  
  train: { gold: 30, rice: 0, boost: 5, action: 1 },
  attack: { gold: 20, rice: 80, action: 1 },
  move: { gold: 10, rice: 10, action: 1 },

  // 外交・名声
  donate: { gold: 0, rice: 0, action: 1 },
  title_app: { gold: 1000, action: 1 },
  rank_app: { gold: 500, action: 1 },
  titles_check: { gold: 0, action: 0 },
  alliance: { gold: 500, action: 1 },
  negotiate: { gold: 0, action: 1 },
  gift: { gold: 200, favor: 10, action: 1 },
  coalition: { gold: 800, fameReq: 100, action: 1 },
};