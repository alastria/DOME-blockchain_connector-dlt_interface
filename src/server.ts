import dotenv from "dotenv";
dotenv.config();

const express = require("express")
const morgan = require("morgan")

import router from "./routes/routes"
import session from "express-session";

const app = express()
const port = 8080



// Logging
app.use(morgan("dev"))

/** Parse the request */
app.use(express.urlencoded({ extended: false }));

/** Takes care of JSON data */
app.use(express.json());

/** RULES OF OUR API */
router.use((req: any, res: any, next: any) => {
    // set the CORS policy
    res.header('Access-Control-Allow-Origin', '*');
    // set the CORS headers
    res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
    // set the CORS method headers
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
        return res.status(200).json({});
    }
    next();
});

/** ExpressJS session */
app.use(session({
    // TODO: this is only for demo purposes.
    secret: "verySecretSecret",
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,            //setting this false for http connections
    },
    name: "rpProxyCookie"
}))


/** Routes */
app.use("/", router)


/** Error handling */
app.use((req: any, res: any, next: any) => {
    const error = new Error('not found');
    return res.status(404).json({
        message: error.message
    });
});

app.listen(port, () => {
    console.log(`DLT Interface API listening at http://localhost:${port}`)
})