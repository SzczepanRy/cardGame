import { createFileRoute } from '@tanstack/react-router';
import { useUnoGame } from '../../hooks/useUnoGame';
import { GameBoard } from '../../components/GameBoard';

export const Route = createFileRoute('/createGame/')({
  component: CreateGameComponent,
});

function CreateGameComponent() {
  const { hand, table, error, roomId, currPlayer, cardCounts, unoCalls, drawCard, placeCard, refreshTable, callUno, checkUno } = useUnoGame('ws://localhost:8080/api/newGame');

  return (
    <div>
      {error && <div style={{ color: '#ff5555', textAlign: 'center', padding: '10px' }}>{error}</div>}
      
      {roomId && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>
          <span className="about-section-label">ROOM ID</span>
          <h2 style={{ letterSpacing: '2px' }}>{roomId}</h2>
        </div>
      )}
      
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