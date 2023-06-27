import express from "express";
import cors from "cors";

const app = express();
app.use (cors());
app.use (express.json());

const PORT = 5000;

// LÓGICA DO BACK-END

app.listen (PORT, () => (`O servidor está rodando na porta ${PORT}`));