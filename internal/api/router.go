package router

import (
	"cardgame/internal/api/rooms"
	"log"
	"net/http"
	"regexp"
)

type Router struct {
	apiRoutes map[string]http.HandlerFunc
	RM        rooms.RoomManager
}

func NewRouter() *Router {
	r := Router{
		apiRoutes: make(map[string]http.HandlerFunc),
		RM:        *rooms.InitRooms(),
	}

	r.setupRoutes()
	return &r
}
func (mux *Router) setupRoutes() {
	mux.apiRoutes["/api/newGame"] = mux.RM.HandleNewGame
	mux.apiRoutes["/api/joinGame"] = mux.RM.HandleJoinGame
}

func (mux *Router) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	if match, _ := regexp.MatchString("/api/.*", r.URL.Path); match {
		handler, exists := mux.apiRoutes[r.URL.Path]
		if !exists {
			log.Printf("Nie znaleziono ścieżki API: %s\n", r.URL.Path)
			http.Error(w, "Path Not Found", http.StatusNotFound)
			return
		}
		handler(w, r)
		return

	} else {
		// NONAPI
		switch r.Method {
		case "GET":
			if match, _ := regexp.MatchString("/assets/.*", r.URL.Path); match {
				http.ServeFile(w, r, "./fe/dist/"+r.URL.Path)
			} else {
				switch r.URL.Path {
				case "/":
					http.ServeFile(w, r, "./fe/dist/index.html")
				}

			}
		default:
			log.Printf("unknown method \n")
			http.Error(w, "unknown method", http.StatusNotFound)
		}

	}

}
