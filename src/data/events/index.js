import { okehazamaEvent } from './okehazama';
import { matsudairaIndependenceEvent } from './matsudairaIndependence';
import { saitoDeathEvent } from './saitoDeath';
import { kiyosuAllianceEvent } from './kiyosuAlliance';
import { enshuRebellionEvent } from './enshuRebellion';
import { surugaInvasionEvent } from './surugaInvasion';

// イベントの定義順序
export const HISTORICAL_EVENTS = [
    okehazamaEvent,
    matsudairaIndependenceEvent,
    saitoDeathEvent,
    kiyosuAllianceEvent,
    enshuRebellionEvent,
    surugaInvasionEvent
];