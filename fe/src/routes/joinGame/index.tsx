import { Card, ClientMessage, ReqJoin, ServerResponse } from '@/types';
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/joinGame/')({
  component: JoinGameComponent,
})

export default function JoinGameComponent() {

    const wsRef = useRef<WebSocket | null>(null)
    const idRef = useRef<HTMLInputElement| null>(null)
    const [hand, setHand] = useState< Array<Card>| null>(null)
    const [table, setTable] = useState<Card| null>(null)
    const [error, setError]  = useState<string | null>(null)
    useEffect(()=>{
        const ws = new WebSocket('ws://localhost:8080/api/joinGame')
        wsRef.current = ws

        ws.onopen=()=>{
            console.log("created")
        }

        ws.onmessage=(event)=>{
            try{
                const data:ServerResponse = JSON.parse(event.data)
                console.log("Wiadomość z serwera:", data)

                if (data.Error){
                    setError(data.Error)
                }
                if(data.Hand){
                    setHand(data.Hand)
                    setError(null)
                }
                if(data.Table){
                    setTable(data.Table)
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

    const sendJoin = (req:ReqJoin) =>{
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(JSON.stringify(req))
        }else{
            console.error("brak polonczenia z serverem")
        }
    }

    const sendAction = (action:ClientMessage) =>{
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(JSON.stringify(action))
        }else{
            console.error("brak polonczenia z serverem")
        }
    }


    return (
        <div >
        {error && <div>{error}</div>}

        <div>
            <input ref={idRef} placeholder="root-id"></input>
            <button
                onClick={()=>{

                    if (idRef.current?.value){
                        const id = idRef.current?.value.trim()
                        sendJoin({action:"joinTable" ,id:id})
                    }else{
                        alert("fill out id before joining")
                    }

                }}
            >
            doloncz
            </button>

        </div>

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

        </div>

                <div>
                    <h3> hand </h3>
                    {
                        hand && (
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
