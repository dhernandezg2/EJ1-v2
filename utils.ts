import { deckModel,deck } from "./types.ts";


export function fromModelToDeck(deckOG: deckModel):deck {
    return {
        id: deckOG._id!.toString(),
        deckName: deckOG.deckName,
        colours: deckOG.colours,
        commander: deckOG.commander
    }
}