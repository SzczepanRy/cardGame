import { createFileRoute, Link } from '@tanstack/react-router';
import '../styles/_uno.scss'; // Make sure this path points to your main SCSS file!

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="menu-page">
      <div className="menu-container">
        
        <header className="menu-header">
          <span className="menu-subtitle">O PROJEKCIE</span>
          <h1 className="menu-title">UNO</h1>
          <span className="menu-descriptor">MULTIPLAYER CARD ENGINE</span>
        </header>
        
        <div className="menu-actions">
          <Link to="/createGame" className="menu-btn">
            CREATE GAME
          </Link>
          <Link to="/joinGame" className="menu-btn">
            JOIN GAME
          </Link>
        </div>

      </div>
    </div>
  );
}