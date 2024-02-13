import dotenv from "dotenv";
dotenv.config();

const express = require("express")
const morgan = require("morgan")


import router from "./routes/routes"

const app = express()
const port = 8080

// Disable expressjs version in headers.
app.disable("x-powered-by");

// Logging
app.use(morgan("dev"))

/** Parse the request */
app.use(express.urlencoded({ extended: false }));

/** Takes care of JSON data */
app.use(express.json());

router.use((req: any, res: any, next: any) => {

    // Define an array of allowed origins (replace with your actual origins)
    const allowedOrigins = ['*'];

    // Check if the request origin is in the allowed origins
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        console.log("*****"+req.header);
    }

    // Set the allowed headers and methods
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, POST');

    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Continue with the request
    next();
});

/** Routes */
app.use("/", router)


/** Error handling */
app.use((req: any, res: any, next: any) => {
    const error = new Error("Not Found");
    return res.status(404).json({ message: error.message });
});



app.listen(port, () => {
    console.log(`DLT Interface API listening at http://localhost:${port}`)
})

module.exports = {app}

