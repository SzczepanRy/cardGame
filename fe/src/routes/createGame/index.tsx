import { Card, ClientMessage, ServerResponse } from '@/types';
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/createGame/')({
  component: CreateGameComponent,
})

//stores state


/*
CurrPlayer int `json:"CurrPlayer"`
Cards []int `json:"Cards"`


type TableRef struct {
	Table *game.Card `json:"Table"`
	CurrPlayer int `json:"CurrPlayer"`
	CardsNumbers []int `json:"CardsNumbers"`
}

*/


export default function CreateGameComponent() {
    const wsRef = useRef<WebSocket | null>(null)
    const [hand, setHand] = useState< Array<Card>| null>(null)
    const [table, setTable] = useState<Card| null>(null)
    const [CurrPlayer, setCurrPlayer] = useState<number| null>(null)
    const [CardsNumbers, setCardsNumbers] = useState< Array<number>| null>(null)
    const [CalledUno, setCalledUno] = useState< Array<boolean>| null>(null)

    const [srvMsg, setSrvMsg] = useState<string| null>(null)
    const [error, setError]  = useState<string | null>(null)
    useEffect(()=>{
        const ws = new WebSocket('ws://localhost:8080/api/newGame')
        wsRef.current = ws

        ws.onopen= ()=>{
            console.log("created")
            sendAction({action:'getId'})
        }

        ws.onmessage = (event)=>{
            try{
                const data:ServerResponse = JSON.parse(event.data)
                console.log("Wiadomość z serwera:", data)

                if (data.Message){
                    setSrvMsg(data.Message)
                }

                if (data.Error){
                    setError(data.Error)
                }

                if (data.Hand !== undefined){
                    setHand(data.Hand)
                    setError(null)
                }

                if(data.Table){
                    setTable(data.Table)
                    setError(null)
                }
                if (data.CurrPlayer !== undefined){
                    setCurrPlayer(data.CurrPlayer)
                    setError(null)
                }
                if (data.CalledUno !== undefined){
                    setCalledUno(data.CalledUno)
                    setError(null)
                }

                if(data.CardsNumbers){
                    setCardsNumbers(data.CardsNumbers)
                    setError(null)
                }


            }catch(err){
                console.error(err)
            }
        }

        ws.onerror=(err)=>{
            console.error(err)
        }
        ws.onclose = (err) => {
            console.error(err.reason)
        }

        return ()=>{
            ws.close()
        }
    },[])

    const sendAction = (action:ClientMessage) =>{
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(JSON.stringify(action))
            // ref after draw
            if (action.action == "drawCard"){
                sendAction({action:'getTable'})
            }
        }else{
            console.error("brak polonczenia z serverem")
        }
    }


    return (
        <div >
        {error && <div>{error}</div>}

        {
            CurrPlayer !== null &&(
                <div>
                    the curr player is {CurrPlayer}
                </div>
            )

        }


        {
            CardsNumbers && (
                CardsNumbers.map((el,i ) => {
                    return (
                        <div>player {i} has {el} cards </div>
                    )
                } )
            )
        }

        {
            CalledUno != null && (
                CalledUno.map((el,i ) => {
                    return (
                        <div>player {i} uno status {el? "true" : "false"}

                        <button
                        onClick={()=> sendAction({action:'checkUno', message:`${i}`})}
                        >
                        callout uno
                        </button>




                        </div>
                    )
                } )

            )

        }


        <div>
            <button
                onClick={()=> sendAction({action:'getTable'})}
            >
            pobierz stan
            </button>

            <button
                onClick={()=> sendAction({action:'drawCard'})}
            >
                pobierz karte
            </button>
            <button
                onClick={()=> sendAction({action:'callUno'})}
            >
                poiwedz uno (zadziala przy miniej miz 3 katy )
            </button>


        </div>
        {
            srvMsg && (
                 <div>
                    <p>room id: {srvMsg} </p>
                </div>
            )
        }


        <div>
            <h3> hand </h3>
            {
                hand != null && (
                    hand.map((el,i) => {
                        if( el.Special == "wild") {
                            return(
                                <div key={i}>
                                <p> {JSON.stringify(el)}</p>
                                <button onClick={
                                    ()=>{
                                        el.Color="red";
                                        sendAction({action:"placeCard" , card:el});
                                        sendAction({action:"getTable" });
                                    }

                                }> red</button>
                                <button onClick={
                                    ()=>{
                                        el.Color="blue";
                                        sendAction({action:"placeCard" , card:el})
                                        sendAction({action:"getTable" })
                                    }

                                }> blue</button>
                                <button onClick={
                                    ()=>{
                                        el.Color="green";
                                        sendAction({action:"placeCard" , card:el})
                                        sendAction({action:"getTable" })
                                    }

                                }> green</button>
                                <button onClick={
                                    ()=>{
                                        el.Color="yellow";
                                        sendAction({action:"placeCard" , card:el})
                                        sendAction({action:"getTable" })
                                    }

                                }> yellow</button>


                                </div>
                            )

                        }else{
                         return(
                            <div key={i}>
                                <p> {JSON.stringify(el)}</p>
                                <button onClick={
                                    ()=>{
                                        sendAction({action:"placeCard" , card:el})
                                        sendAction({action:"getTable" })
                                    }

                                }> throw </button>
                                </div>
                            )


                        }
                    })
                )

            }
            <h3>table</h3>
            {
                table &&(
                <p>
                {JSON.stringify(table)}
                </p>
                )
            }
        </div>



        </div>
    );
}
