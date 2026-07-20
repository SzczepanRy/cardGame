package rooms

import (
	"cardgame/internal/api/game"
	"cardgame/internal/api/room"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/coder/websocket"
	"github.com/google/uuid"
)

type resData struct {
	Hand  []game.Card
	Table game.Card
	Message string

}

type ClientMessage struct {
	Action string     `json:"action"`
	Card   *game.Card `json:"card"`
}

func (rm *RoomManager) HandleNewGame(w http.ResponseWriter, r *http.Request) {

	name := "Host"
	id := uuid.New().String()

	err := rm.AddRoom(id)

	if err != nil {
		log.Printf("bload ladownaia pokoju : %v" , err)
		return
	}


	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: true, // Dostosuj do swoich potrzeb CORS
	})

	if err != nil {
		log.Printf("bload ladownaia ws: %v" , err)
		return
	}
	defer c.Close(websocket.StatusNormalClosure, "skonczono gre")
	defer rm.Rooms[id].RemoveClient(name)

	nc := &room.Client{
		Name: name,
		Conn: c,
		Hand: []*game.Card{},
	}

	rm.Rooms[id].AddClient(nc)

	ctx, cancel := context.WithCancel(r.Context())

	defer cancel()

	RoomRouter(ctx, nc, rm.Rooms[id])

}

func sendJSONResponse(ctx context.Context, c *websocket.Conn, resp resData) {
	payload, err := json.Marshal(resp)
	if err != nil {
		log.Printf("Błąd kodowania JSON: %v", err)
		return
	}

	ctxTimeout, cancel := context.WithTimeout(ctx, time.Second*5)
	defer cancel()

	err = c.Write(ctxTimeout, websocket.MessageText, payload)
	if err != nil {
		log.Printf("Błąd zapisu do socketa: %v", err)
	}
}

func writeTimeout(ctx context.Context, timeout time.Duration, c *websocket.Conn, msg []byte) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	return c.Write(ctx, websocket.MessageText, msg)
}

type reqJoin struct {
	Action string `json:"action"`
	Id     string `json:"id"`
}

type TableRef struct {
	Table *game.Card `json:"Table"`
	CurrPlayer int `json:"CurrPlayer"`
	CardsNumbers []int `json:"CardsNumbers"`
}

func (rm *RoomManager) HandleJoinGame(w http.ResponseWriter, r *http.Request) {

	c, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: true, // Dostosuj do swoich potrzeb CORS
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	ctx, cancel := context.WithCancel(r.Context())

	defer cancel()

	id := "init"

ReadReq:
	for {
		_, payload, err := c.Read(ctx)
		if err != nil {
			log.Fatalf("Klient rozłączony: %v", err)
			//continue
			return
		}

		var msg reqJoin
		err = json.Unmarshal(payload, &msg)
		if err != nil {
			log.Printf("Błąd parsowania JSON: %v", err)
			_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "Błędny format JSON"}`))
			continue
		}

		switch msg.Action {
		case "joinTable":
			id = msg.Id
			break ReadReq

		default:
			err = writeTimeout(ctx, time.Second*5, c, []byte("zla inicjalizacja"))
			if err != nil {
				log.Printf("Błąd wysyłania odpowiedzi: %v", err)
				return
			}
			continue
		}
	}

	cr, exists := rm.Rooms[id]
	if !exists {
		log.Printf("Próba dołączenia do nieistniejącego pokoju: %s", id)
		c.Close(websocket.StatusNormalClosure, "Room not found")
		return
	}

	name := fmt.Sprintf("player%v", len(cr.Clients))

	defer c.Close(websocket.StatusNormalClosure, "skonczono gre")
	defer cr.RemoveClient(name)

	nc := &room.Client{
		Name: name,
		Conn: c,
		Hand: []*game.Card{},
	}
	rm.Rooms[id].AddClient(nc)

	RoomRouter(ctx, nc, cr)

}

func RoomRouter(ctx context.Context, cli *room.Client, r *room.Room) {

	c := cli.Conn

	for {
		_, payload, err := c.Read(ctx)
		if err != nil {
			log.Printf("Klient rozłączony: %v", err)
			continue
		}

		var msg ClientMessage
		err = json.Unmarshal(payload, &msg)
		if err != nil {
			log.Printf("Błąd parsowania JSON: %v", err)
			_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "Błędny format JSON"}`))
			continue
		}

		isMyTurn := r.Clients[r.CurrPlayer].Conn == c

		switch msg.Action {
		case "getTable":
			var res resData
			if r.Session == nil {
				log.Println("BŁĄD: Sesja gry (nr.Session) nie została zainicjalizowana!")
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "Gra nie została jeszcze uruchomiona"}`))
				continue
			}

			for _, cc := range cli.Hand {
				if cc != nil {
					res.Hand = append(res.Hand, *cc)
				}
			}

			if r.Session.Last != nil {
				res.Table = *r.Session.Last
			}

			log.Println("printt : ", res)
			sendJSONResponse(ctx, c, res)

		case "getId":
			var res resData
			res.Message = r.Id
			sendJSONResponse(ctx ,c , res)


		case "drawCard":
			if !isMyTurn {
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "nie tura gracza"}`))
				continue
			}


			r.DrawCard()

			///////// refresh broadcast

			r.Mu.Lock()

			res := TableRef{
				Table: msg.Card,
				CurrPlayer: r.CurrPlayer ,
			}
			var cards []int
			for _, roomClient := range r.Clients {
				cards = append(cards, len( roomClient.Hand ) )
			}
			res.CardsNumbers = cards

			r.Mu.Unlock()


			resb, err := json.Marshal(res)
			if err != nil {
				log.Println("err : ", err)
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "Błąd formatowania JSON"}`))
				continue
			}

			r.Broadcast(ctx, resb)
			//////////



		case "placeCard":
			if !isMyTurn {
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "nie tura gracza"}`))
				continue
			}

			if msg.Card == nil {
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "Brak danych karty w pakiecie"}`))
				continue
			}

			err := r.PlaceCard(msg.Card)

			if err != nil {
				log.Println("err : ", err)
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "`+err.Error()+`"}`))
				continue
			}

			///////// refresh broadcast

			r.Mu.Lock()

			res := TableRef{
				Table: msg.Card,
				CurrPlayer: (r.CurrPlayer + r.Session.Direction + len(r.Clients) )% len(r.Clients),
			}
			var cards []int
			for _, roomClient := range r.Clients {
				cards = append(cards, len( roomClient.Hand ) )
			}
			res.CardsNumbers = cards

			r.Mu.Unlock()


			resb, err := json.Marshal(res)
			if err != nil {
				log.Println("err : ", err)
				_ = writeTimeout(ctx, time.Second, c, []byte(`{"error": "Błąd formatowania JSON"}`))
				continue
			}

			r.Broadcast(ctx, resb)
			//////////

			r.NextPalyer()

		default:
			err = writeTimeout(ctx, time.Second*4, c, []byte("default"))
			if err != nil {
				log.Printf("Błąd wysyłania odpowiedzi: %v", err)
				continue

			}

		}

	}

}
