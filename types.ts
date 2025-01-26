import { ObjectId} from "mongodb";

export type deckModel = {
    _id?: ObjectId,
    deckName: string,
    colours:string[],
    commander:string

}


export type deck = {
    id:string,
    deckName: string,
    colours: string[],
    commander:string
}