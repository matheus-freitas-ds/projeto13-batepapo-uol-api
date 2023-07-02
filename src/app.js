import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";

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

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    const newParticipant = { name: name, lastStatus: Date.now() }

    try {
        const participant = await db.collection("participants").findOne({ name: name })
        if (participant) return res.status(409).send("This username is taken!")

        await Promise.all([db.collection("participants").insertOne(newParticipant), db.collection("messages").insertOne({ from: name, to: 'Todos', text: 'Entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss') })])
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray()
        if (!participants) {
            return res.send([])
        } else (res.send(participants))
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body
    const user = req.header.user

    const schemaMessage = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private-message").required()
    })

    const validation = schemaMessage.validate(req.body, { abortEarly: false })

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    const newMessage = { from: user, to, text, type, time: dayjs().format('HH:mm:ss') }

    try {
        const participant = await db.collection("participants").findOne( { name: user } )
        if (!participant) return res.status(422).send("Nome não encontrado")

        await db.collection("messages").insertOne(newMessage)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

//FIM DA LÓGICA DO BACK-END

const PORT = 5000;
app.listen(PORT, () => (`O servidor está rodando na porta ${PORT}`));