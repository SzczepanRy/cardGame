package main

import (
	router "cardgame/internal/api"
	"log"
	"net/http"
)


func main(){
	r:= router.NewRouter()
	err := http.ListenAndServe(":8080", r)
	if err == nil{
		log.Print("ListenAndServe 8080")

	}

}



