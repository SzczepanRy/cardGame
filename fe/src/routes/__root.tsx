// src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className=" [&.active]:font-bold">
          Home
        </Link>
        <br/>
        <Link to="/createGame" className="[&.active]:font-bold">
          CreateGame
        </Link>

        <br/>
        <Link to="/joinGame" className="[&.active]:font-bold">
            JoinGame
        </Link>
      </div>
      <hr />
      <Outlet />
    </>
  ),
})
