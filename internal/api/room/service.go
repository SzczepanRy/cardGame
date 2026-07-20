package room

import (
	"cardgame/internal/api/game"
	"context"
	"errors"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/coder/websocket"
)

type Client struct {
	Name string
	Conn *websocket.Conn
	Hand []*game.Card
	CalledUno bool

}

// co if the clinet wcoud be the in al loop

type Room struct {
	Mu         sync.RWMutex
	Clients    []*Client
	Session    *game.GameState
	CurrPlayer int
	Id         string
	//Msgs chan InboundMessage
	Msgs chan []byte
}

type InboundMessage struct {
	//    SenderName string
	Payload []byte
}

func InitRoom(id string) *Room {
	r := Room{
		// musze tu dodac CurrPlayer
		Id:         id,
		CurrPlayer: 0,
		Mu:         sync.RWMutex{},
		Clients:    []*Client{},
		Session:    game.InitGame(),
		Msgs:       make(chan []byte, 10),
	}
	return &r
}

func (ro *Room) AddClient(cli *Client) {

	ro.Mu.Lock()
	defer ro.Mu.Unlock()

	for range 5 {
		cli.Hand = append(cli.Hand, ro.Session.GetCard())
	}

	ro.Clients = append(ro.Clients, cli)
}

func (ro *Room) RemoveClient(name string) error {
	ro.Mu.Lock()
	defer ro.Mu.Unlock()

	indToDel := -1

	for i, cli := range ro.Clients {
		if cli.Name == name {
			indToDel = i
			ro.Clients[i] = nil
		}
	}

	if indToDel != -1 {
		ro.Clients = append(ro.Clients[:indToDel], ro.Clients[indToDel+1:]...)
		return nil
	}
	return errors.New("taki urzytkownik juz nie istnieje")
}

func (ro *Room) CheckUno(curr int) bool {
	ro.Mu.Lock()
	defer ro.Mu.Unlock()
	if !ro.Clients[curr].CalledUno &&  len(ro.Clients[curr].Hand) == 1 {
		return true
	}
	return  false

}

func (ro *Room) DrawCard() {
	ro.Mu.Lock()
	defer ro.Mu.Unlock()

	if ro.Session.Last == nil {
		newCard := ro.Session.GetCard()
		ro.Clients[ro.CurrPlayer].Hand = append(ro.Clients[ro.CurrPlayer].Hand, newCard)
		return
	}

	if ro.Session.Last.Color == "special" && ro.Session.Last.Special != "wild" {
		if num, err := strconv.Atoi(ro.Session.Last.Special); err == nil {
			for range num {
				newCard := ro.Session.GetCard()
				ro.Clients[ro.CurrPlayer].Hand = append(ro.Clients[ro.CurrPlayer].Hand, newCard)
			}
			// po pobraniu +x sie restetuje
			ro.Session.Last.Special = "1"

		} else {
			log.Println("could not parse str-> from special +4 card ")

		}

	}else if ro.Session.Last.Number == 10 {

		if ro.Session.Last.Special == ""{
			for range 2 {
				newCard := ro.Session.GetCard()
				ro.Clients[ro.CurrPlayer].Hand = append(ro.Clients[ro.CurrPlayer].Hand, newCard)
			}
			// po pobraniu +x sie restetuje
			ro.Session.Last.Special = "1"

		}else if num, err := strconv.Atoi(ro.Session.Last.Special); err == nil {
			for range num {
				newCard := ro.Session.GetCard()
				ro.Clients[ro.CurrPlayer].Hand = append(ro.Clients[ro.CurrPlayer].Hand, newCard)
			}
			// po pobraniu +x sie restetuje
			ro.Session.Last.Special = "1"

		} else {
			log.Println("could not parse str-> from special +2 card ")

		}



	} else {

		newCard := ro.Session.GetCard()
		ro.Clients[ro.CurrPlayer].Hand = append(ro.Clients[ro.CurrPlayer].Hand, newCard)

	}
}

func (ro *Room) NextPalyer() {
	ro.Mu.Lock()
	defer ro.Mu.Unlock()
	ro.CurrPlayer = (ro.Session.Direction + ro.CurrPlayer + len(ro.Clients)) % len(ro.Clients)
}

func (ro *Room) PlaceCard(card *game.Card) error {
	if ro == nil {
		return errors.New("room in method PlaceCard uninitialized")
	}

	ro.Mu.Lock()
	defer ro.Mu.Unlock()

	if card == nil {
		return errors.New("bad card refrence given to PlaceCard ")
	}

	if ro.Session == nil {
		return errors.New("bad time for method call critical err")
	}

	currClient := ro.Clients[ro.CurrPlayer]

	if currClient == nil {
		return errors.New("current player not found or is nil")
	}

	targetInd := -1

	for i, c := range currClient.Hand {
		if c == nil {
			continue
		}
		if c.Color == card.Color && c.Number == card.Number && c.Special == card.Special {
			targetInd = i
			break
		}
		if card.Special == "wild" && c.Special == "wild" {
			targetInd = i
			break
		}
	}

	if targetInd == -1 {
		return errors.New("could not find given card in hand")
	}
	if !ro.Session.CanPlace(card) {
		return errors.New("did not pass canPlace")
	}

	placeCard := currClient.Hand[targetInd]

	if card.Special == "wild" && placeCard.Special == "wild" {
		// tu musiby zubdejtowac bo czasami przy wysylani wild , musimy przekazac kolor wybrany
		placeCard.Color = card.Color
	}


	if placeCard.Number == 10 {
		if ro.Session.Last != nil && ro.Session.Last.Number == 10 {
			if ro.Session.Last.Special != "" {
				num, _ := strconv.Atoi(ro.Session.Last.Special)
				num += 2
				placeCard.Special = strconv.Itoa(num)

				/// dla broacdacst
				card.Special = strconv.Itoa(num)

			} else {
				placeCard.Special = "4"


				/// dla broacdacst
				card.Special = "2"
			}
		}else{
			placeCard.Special = "2"
			//tu sie juz troche getto robi
			/// dla broacdacst
			card.Special = "2"

		}

	}

	/*c
	else {
		if ro.Session.Last != nil && ro.Session.Last.Number == 10 {
			penalty := 2
			if ro.Session.Last.Special != "" {
				if num, err := strconv.Atoi(ro.Session.Last.Special); err == nil {
					penalty = num
				}
			}

			for range penalty {
				newCard := ro.Session.GetCard()
				currClient.Hand = append(currClient.Hand, newCard)
			}
			ro.Session.Last.Special = ""
		}
	}
	*/
	// apply the efects
	if placeCard.Number == 11 {
		//reverse table moviment
		ro.Session.Direction *= -1
	}

	if placeCard.Number == 12 {
		//block the NextPalyer
		// prechodzimy raz ... a potem jeszczeaz
		ro.NextPalyer()
	}

	if ro.Session.Last != nil && ro.Session.Last.Special != "wild" && ro.Session.Last.Color == "special" && placeCard.Color == "special" && placeCard.Special != "wild" {
		num, _ := strconv.Atoi(ro.Session.Last.Special)
		num += 4
		log.Printf("maby good %v", num )
		placeCard.Special = strconv.Itoa(num)
	}

	/*

		if ro.Session.Last != nil && ro.Session.Last.Special != "wild" && ro.Session.Last.Color == "special" && (placeCard.Color != "special" || placeCard.Special == "wild") {
			if num, err := strconv.Atoi(ro.Session.Last.Special); err == nil {
				for range num {
					newCard := ro.Session.GetCard()
					ro.Clients[ro.CurrPlayer].Hand = append(ro.Clients[ro.CurrPlayer].Hand, newCard)
				}
			}

		}
	*/

	ro.Session.Last = placeCard

	/*
	hand := currClient.Hand
	currClient.Hand = append(hand[:targetInd], hand[targetInd+1:]...)
	hand[len(hand)-1] = nil
	*/

	copy(currClient.Hand[targetInd:], currClient.Hand[targetInd+1:])
	currClient.Hand[len(currClient.Hand)-1] = nil
	currClient.Hand = currClient.Hand[:len(currClient.Hand)-1]
	return nil

}

func (ro *Room) GetHand(con *websocket.Conn) []*game.Card {
	ro.Mu.Lock()
	defer ro.Mu.Unlock()

	for _, c := range ro.Clients {
		if c.Conn == con {
			return c.Hand
		}
	}
	// i dont think this is error prone ... we'll see ig
	return nil
}

func (ro *Room) Broadcast(ctx context.Context, msg []byte) {

	ro.Mu.Lock()
	clientsToBradcast := make([]*Client, 0, len(ro.Clients))

	for _, cli := range ro.Clients {
		clientsToBradcast = append(clientsToBradcast, cli)
	}

	ro.Mu.Unlock()

	for _, cli := range ro.Clients {

		wrCtx, cancel := context.WithTimeout(ctx, time.Second*3)
		err := cli.Conn.Write(wrCtx, websocket.MessageText, []byte(msg))
		cancel()

		if err != nil {
			log.Printf("Blad wysylana w broadcast , usuwam z listy : %v", err)
			cli.Conn.Close(websocket.StatusGoingAway, "blad zapisy")
			ro.RemoveClient(cli.Name)
		}

	}

}



