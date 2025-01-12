
import { Router } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../db";
import { JWT_PASSWORD } from "../config";
import { authMiddleware } from "../middleware";
import { SigninSchema, SignupSchema } from "../types";

const router = Router();

router.post("/signup", async (req, res) => {
    console.log("/api/v1/user/signup is hit");
    const body = req.body;
    const parsedData = SignupSchema.safeParse(body);

    if (!parsedData.success) {
        // console.log(parsedData.error);
        return res.status(411).json({ message: "Incorrect inputs" })
    }
    const userExists = await prismaClient.user.findFirst({ where: { email: parsedData.data.username } });
    if (userExists) { return res.status(403).json({ message: "User already exists" }) }
    
    // TODO: Dont store passwords in plaintext, hash it
    await prismaClient.user.create({ data: { email: parsedData.data.username, password: parsedData.data.password, name: parsedData.data.name } })
    // await sendEmail();

    return res.json({ message: "Please verify your account by checking your email" });

})

router.post("/signin", async (req, res) => {
    console.log("/api/v1/user/signin is hit");
    const body = req.body;
    const parsedData = SigninSchema.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const user = await prismaClient.user.findFirst({ where: { email: parsedData.data.username, password: parsedData.data.password } });
    if (!user) { return res.status(403).json({ message: "Sorry credentials are incorrect" }) }

    // sign the jwt
    const token = jwt.sign({ id: user.id }, JWT_PASSWORD);
    res.json({ token: token, });
})

router.get("/", authMiddleware, async (req, res) => {
    console.log("/api/v1/user/signup is hit");
    // TODO: Fix the type
    // @ts-ignore
    const id = req.id;
    const user = await prismaClient.user.findFirst({ where: { id }, select: { name: true, email: true } });

    return res.json({ user });
})

export const userRouter = router;