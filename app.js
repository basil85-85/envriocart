import express from "express";
const app = express();
import env from "dotenv/config";
import  db  from "./config/db.js";


db()
app.listen(process.env.PORT, () => {
    console.log(process.env.POST_LISTEN);
});
