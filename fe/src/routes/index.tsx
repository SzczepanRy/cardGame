import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="about-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <header className="about-header" style={{ textAlign: 'center' }}>
        <span className="about-subtitle">Card Engine</span>
        <h1 className="about-title">UNO</h1>
      </header>
      
      <div className="about-contact" style={{ justifyContent: 'center', marginTop: '40px' }}>
        <Link to="/createGame" className="about-contact-link">
          Create Game
        </Link>
        <Link to="/joinGame" className="about-contact-link">
          Join Game
        </Link>
      </div>
    </div>
  );
}