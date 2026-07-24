import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useUnoGame } from '../../hooks/useUnoGame';
import { GameBoard } from '../../components/GameBoard';

export const Route = createFileRoute('/joinGame/')({
  component: JoinGameRoute,
});

function JoinGameRoute() {
  const [roomIdToJoin, setRoomIdToJoin] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // If we haven't submitted a room ID yet, show the input form
  if (!roomIdToJoin) {
    return (
      <div className="about-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="about-title">Join Game</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ padding: '10px', background: 'transparent', border: '1px solid #333', color: '#fff' }}
          />
          <button
            className="about-contact-link"
            onClick={() => {
              if (inputValue.trim()) setRoomIdToJoin(inputValue.trim());
            }}
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return <ActiveJoinGame roomId={roomIdToJoin} />;
}

function ActiveJoinGame({ roomId }: { roomId: string }) {
  const { hand, table, error,myId , currPlayer, cardCounts, unoCalls, drawCard, placeCard ,gameWonUser , refreshTable, callUno, checkUno } = useUnoGame('ws://localhost:8080/api/joinGame', roomId);

  return (
    <div>
      {error && <div style={{ color: '#ff5555', textAlign: 'center', padding: '10px' }}>{error}</div>}
      {
        myId   && (
         <p>User {myId} </p>
        )
      }

      {
        gameWonUser != -1 && (
         <p>game Won User {gameWonUser} </p>
        )
      }

      <GameBoard
        hand={hand}
        table={table}
        currPlayer={currPlayer}
        cardCounts={cardCounts}
        unoCalls={unoCalls}
        onCallUno={callUno}
        onCheckUno={checkUno}
        onDraw={() => {
          drawCard();
          setTimeout(refreshTable, 100);
        }}
        onPlace={(card) => {
          placeCard(card);
          setTimeout(refreshTable, 100);
        }}
      />
    </div>
  );
}
