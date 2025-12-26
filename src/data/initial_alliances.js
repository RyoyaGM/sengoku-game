// src/data/initial_alliances.js

// [大名ID1, 大名ID2] の形式で、初期同盟関係を定義します
// ここに記述されたペアは、双方向の同盟としてゲーム開始時に設定されます

export const HISTORICAL_ALLIANCES_DATA = [
    // --- 甲相駿三国同盟 (1560年時点) ---
    ['Takeda', 'Hojo'],    // 武田 - 北条
    ['Takeda', 'Imagawa'], // 武田 - 今川
    ['Hojo', 'Imagawa'],   // 北条 - 今川

    // --- 北近江の盟友 ---
    ['Azai', 'Asakura'],   // 浅井 - 朝倉

    // --- その他 地域的な協力関係 ---
    ['Mori', 'Kono'],      // 毛利 - 河野（伊予の協力関係）
    ['Shimazu', 'Sagara'], // 島津 - 相良（一時的な不可侵など）
    ['Honganji', 'Saika'], // 本願寺 - 雑賀衆
    ['Oda', 'Mizuno'], // 織田 - 水野
];