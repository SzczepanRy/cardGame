import { useState, useEffect, useRef, useCallback } from "react";
import { Card, ClientMessage, ServerResponse, ReqJoin } from "../types";

export function useUnoGame(wsUrl: string, roomIdToJoin?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [hand, setHand] = useState<Card[]>([]);
  const [table, setTable] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const [currPlayer, setCurrPlayer] = useState<number>(0);
  const [myId, setMyId] = useState<string| null>(null);
  const [cardCounts, setCardCounts] = useState<number[]>([]);
  const [unoCalls, setUnoCalls] = useState<boolean[]>([]);
  const [gameWonUser, setGameWonUser] = useState<number>(-1);

  const sendAction = useCallback((action: ClientMessage | ReqJoin) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    } else {
      console.error("No connection to server");
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to ${wsUrl}`);

      // gettinid

      if (roomIdToJoin) {
        sendAction({ action: "joinTable", id: roomIdToJoin } as ReqJoin);
        setTimeout(
          () => {
            sendAction({ action: "getTable" } as ClientMessage);
            sendAction({ action: "whoAmI" } as ClientMessage);
          },

          100,
        );
      } else {
        sendAction({ action: "getId" } as ClientMessage);
        setTimeout(() => {
          sendAction({ action: "getTable" } as ClientMessage);
          sendAction({ action: "whoAmI" } as ClientMessage);
        }, 100);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerResponse = JSON.parse(event.data);

        if (data.Error) setError(data.Error);
        else setError(null);
        if (
          data.Message &&
          0 < data.Message.length &&
          data.Message.length < 5
        ) {
          // to jest trche getto bo jak by server cos pojebaj to tu bedzie error
          console.log("heLLLPPPPPP" , data);
          setMyId((prev) => (prev ? prev : (data.Message ?? null)));
        } else {
          setRoomId((prev) => (prev ? prev : (data.Message ?? null)));
        }

        if (data.Hand) setHand(data.Hand);

        if (data.GameWonUser) {
          if (data.GameWonUser != -1) {
            setGameWonUser(data.GameWonUser);
          }
        }

        if (data.Table) {
          const incomingTable = data.Table;

          if (incomingTable.Color && incomingTable.Color !== "") {
            setTable((prev) => {
              const isIdentical =
                prev &&
                prev.Color === incomingTable.Color &&
                prev.Number === incomingTable.Number &&
                prev.Special === incomingTable.Special;

              if (isIdentical && data.CardsNumbers === undefined) {
                return prev;
              }
              if (isIdentical && data.CardsNumbers !== undefined) {
                return { ...incomingTable };
              }
              return incomingTable;
            });
          } else {
            setTable(null);
          }
        }

        if (data.CurrPlayer !== undefined) setCurrPlayer(data.CurrPlayer);
        if (data.CardsNumbers) setCardCounts(data.CardsNumbers);
        if (data.CalledUno) setUnoCalls(data.CalledUno);
      } catch (err) {
        console.error("Failed to parse server message", err);
      }
    };

    return () => ws.close();
  }, [wsUrl, roomIdToJoin, sendAction]);

  return {
    hand,
    table,
    error,
    roomId,
    myId,
    currPlayer,
    cardCounts,
    unoCalls,
    gameWonUser,
    drawCard: () => sendAction({ action: "drawCard" }),
    placeCard: (card: Card) => sendAction({ action: "placeCard", card }),
    refreshTable: () => sendAction({ action: "getTable" }),
    callUno: () => sendAction({ action: "callUno" }),
    checkUno: (targetPlayerIndex: number) =>
      sendAction({ action: "checkUno", message: targetPlayerIndex.toString() }),
  };
}
