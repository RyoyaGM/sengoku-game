// src/hooks/useGameLoop.js
import { useState, useEffect } from 'react';
import { DAIMYO_INFO } from '../data/daimyos';
import { HISTORICAL_EVENTS } from '../data/events';
import { getFormattedDate } from '../utils/helpers';

export const useGameLoop = ({
    provincesRef,
    daimyoStatsRef,
    setDaimyoStats,
    setProvinces,
    setCeasefires,
    coalition,
    setCoalition,
    playerDaimyoId,
    updateResource,
    showLog,
    setModalState,
    aiSpeed,
    isPaused,
    setSelectedProvinceId,
    setAttackSourceId,
    setTransportSourceId
}) => {
    const [turn, setTurn] = useState(1);
    const [gameState, setGameState] = useState('playing');
    const [turnOrder, setTurnOrder] = useState([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);

    // --- ターン進行の基本アクション ---
    const advanceTurn = () => {
        setSelectedProvinceId(null);
        setAttackSourceId(null);
        setTransportSourceId(null);
        setCurrentTurnIndex(prev => prev + 1);
    };

    // --- 勢力滅亡判定 ---
    const checkElimination = () => {
        setDaimyoStats(prev => {
            let hasChange = false;
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                if (id === 'Minor') return;
                const hasLand = provincesRef.current.some(p => p.ownerId === id);
                if (!hasLand && next[id].isAlive !== false) {
                    next[id] = { ...next[id], isAlive: false };
                    hasChange = true;
                }
            });
            return hasChange ? next : prev;
        });
    };

    // --- 行動順決定 ---
    const determineTurnOrder = () => {
        const active = Object.keys(DAIMYO_INFO).filter(id => {
            if (id === 'Minor') return false;
            const stats = daimyoStatsRef.current[id];
            return stats?.isAlive !== false;
        });
        active.sort((a, b) => (daimyoStatsRef.current[b]?.fame || 0) - (daimyoStatsRef.current[a]?.fame || 0));
        setTurnOrder(active);
        setCurrentTurnIndex(0);
    };

    // --- 季節更新・収入処理 ---
    const startNewSeason = () => {
        checkElimination();

        const isAutumn = (turn - 1) % 4 === 2;
        
        setCeasefires(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => Object.keys(next[k]).forEach(t => { if (next[k][t] > 0) next[k][t]--; }));
            return next;
        });

        if (coalition) {
            if (coalition.duration <= 1) {
                setCoalition(null);
                showLog("包囲網が解散しました。");
            } else {
                setCoalition(prev => ({ ...prev, duration: prev.duration - 1 }));
            }
        }

        setProvinces(curr => curr.map(p => ({ ...p, actionsLeft: 3 })));

        Object.keys(DAIMYO_INFO).forEach(id => {
            const stats = daimyoStatsRef.current[id];
            if (stats && stats.isAlive === false) return;

            const owned = provincesRef.current.filter(p => p.ownerId === id);
            if (owned.length) {
                const commerceIncome = Math.floor(owned.reduce((s, p) => s + p.commerce, 0) * 1.2);
                const agIncome = isAutumn ? Math.floor(owned.reduce((s, p) => s + p.agriculture, 0) * 2.0) : 0;
                updateResource(id, commerceIncome, agIncome);
            }
        });

        if (!isPaused) setTimeout(determineTurnOrder, aiSpeed);
    };

    // --- 勝敗判定監視 ---
    useEffect(() => {
        checkElimination();

        if (!playerDaimyoId || playerDaimyoId === 'SPECTATOR') return;

        const stats = daimyoStatsRef.current;
        const playerStats = stats[playerDaimyoId];
        const playerCount = provincesRef.current.filter(p => p.ownerId === playerDaimyoId).length;

        if (playerCount === provincesRef.current.length) {
            setGameState('won');
        } else if ((playerStats && playerStats.isAlive === false) || (playerCount === 0 && turn > 0)) {
            setGameState('lost');
        }
    }, [provincesRef.current, daimyoStatsRef.current, playerDaimyoId]);

    // --- ゲーム開始時の初期化 ---
    useEffect(() => {
        if (playerDaimyoId && turnOrder.length === 0) startNewSeason();
    }, [playerDaimyoId]);

    // --- ターン経過イベント (歴史イベントなど) ---
    useEffect(() => {
        if (turn > 1) {
            showLog(`${getFormattedDate(turn)}になりました。`);

            const occurredEvent = HISTORICAL_EVENTS.find(e => e.trigger(turn, provincesRef.current, daimyoStatsRef.current));
            if (occurredEvent) {
                setModalState({ type: 'historical_event', data: occurredEvent });
            } else {
                startNewSeason();
            }
        }
    }, [turn]);

    return {
        turn,
        setTurn,
        gameState,
        turnOrder,
        currentTurnIndex,
        isPlayerTurn,
        setIsPlayerTurn,
        advanceTurn,
        startNewSeason
    };
};