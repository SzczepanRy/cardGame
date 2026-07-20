package rooms

import (
	"cardgame/internal/api/room"
	"errors"
	"sync"
)

type RoomManager struct {
	Mux   sync.RWMutex
	Rooms map[string]*room.Room
}

func InitRooms() *RoomManager {
	rm := RoomManager{
		Rooms: make(map[string]*room.Room),
		Mux:   sync.RWMutex{},
	}

	return &rm
}

func (rm *RoomManager) AddRoom(roomId string) error {
	rm.Mux.Lock()
	defer rm.Mux.Unlock()

	if rm == nil {
		return errors.New("room manager is nil")
	}

	if rm.Rooms[roomId] == nil {
		rm.Rooms[roomId] = room.InitRoom(roomId)
		return nil
	}
	return errors.New("room with a given id already exists")
}

func (rm *RoomManager) DeleteRoom(roomId string) error {
	rm.Mux.Lock()
	defer rm.Mux.Unlock()
	if rm.Rooms[roomId] != nil {
		for _, client := range rm.Rooms[roomId].Clients {
			rm.Rooms[roomId].RemoveClient(client.Name)
			//migh need update when pluggin in game
		}
		delete(rm.Rooms, roomId)
		return nil
	}
	return errors.New("room with a given id already is nonexistant")
}

