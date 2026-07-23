import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useUnoGame } from '../../hooks/useUnoGame';
import { GameBoard } from '../../components/GameBoard';

export const Route = createFileRoute('/createGame/')({
  component: CreateGameComponent,
});

function CreateGameComponent() {
  const { hand, table, error, roomId, currPlayer, cardCounts, unoCalls, drawCard, placeCard, refreshTable, callUno, checkUno } = useUnoGame('ws://localhost:8080/api/newGame');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {error && <div style={{ color: '#ff5555', textAlign: 'center', padding: '10px' }}>{error}</div>}
      
      {roomId && (
        <div style={{ textAlign: 'center', padding: '20px', zIndex: 100, position: 'relative' }}>
          <span style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>ROOM ID</span>
          <div className={`room-id-pill ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Click to copy">
            {roomId}
          </div>
        </div>
      )}
      
      <GameBoard 
        hand={hand} 
        table={table} 
        currPlayer={currPlayer}
        cardCounts={cardCounts}
        unoCalls={unoCalls}
        myPlayerIndex={null} /* Set this to your ID from useUnoGame once the backend adds it! */
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