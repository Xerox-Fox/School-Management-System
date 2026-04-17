const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000

const userRoutes = require("./Routes/userRoute")
const reportRoute = require("./Routes/reportRoute")
const blogRoute = require("./Routes/blogRoute")
const gradeRoute = require("./Routes/gradeRoute")

const conn = require("./Data/dbConfig")

app.use(cors())
app.use(express.json())
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use('/uploads', express.static('uploads'));

app.use("/api/users", userRoutes)
app.use('/api/report-st', reportRoute)
app.use('/api/blog', blogRoute)
app.use('/api/results', gradeRoute)



async function start() {
    try{
        const db = await conn;
        await db.get("SELECT 1");
        console.log("Database connection established");

        app.listen(port, () => {
            console.log(`Server is running and listening on port ${port}`);
        });
        
    } catch (error) {
        console.log(error.message)
    }
}

start()