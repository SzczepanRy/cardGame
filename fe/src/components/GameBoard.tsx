import { useState } from 'react';
import { Card } from '../types';
import '../styles/_uno.scss';

interface GameBoardProps {
  hand: Card[];
  table: Card | null;
  currPlayer: number;
  cardCounts: number[];
  unoCalls: boolean[];
  onDraw: () => void;
  onPlace: (card: Card) => void;
  onCallUno: () => void;
  onCheckUno: (targetIndex: number) => void;
}

const getCardDisplay = (card: Card) => {
  if (card.Color === 'special') return card.Special === '4' ? '+4' : 'WILD';
  const num = Number(card.Number);
  if (num === 10) return '+2';
  if (num === 11) return '↺';
  if (num === 12) return '⊘';
  return card.Number;
};

export function GameBoard({ hand, table, currPlayer, cardCounts, unoCalls, onDraw, onPlace, onCallUno, onCheckUno }: GameBoardProps) {
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);

  const handleCardClick = (card: Card) => {
    if (card.Color === 'special') setPendingWildCard(card);
    else onPlace(card);
  };

  const handleColorSelect = (chosenColor: string) => {
    if (pendingWildCard) {
      onPlace({ ...pendingWildCard, Color: chosenColor });
      setPendingWildCard(null);
    }
  };

  return (
    <div className="uno-board">
      
      {/* Color Wheel Modal */}
      {pendingWildCard && (
        <div className="color-wheel-container">
          <h2 style={{ marginBottom: '20px', letterSpacing: '0.1em' }}>SELECT COLOR</h2>
          <div className="color-wheel">
            <div className="wheel-slice red" onClick={() => handleColorSelect('red')} />
            <div className="wheel-slice blue" onClick={() => handleColorSelect('blue')} />
            <div className="wheel-slice green" onClick={() => handleColorSelect('green')} />
            <div className="wheel-slice yellow" onClick={() => handleColorSelect('yellow')} />
          </div>
          <button className="uno-button" style={{ marginTop: '30px' }} onClick={() => setPendingWildCard(null)}>CANCEL</button>
        </div>
      )}

      {/* Opponent Roster */}
      <div className="roster-container">
        {cardCounts.map((count, idx) => (
          <div key={idx} className={`player-stat ${idx === currPlayer ? 'active-turn' : ''}`}>
            <span className="player-name">Player {idx}</span>
            <span className="card-count">{count}</span>
            {unoCalls[idx] && <span className="uno-badge">UNO!</span>}
            
            {/* If they have 1 card but didn't call UNO, anyone can click this to catch them! */}
            {!unoCalls[idx] && count === 1 && (
              <button className="uno-button" onClick={() => onCheckUno(idx)} style={{ padding: '4px 8px', fontSize: '0.6rem', marginTop: '8px', color: '#ff5555', borderColor: '#ff5555' }}>
                CATCH
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Center Table (Draw Deck + Discard) */}
      <div className="table-grid">
        {/* Draw Deck */}
        <div className="uno-card deck-card" onClick={onDraw} title="Draw Card">
          <span className="card-value" style={{ fontSize: '1.5rem' }}>UNO</span>
        </div>

        {/* Discard Pile */}
        {table ? (
          <div className="uno-card" data-color={table.Color} style={{ transform: 'scale(1.1)', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
            <span className="card-value">{getCardDisplay(table)}</span>
          </div>
        ) : (
          <div className="uno-card" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
            <span style={{ fontSize: '1rem' }}>Empty Table</span>
          </div>
        )}
      </div>

      {/* Actions & Hand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* UNO Button */}
        {hand.length <= 2 && (
          <button className="uno-button" onClick={onCallUno} style={{ width: '200px', marginBottom: '20px', background: '#ff5555', color: '#fff', borderColor: '#ff5555' }}>
            CALL UNO!
          </button>
        )}

        <div className="hand-container">
          {hand.map((card, i) => (
            <div key={i} className="uno-card" data-color={card.Color} onClick={() => handleCardClick(card)}>
              <span className="card-value">{getCardDisplay(card)}</span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}