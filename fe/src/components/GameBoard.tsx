import { useState, useEffect } from 'react';
import { Card } from '../types';
import '../styles/_uno.scss';

interface GameBoardProps {
  hand: Card[];
  table: Card | null;
  currPlayer: number;
  cardCounts: number[];
  unoCalls: boolean[];
  myPlayerIndex?: number | null;
  onDraw: () => void;
  onPlace: (card: Card) => void;
  onCallUno: () => void;
  onCheckUno: (targetIndex: number) => void;
}

const getCardDisplay = (card: Card) => {
  if (card.Color === 'special') return card.Special === '4' ? '+4' : '❖';
  const num = Number(card.Number);
  if (num === 10) return '+2';
  if (num === 11) return '↺';
  if (num === 12) return '⊘';
  return card.Number;
};

export function GameBoard({ hand, table, currPlayer, cardCounts, unoCalls, myPlayerIndex = null, onDraw, onPlace, onCallUno, onCheckUno }: GameBoardProps) {
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);
  const [discardPile, setDiscardPile] = useState<{id: number, card: Card, angle: number}[]>([]);

  useEffect(() => {
    if (table) {
      setDiscardPile(prevPile => {
        const angle = Math.floor(Math.random() * 41) - 20;
        const newPile = [...prevPile, { id: Math.random(), card: table, angle }];
        if (newPile.length > 10) return newPile.slice(newPile.length - 10);
        return newPile;
      });
    } else {
      setDiscardPile([]);
    }
  }, [table]);

  const handleColorSelect = (chosenColor: string, originalCard: Card) => {
    onPlace({ ...originalCard, Color: chosenColor });
    setFlippedCardIndex(null);
  };

  return (
    <div className="uno-board">
      <div className="table-area-wrapper">
        <div className="opponents-ring">
          {cardCounts.map((count, idx) => {
            if (myPlayerIndex !== null && idx === myPlayerIndex) return null;
            const ringTotal = myPlayerIndex !== null ? cardCounts.length - 1 : cardCounts.length;
            
            let x = 0, y = -220, rot = 0;
            
            if (ringTotal > 1) {
              const startAngle = Math.PI * 0.85; 
              const endAngle = Math.PI * 0.15;
              const layoutIdx = myPlayerIndex !== null && idx > myPlayerIndex ? idx - 1 : idx;
              const angle = startAngle - (layoutIdx / (ringTotal - 1)) * (startAngle - endAngle);

              x = Math.cos(angle) * 400;
              y = -Math.sin(angle) * 220;
              
              rot = (angle - Math.PI / 2) * (180 / Math.PI) * -1; 
            }

            return (
              <div 
                key={idx} 
                className={`opponent-hand-container ${idx === currPlayer ? 'active-turn' : ''}`}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot}deg) ${idx === currPlayer ? 'scale(1.15)' : 'scale(1)'}`
                }}
              >
                {/* Minimal Floating Name Tag */}
                <div className="opponent-info">
                  {unoCalls[idx] && <span className="uno-badge">UNO!</span>}
                  <span className="player-name">Player {idx}</span>
                  {!unoCalls[idx] && count === 1 && (
                    <button className="uno-button catch-btn" onClick={() => onCheckUno(idx)}>
                      CATCH
                    </button>
                  )}
                </div>
                
                {/* TRUE 3D CARD FAN */}
                <div className="opponent-cards-fan">
                  {Array.from({ length: count }).map((_, cardIdx) => {
                    const vTotal = count;
                    const vMiddle = (vTotal - 1) / 2;
                    const vOffset = cardIdx - vMiddle;
                    const vNorm = vTotal > 1 ? vOffset / vMiddle : 0;
                    
                    const vRot = vNorm * 20;
                    const vY = Math.pow(vNorm, 2) * 15;

                    let vOverlap = 35; 
                    if (vTotal > 8) vOverlap = 45;
                    if (vTotal > 15) vOverlap = 52;

                    return (
                      <div 
                        key={cardIdx} 
                        className="opponent-card" 
                        style={{
                          transform: `translateY(${vY}px) rotate(${vRot}deg)`,
                          marginLeft: cardIdx === 0 ? '0px' : `-${vOverlap}px`,
                          zIndex: cardIdx
                        }} 
                      />
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="table-perspective-container">
          <div className="table-grid">
            <div className="uno-card deck-card" onClick={onDraw} title="Draw Card">
              <span className="card-value" style={{ fontSize: '1.5rem', color: '#888' }}>UNO</span>
            </div>

            <div className="discard-container">
              {discardPile.length > 0 ? (
                discardPile.map((item, index) => {
                  const isTopCard = index === discardPile.length - 1;
                  return (
                    <div 
                      key={item.id}
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: isTopCard ? 100 : index,
                        transform: `translateZ(${index * 4}px) scale(1.1) rotateZ(${item.angle}deg)`, 
                      }}
                    >
                      <div 
                        className={`uno-card ${isTopCard ? 'discard-top-card' : ''}`} 
                        data-color={item.card.Color}
                        style={{
                           boxShadow: isTopCard ? '-5px 10px 15px rgba(0,0,0,0.5)' : 'none',
                        }}
                      >
                        <span className="card-value">{getCardDisplay(item.card)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="uno-card" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
                  <span style={{ fontSize: '1rem' }}>Empty</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        {hand.length <= 2 && (
          <button className="uno-button call-uno-btn" onClick={onCallUno}>
            CALL UNO!
          </button>
        )}

        {/* PROPORTIONAL HAND MATH */}
        <div className="hand-container">
          {hand.map((card, i) => {
            const isFlipped = flippedCardIndex === i;
            
            const total = hand.length;
            const middle = (total - 1) / 2;
            const offset = i - middle;
            const normalizedOffset = total > 1 ? offset / middle : 0;
            
            const rotation = normalizedOffset * 25; 
            const translateY = Math.pow(normalizedOffset, 2) * 35; 
            
            let overlap = 10;
            if (total > 6) overlap = Math.min(85, (total - 6) * 6);
            if (total > 20) overlap = Math.min(90, 80 + (total - 20) * 1); 

            return (
              <div 
                key={i} 
                className={`hand-card-wrapper ${isFlipped ? 'flipped' : ''}`}
                onMouseLeave={() => { if (isFlipped) setFlippedCardIndex(null); }}
                style={{
                  '--card-rot': `${rotation}deg`,
                  '--card-y': `${translateY}px`,
                  zIndex: i,
                  marginLeft: i === 0 ? '0px' : `-${overlap}px`
                } as React.CSSProperties}
              >
                <div className="card-flipper">
                  <div 
                    className="card-front uno-card" 
                    data-color={card.Color} 
                    onClick={() => {
                      if (card.Color === 'special') {
                        setFlippedCardIndex(i);
                      } else {
                        onPlace(card);
                      }
                    }}
                  >
                    <span className="card-value">{getCardDisplay(card)}</span>
                  </div>

                  <div className="card-back">
                    <div className="mini-wheel">
                      <div className="wheel-slice red" onClick={(e) => { e.stopPropagation(); handleColorSelect('red', card); }} />
                      <div className="wheel-slice blue" onClick={(e) => { e.stopPropagation(); handleColorSelect('blue', card); }} />
                      <div className="wheel-slice green" onClick={(e) => { e.stopPropagation(); handleColorSelect('green', card); }} />
                      <div className="wheel-slice yellow" onClick={(e) => { e.stopPropagation(); handleColorSelect('yellow', card); }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}