package game

import (
	"log"
	"math/rand/v2"
)

type Card struct {
	Color   string
	Number  int
	Special string
}

/*

19 Blue cards - 0 to 9
19 Green cards - 0 to 9
19 Red cards - 0 to 9
19 Yellow cards - 0 to 9
8 Draw Two cards - 2 each in blue, green, red and yellow
8 Reverse cards - 2 each in blue, green, red and yellow
8 Skip cards - 2 each in blue, green, red and yellow
4 Wild cards
4 Wild Draw Four cards
//bez tych
1 Wild Shuffle Hands carddd
3 Wild Customizable Cards

*/

//0 x1
//1, 2,3, 4, 5,6,7,8,9 x2
//10 - draw 2  x2
//11 - Reverse x2
//12 - block x2

// 1 , wild  x4
// 2,  draw4 x4
//108 kart

type GameState struct {
	Deck      map[string][]int
	Turn      int
	Direction int
	Last      *Card
	UsedCards int
}

var Colors = []string{"red", "green", "blue", "yellow", "special"}
var Special = []string{"wild", "4" }

func InitGame() *GameState {
	gs := GameState{
		Deck:      make(map[string][]int),
		Direction: 1, // 1 i -1 NIC Innego
		UsedCards: 0,
	}
	gs.Deck["red"] = make([]int, 13)
	gs.Deck["green"] = make([]int, 13)
	gs.Deck["blue"] = make([]int, 13)
	gs.Deck["yellow"] = make([]int, 13)
	gs.Deck["special"] = make([]int, 2)
	return &gs
}



func (gs *GameState) GetCard() *Card {

	// if add the delete remove this
	if gs.UsedCards >= 108 {
		log.Fatal("used all cardss")
	}
	gs.UsedCards += 1

	// this will need updatingg late game would suck
	for {
		color := Colors[rand.N(5)]
		if color == "special" {
			num := rand.N(2)
			if gs.Deck[color][num] < 4 {
				gs.Deck[color][num] += 1
				return &Card{
					Color:   color,
					Number:  num,
					Special: Special[num],
				}
			}
		} else {
			num := rand.N(13)
			if num == 0 {
				if gs.Deck[color][num] < 1 {
					gs.Deck[color][num] += 1
					return &Card{
						Color:   color,
						Number:  num,
						Special: "",
					}
				}

			} else if gs.Deck[color][num] < 2 {
				gs.Deck[color][num] += 1
				return &Card{
					Color:   color,
					Number:  num,
					Special: "",
				}
			}

		}

	}

}

func (gs * GameState) CanPlace(card *Card) bool{
	if gs.Last == nil{
		return true
	}
	if gs.Last.Color == card.Color || card.Color == "special" {
		return true
	}
	if gs.Last.Number == card.Number{
		return true
	}
	if card.Special == "wild"{
		return true
	}
	if gs.Last.Color == "special" && gs.Last.Special == "1"{
		// po pobraniu kart z +4
		return true
	}

	if gs.Last.Special != "wild" && gs.Last.Color == "special"  && card.Color == "special" && card.Special != "wild"{
		return true
	}


	return false

}

func (gs *GameState) RemoveCard(c *Card) {
	// removin gard an refreshing the deck ,when the card is thrown ,
	//pisze mi GEMINI ze te karty powinny starczyc
}
