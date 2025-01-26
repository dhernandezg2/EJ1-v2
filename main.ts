import { Collection, MongoClient, ObjectId } from 'mongodb'
import { deckModel } from "./types.ts";
import { fromModelToDeck } from "./utils.ts";


const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  throw new Error("error MONGO_URL");
}

let client: MongoClient | null = null;
let deckCollection: Collection<deckModel> | null = null;

if(MONGO_URL){
  client = new MongoClient(MONGO_URL)
  await client.connect();
  console.info("Connected to MongoDB");

const db = client.db("magic");
deckCollection = db.collection<deckModel>("deck");
}


export async function handler (req: Request):Promise<Response> {

  if(!client || !deckCollection) throw new Error ("elol")

  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;
  
  if(method === "GET") {
      if(path === "/decks") {
          const mazos = await deckCollection.find().toArray()
          const mostrar = mazos.map((elem)=> fromModelToDeck(elem))
          return new Response(JSON.stringify(mostrar))

      }

      if(path === "/deck") {
        const searchparams = url.searchParams
        const id = searchparams.get("id")
        if(id) {
          if(ObjectId.isValid(id)) {
            const encontrado = await deckCollection.findOne({_id: new ObjectId(id)})
            if(encontrado){
              return new Response(JSON.stringify(fromModelToDeck(encontrado)))
            }
          }
        }
        return new Response ("ID no encontrado", {status: 404})
      }

  }

  else if(method === "POST") {

    if(path === "/addDeck") {

      if(!req.body) return new Response ("bad request", {status: 404})
        const payload = await req.json()
      if(!payload.deckName || !payload.colours || !payload.commander) return new Response ("Relleno todos los campos", {status: 400})
        const encontrado = await deckCollection.findOne({deckName: payload.deckName})
      if(encontrado) return new Response ("Nombre en uso", {status: 404})
        const {insertedId} = await deckCollection.insertOne({
          deckName: payload.deckName,
          colours: payload.colours,
          commander: payload.commander
        })

        return new Response (JSON.stringify({
          id: insertedId,
          deckName: payload.deckName,
          colours: payload.colours,
          commander: payload.commander
        }))

    }

  }

  else if(method === "/PUT"){

    if(path === "/updateDeck"){

      if(!req.body) return new Response ("bad request", {status: 404})
        const payload = await req.json()
      if(!payload.id) return new Response("Id no encontrado", {status: 404})
        if(ObjectId.isValid(payload.id)) {
          const encontrado = await deckCollection.findOne({_id: new ObjectId(payload.id)})
          if(!encontrado) return new Response ("id no encontrado", {status: 404})
          const encontrado1 = await deckCollection.findOne({deckName: payload.deckName})
          if(!encontrado1) return new Response ("nombre en uso", {status: 404})

          const set = {
            deckName: payload.deckName ?? encontrado.deckName,
            colours: payload.colours ?? encontrado.colours,
            commander: payload.commander ?? encontrado.commander
          }

          await deckCollection.updateOne({_id: new ObjectId(payload.id)},{$set: set})

          return new Response (JSON.stringify({
            id: payload.id,
            deckName: payload.deckName ?? encontrado.deckName,
            colours: payload.colours ?? encontrado.colours,
            commander: payload.commander ?? encontrado.commander
          }))
        }
      return new Response ("id no valido", {status:404})
    }

  }

  else if (method === "DELETE") {

    if(path === "/deleteDeck") {
      const searchparams = url.searchParams
      const id = searchparams.get("id")
      if(id){
      const {deletedCount} = await deckCollection.deleteOne({_id: new ObjectId(id)})
      if(deletedCount === 0) return new Response ("rr", {status:404})
        return new Response ("Borrado")

       }
      }
    }

    return new Response("metodo no encontrado")
  }

Deno.serve({ port: 8080 }, handler);


