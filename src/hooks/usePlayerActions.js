// src/hooks/usePlayerActions.js
import { COSTS } from '../data/constants';
import { DAIMYO_INFO } from '../data/daimyos';

export const usePlayerActions = ({
    provinces,
    setProvinces,
    daimyoStats,
    setDaimyoStats, // diplomacyBanUntilの更新などで使用
    alliances,
    setAlliances,
    relations,
    playerDaimyoId,
    turn,
    updateResource,
    showLog,
    setModalState,
    setAttackSourceId,
    setTransportSourceId,
    selectedProvinceId,
    modalState // App.jsxから渡されたmodalStateを使用
}) => {

    // --- 共通ヘルパー: 行動力の消費 ---
    const consumeAction = (pid) => {
        setProvinces(prev => prev.map(p => 
            p.id === pid ? { ...p, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p
        ));
    };

    // --- 共通ヘルパー: プレイヤーの行動可能な拠点を探す ---
    const getPlayerActionSource = () => {
        return provinces.find(p => p.ownerId === playerDaimyoId && p.actionsLeft > 0);
    };

    // --- 内政アクション ---
    const handleDomesticAction = (type, pid) => {
        const p = provinces.find(pr => pr.id === pid);
        if (p.actionsLeft <= 0 && type !== 'market' && type !== 'titles') return showLog("行動力がありません");

        if (type === 'market') return setModalState({ type: 'market' });
        if (type === 'titles') return setModalState({ type: 'titles' });
        if (type === 'donate') return setModalState({ type: 'donate' });
        if (type === 'trade') return setModalState({ type: 'trade' });

        const cost = COSTS[type];
        const stats = daimyoStats[playerDaimyoId];
        if (stats.gold < cost.gold || stats.rice < (cost.rice || 0)) return showLog("資源不足");

        updateResource(playerDaimyoId, -cost.gold, -(cost.rice || 0));
        consumeAction(pid);

        setProvinces(prev => prev.map(pr => {
            if (pr.id !== pid) return pr;
            const next = { ...pr };
            if (type === 'develop') next.commerce += cost.boost;
            if (type === 'cultivate') next.agriculture += cost.boost;
            if (type === 'fortify') next.defense += cost.boost;
            if (type === 'pacify') next.loyalty = Math.min(100, (next.loyalty || 50) + cost.boost);
            return next;
        }));
        showLog(`${DAIMYO_INFO[playerDaimyoId].name}家、${p.name}にて${type === 'develop' ? '商業発展' : type === 'cultivate' ? '開墾' : type === 'fortify' ? '普請' : type === 'pacify' ? '施し' : ''}を行いました。`);
    };

    // --- 軍事アクション (移動・徴兵・訓練) ---
    const handleMilitaryAction = (type, pid) => {
        const p = provinces.find(pr => pr.id === pid);
        if (p.actionsLeft <= 0) return showLog("行動力がありません");

        if (type === 'attack') {
            setAttackSourceId(pid);
            showLog("攻撃目標を選択してください");
            return;
        }
        if (type === 'transport') {
            setTransportSourceId(pid);
            showLog("輸送先を選択してください");
            return;
        }

        const cost = COSTS[type];
        const stats = daimyoStats[playerDaimyoId];
        if (stats.gold < cost.gold || stats.rice < (cost.rice || 0)) return showLog("資源不足");

        updateResource(playerDaimyoId, -cost.gold, -(cost.rice || 0));
        consumeAction(pid);

        setProvinces(prev => prev.map(pr => {
            if (pr.id !== pid) return pr;
            const next = { ...pr };
            if (type === 'recruit') {
                next.troops += cost.troops;
                next.loyalty = Math.max(0, (next.loyalty || 50) - 5);
            }
            if (type === 'train') next.training = Math.min(100, (next.training || 50) + cost.boost);
            return next;
        }));
        showLog(`${type === 'recruit' ? '徴兵' : '訓練'}を行いました。`);
    };

    // --- 外交アクション ---
    const handleDiplomacy = (type, targetDaimyoId) => {
        const banUntil = daimyoStats[playerDaimyoId]?.diplomacyBanUntil || 0;
        if (turn < banUntil) {
            return showLog(`信義を失ったため、他国は交渉に応じてくれません (残り${banUntil - turn}ターン)`);
        }

        const playerSource = getPlayerActionSource();
        if (!playerSource) return showLog("行動可能な自国拠点がありません");

        if (type === 'alliance') {
            const cost = 500;
            if (daimyoStats[playerDaimyoId].gold < cost) return showLog("金不足");
            updateResource(playerDaimyoId, -cost, 0);
            setAlliances(prev => ({ ...prev, [playerDaimyoId]: [...(prev[playerDaimyoId] || []), targetDaimyoId], [targetDaimyoId]: [...(prev[targetDaimyoId] || []), playerDaimyoId] }));
            showLog("同盟締結"); 
            consumeAction(playerSource.id);
        }
        if (type === 'negotiate') {
            setModalState({ type: 'negotiate', data: { targetId: targetDaimyoId, provinceId: playerSource.id } });
        }
    };

    // --- 部隊移動/攻撃の実行 ---
    const handleTroopAction = (amount) => {
        // ★修正: windowを参照せず、modalStateから直接データを取得
        const { type, sourceId, targetId } = modalState?.data || {};

        setModalState({ type: null });

        // ★追加: データ欠落時の安全策
        if (!type || !sourceId || !targetId) {
            console.error("Troop action missing data:", { type, sourceId, targetId });
            return;
        }

        const src = provinces.find(p => p.id === sourceId);
        const tgt = provinces.find(p => p.id === targetId);

        // 以下、変数 type をそのまま使用
        if (type === 'transport') {
            updateResource(playerDaimyoId, -COSTS.move.gold, -COSTS.move.rice);
            setProvinces(prev => prev.map(p => {
                if (p.id === sourceId) return { ...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft - 1) };
                if (p.id === targetId) return { ...p, troops: p.troops + amount };
                return p;
            }));
            showLog("輸送完了");
        } else if (type === 'attack') {
            updateResource(playerDaimyoId, -COSTS.attack.gold, -COSTS.attack.rice);
            setProvinces(prev => prev.map(p => p.id === sourceId ? { ...p, troops: p.troops - amount, actionsLeft: Math.max(0, p.actionsLeft - 1) } : p));

            let enemyReinforcement = 0;
            const enemyId = tgt.ownerId;
            const enemyNeighbors = tgt.neighbors.map(nid => provinces.find(p => p.id === nid));
            const enemyAllies = enemyNeighbors.filter(n => alliances[enemyId]?.includes(n.ownerId) && n.ownerId !== enemyId);

            if (enemyAllies.length > 0 && Math.random() < 0.5) {
                const ally = enemyAllies[0];
                enemyReinforcement = 300;
                const allyName = DAIMYO_INFO[ally.ownerId].name;
                showLog(`敵軍、${allyName}より援軍(${enemyReinforcement})到着！`);
            }

            setModalState({
                type: 'battle',
                data: { attacker: src, defender: { ...tgt, troops: tgt.troops + enemyReinforcement }, attackerAmount: amount, isPlayerAttack: true }
            });
        }
        setAttackSourceId(null); 
        setTransportSourceId(null);
    };

    // --- 裏切り実行 ---
    const executeBetrayal = (targetId, sourceId) => {
        setModalState({ type: null });

        setAlliances(prev => {
            const next = { ...prev };
            if (next[playerDaimyoId]) next[playerDaimyoId] = next[playerDaimyoId].filter(id => id !== targetId);
            if (next[targetId]) next[targetId] = next[targetId].filter(id => id !== playerDaimyoId);
            return next;
        });

        updateResource(playerDaimyoId, 0, 0, -50);

        setDaimyoStats(prev => ({
            ...prev,
            [playerDaimyoId]: {
                ...prev[playerDaimyoId],
                diplomacyBanUntil: turn + 20
            }
        }));

        setProvinces(prev => prev.map(p => {
            if (p.ownerId === playerDaimyoId) {
                return { ...p, loyalty: Math.max(0, (p.loyalty || 50) - 20) };
            }
            return p;
        }));

        showLog(`【裏切り】${DAIMYO_INFO[targetId].name}家との同盟を破棄し攻撃を開始しました！名声が失墜し、民忠が低下しました。`);

        const src = provinces.find(p => p.id === sourceId);
        // 裏切り後は攻撃部隊選択画面へ
        setModalState({
            type: 'troop',
            data: {
                type: 'attack',
                sourceId: sourceId,
                targetId: provinces.find(p => p.ownerId === targetId && p.id === selectedProvinceId).id,
                maxTroops: src.troops
            }
        });
    };

    return {
        handleDomesticAction,
        handleMilitaryAction,
        handleDiplomacy,
        handleTroopAction,
        executeBetrayal
    };
};
