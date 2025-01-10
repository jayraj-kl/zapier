import { Router } from "express";
import { authMiddleware } from "../middleware";
import { ZapCreateSchema } from "../types";
import { prismaClient } from "../db";
import { create } from "ts-node";
 
const router = Router();

router.post("/", authMiddleware, async (req, res) => {
    // @ts-ignore
    const id: string = req.id;
    const body = req.body;
    const parsedData = ZapCreateSchema.safeParse(body);

    if (!parsedData.success) { return res.status(411).json({ message: "Incorrect inputs" }) }

    const zapId = await prismaClient.$transaction(async (tx: { trigger: { create: (arg0: { data: { zapId: any; triggerId: string; }; }) => any; }; zap: { update: (arg0: { where: { id: any; }; data: { triggerId: any; }; }) => any; }; }) => {
        const zap = await prismaClient.zap.create({
            data: {
                triggerId: "",
                actions: {
                    create: parsedData.data.actions.map((x, index) => ({
                        actionId: x.availableActionId,
                        sortingOrder: index
                    }))
                }
            }
        })

        const trigger = await tx.trigger.create({ data: { zapId: zap.id, triggerId: parsedData.data.availableTriggerId } })
        await tx.zap.update({ where: { id: zap.id }, data: { triggerId: trigger.id } })
    });
    res.json({ message: "Zap created successfully", zapId });
})

router.get("/", authMiddleware, async (req, res) => {
    // @ts-ignore
    const id: string = req.id;
    const zaps = await prismaClient.zap.findMany({
        where: { userId: id }, include: { actions: { include: { type: true } }, trigger: { include: { type: true } } }
    });
    res.json({ zaps });
})

router.get("/:zapId", authMiddleware, async (req, res) => {
    // @ts-ignore
    const id: string = req.id;
    const zapId = req.params.zapId;
    const zap = await prismaClient.zap.findFirst({
        where: { id: zapId, userId: id }, include: { actions: { include: { type: true } }, trigger: { include: { type: true } } }
    });
    res.json({ zap });
});

export const zapRouter = router;