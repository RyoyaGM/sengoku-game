// src/hooks/useBattleSystem.js
import { useState } from 'react';
import { DAIMYO_INFO } from '../data/daimyos';

export const useBattleSystem = ({
    provinces,
    setProvinces,
    relations,
    updateResource,
    updateRelation,
    showLog,
    advanceTurn,
    playerDaimyoId,
    daimyoStats, // 金欠判定などで使用
    modalState,
    setModalState,
    setIsResolvingBattles // 戦闘中フラグの制御
}) => {
    // 順番待ちの戦闘リスト
    const [pendingBattles, setPendingBattles] = useState([]);

    // --- 次の戦闘を処理 ---
    const processNextPendingBattle = () => {
        if (pendingBattles.length === 0) {
            setIsResolvingBattles(false);
            advanceTurn();
            return;
        }
        const battle = pendingBattles[0];
        const defenderProv = provinces.find(p => p.id === battle.defender.id);
        const neighbors = defenderProv.neighbors.map(nid => provinces.find(p => p.id === nid));
        
        // プレイヤーや攻撃者以外の近隣勢力を抽出
        const potentialAllies = neighbors
            .filter(n => n.ownerId !== playerDaimyoId && n.ownerId !== battle.attackerId)
            .map(n => ({ id: n.ownerId, name: DAIMYO_INFO[n.ownerId].name }))
            .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

        setModalState({ type: 'reinforcement_request', data: { battle, potentialAllies } });
    };

    // --- 援軍要請の決定 ---
    const handleReinforcementDecision = (allyId) => {
        const { battle } = modalState.data;
        let allyTroops = 0;
        let allyName = null;
        let isSuccess = false;

        if (allyId) {
            const rel = relations[playerDaimyoId]?.[allyId] || 50;
            const successChance = rel / 100;
            if (Math.random() < successChance) {
                isSuccess = true;
                allyName = DAIMYO_INFO[allyId].name;
                allyTroops = 500;
                showLog(`${allyName}が援軍要請に応じました！ (兵+${allyTroops})`);
                updateRelation(allyId, 5);
            } else {
                showLog(`${DAIMYO_INFO[allyId].name}に援軍を断られました...`);
                updateRelation(allyId, -5);
            }
        }

        setModalState({
            type: 'battle',
            data: {
                attacker: battle.attacker,
                defender: { ...battle.defender, troops: battle.defender.troops + allyTroops },
                attackerAmount: battle.attackerAmount,
                originalDefenderTroops: battle.defender.troops,
                reinforcement: isSuccess ? { allyId, troops: allyTroops, cost: 500 } : null
            }
        });
    };

    // --- 戦闘終了後の処理 ---
    const handleBattleFinish = (res) => {
        const { attacker, defender, reinforcement } = modalState.data;
        const { attackerRemaining, defenderRemaining } = res;

        setProvinces(prev => prev.map(p => {
            if (p.id === defender.id) {
                if (defenderRemaining <= 0) return { ...p, ownerId: attacker.ownerId, troops: attackerRemaining, actionsLeft: 0, loyalty: 30, defense: Math.max(0, p.defense - 20) };
                else return { ...p, troops: Math.max(0, defenderRemaining - (reinforcement ? reinforcement.troops : 0)) };
            }
            return p;
        }));

        if (defenderRemaining <= 0) {
            const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
            showLog(`${attackerName}軍が${defender.name}を制圧！`);
            updateResource(attacker.ownerId, 0, 0, 5);

            const defenderInfo = DAIMYO_INFO[defender.ownerId];
            if (defenderInfo && defenderInfo.homeProvinceId === defender.id) {
                updateResource(defender.ownerId, 0, 0, -10);
                showLog(`${defenderInfo.name}家、本拠地陥落...名声失墜！`);
            } else {
                updateResource(defender.ownerId, 0, 0, -5);
            }
        } else if (attackerRemaining <= 0) {
            const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
            showLog(`${attackerName}軍、${defender.name}攻略に失敗。`);
            updateResource(attacker.ownerId, 0, 0, -5);
            updateResource(defender.ownerId, 0, 0, 5);
        } else {
            const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
            showLog(`${attackerName}軍、${defender.name}を攻めきれず撤退（引き分け）。`);
            updateResource(attacker.ownerId, 0, 0, -5);
            updateResource(defender.ownerId, 0, 0, 5);
        }

        // 処理が終わった戦闘をキューから削除
        setPendingBattles(prev => prev.slice(1));

        // プレイヤーが防衛成功し、かつ援軍を呼んでいた場合は報酬支払画面へ
        if (defenderRemaining > 0 && reinforcement && defender.ownerId === playerDaimyoId) {
            setModalState({ type: 'reward_payment', data: { allyId: reinforcement.allyId, amount: reinforcement.cost } });
        } else {
            setModalState({ type: null });
            setIsResolvingBattles(false);
        }
    };

    // --- 報酬支払いの処理 ---
    const handleRewardPayment = (pay) => {
        const { allyId, amount } = modalState.data;
        if (pay) {
            if (daimyoStats[playerDaimyoId].gold >= amount) {
                updateResource(playerDaimyoId, -amount, 0);
                updateRelation(allyId, 10);
                showLog(`${DAIMYO_INFO[allyId].name}に報酬を支払いました。関係が深まりました。`);
            } else {
                showLog(`資金不足で報酬を払えませんでした... ${DAIMYO_INFO[allyId].name}との関係が悪化しました。`);
                updateRelation(allyId, -20);
            }
        } else {
            showLog(`報酬を支払いませんでした。${DAIMYO_INFO[allyId].name}は激怒しています！`);
            updateRelation(allyId, -50);
        }
        setModalState({ type: null });
        setIsResolvingBattles(false);
    };

    return {
        pendingBattles,
        setPendingBattles,
        processNextPendingBattle,
        handleReinforcementDecision,
        handleBattleFinish,
        handleRewardPayment
    };
};