export interface ReqJoin {
  action: "joinTable";
  id: string;
}

export interface Card {
  Color: string;
  Number: string;
  Special: string;
}

export interface ClientMessage {
  action: "getTable" | "drawCard" | "placeCard" | "getId";
  card?: Card;
}

export interface ServerResponse {
  Hand?: Array<Card>;
  Table?: Card;
  Error?: string;
  Message?: string;
  CurrPlayer?: number;
  CardsNumbers?:Array<number>;
}
