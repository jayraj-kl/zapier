import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";
import { parse } from "./parse";
import { sendEmail } from "./email";

const prismaClient = new PrismaClient();
const kafka = new Kafka({ clientId: 'outbox-processor', brokers: ['localhost:9092'] })
const TOPIC_NAME = "zap-events"

async function main() {
    const producer =  kafka.producer();
    await producer.connect();
    const consumer = kafka.consumer({ groupId: 'main-worker' });
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            // console.log({
            //     partition,
            //     offset: message.offset,
            //     value: message.value?.toString(),
            // });
            //
            const parsedValue = JSON.parse(message.value?.toString() || "{}");
            const zapRunId = parsedValue.zapRunId;
            const stage = parsedValue.stage;

            const zapRunDetails = await prismaClient.zapRun.findFirst({
                where: { id: zapRunId },
                include: { zap: { include: { actions: { include: { type: true } } } } }
            });
            console.log("Zap.Run.Details: ");
            console.log(zapRunDetails);
            console.log("ZapRun.Details.Zap.Actions: ");
            console.log(zapRunDetails?.zap.actions);
            const currentAction = zapRunDetails?.zap.actions.find(x => x.sortingOrder === stage);
            console.log("Current Action: ");
            console.log(currentAction);

            if (!currentAction) { console.log("Current action not found?"); return; }

            const zapRunMetadata = zapRunDetails?.metadata;
            console.log("ZapRun.Metadata: ");
            console.log(zapRunMetadata);

            if (currentAction.actionId === "email") { 
                console.log("Email action found")
                const body = parse((currentAction.metadata as JsonObject)?.body as string, zapRunMetadata);
                const to = parse((currentAction.metadata as JsonObject)?.email as string, zapRunMetadata);
                console.log(`Sending out email to ${to} body is ${body}`)
                await sendEmail(to, body);
            }
            if (currentAction.actionId === "send-sol") { 
                console.log("Send-Sol action found")
                const amount = parse((currentAction.metadata as JsonObject)?.amount as string, zapRunMetadata);
                const address = parse((currentAction.metadata as JsonObject)?.address as string, zapRunMetadata);
                console.log(`Sending out SOL of ${amount} to address ${address}`);
                // await sendSol(address, amount); 
            }

            await new Promise(r => setTimeout(r, 3 * 1000));

            const zapId = message.value?.toString();
            const lastStage = (zapRunDetails?.zap.actions.length || 1) - 1;
            if (lastStage !== stage) {
                console.log("pushing back to the queue")
                await producer.send({
                  topic: TOPIC_NAME,
                  messages: [{
                    value: JSON.stringify({
                      stage: stage + 1,
                      zapRunId
                    })
                  }]
                })  
              }
            //
            await consumer.commitOffsets(
                [{
                    topic: TOPIC_NAME,
                    partition : partition,  
                    offset: (parseInt(message.offset) + 1).toString()  
                }]
            );
        },
    });
}

main();