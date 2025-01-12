import express from "express"
import {PrismaClient } from "@prisma/client";

const client = new PrismaClient();
const app = express();
app.use(express.json());

// https://hooks.zapier.com/hooks/catch/17043103/22b8496/
// password logic
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
    const userId = req.params.userId;
    const zapId = req.params.zapId;
    const body = req.body;
    // store in db a new trigger
    await client.$transaction(async tx => {
        const run = await client.zapRun.create({ data: { zapId: zapId, metadata: body } });
        await client.zapRunOutbox.create({ data: { zapRunId: run.id } });
    })
    /*
    START TRANSACTION;

    -- Insert into zapRun table and get the generated ID
    INSERT INTO zapRun (zapId, metadata)
    VALUES ('zapId_value', 'body_value');

    -- Assuming `id` is the AUTO_INCREMENT primary key of zapRun
    SET @runId = LAST_INSERT_ID();

    -- Insert into zapRunOutbox using the generated ID
    INSERT INTO zapRunOutbox (zapRunId)
    VALUES (@runId);

    COMMIT;
    */
    res.json({ message: "Webhook received" });
})

app.listen(3001, () => { console.log("Server is running on port 3001"); });