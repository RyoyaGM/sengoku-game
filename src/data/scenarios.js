// src/data/scenarios.js
import { 
    INITIAL_PROVINCES, 
    INITIAL_RESOURCES, 
    INITIAL_ALLIANCES, 
    INITIAL_CEASEFIRES, 
    INITIAL_RELATIONS 
} from '../utils/initializers';
import { HISTORICAL_EVENTS } from './events';

export const SCENARIOS = [
    {
        id: '1560_okehazama',
        name: '1560年 桶狭間の戦い',
        description: '織田信長が今川義元を奇襲し、天下への足がかりを掴んだ戦い。群雄割拠の幕開け。',
        startYear: 1560,
        difficulty: '通常',
        data: {
            provinces: INITIAL_PROVINCES,
            daimyoStats: INITIAL_RESOURCES,
            alliances: INITIAL_ALLIANCES,
            ceasefires: INITIAL_CEASEFIRES,
            relations: INITIAL_RELATIONS,
            coalition: null
        },
        events: HISTORICAL_EVENTS // このシナリオで発生するイベント
    },
    // 将来的にシナリオを追加する場合はここに記述
    // {
    //     id: '1582_honnoji',
    //     name: '1582年 夢幻の如く',
    //     ...
    // }
];