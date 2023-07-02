import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL); 
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message));

// LÓGICA DO BACK-END

app.post("/participants", async (req, res) => {
    const { name } = req.body

    const schemaParticipant = joi.object({
        name: joi.string().required()
    })

    const validation = schemaParticipant.validate(req.body, { abortEarly: false })

    if (validation.error){
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const participant = await db.collection("participants").findOne({ name: name})
        if (participant) return res.status(409).send("This username is taken!")

        await Promise.all([db.collection("participants").insertOne(req.body, { lastStatus: Date.now() }), db.collection("messages").insertOne({from: req.body, to: 'Todos', text: 'Entra na sala...', type: 'status', time:'HH:mm:ss' })])
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

//FIM DA LÓGICA DO BACK-END

const PORT = 5000;
app.listen(PORT, () => (`O servidor está rodando na porta ${PORT}`));