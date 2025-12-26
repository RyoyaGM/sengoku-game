// src/data/constants.js

// コスト定義（action: 1 は行動力消費あり、0 はなし）
export const COSTS = {
  // 内政
  develop: { gold: 100, rice: 0, boost: 10, action: 1 },
  cultivate: { gold: 50, rice: 50, boost: 10, action: 1 },
  pacify: { gold: 50, rice: 100, boost: 15, action: 1 },
  fortify: { gold: 80, rice: 0, boost: 10, action: 1 },
  market: { gold: 0, rice: 0, action: 0 }, // 楽市楽座はフリーアクション
  trade: { gold: 200, rice: 0, action: 1 }, // 貿易は実行時消費

  // 軍事 (強制徴兵はコスト定義外で処理されるため記述なしでOK)
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