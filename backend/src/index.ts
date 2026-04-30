import app from "./app";
export { default as prisma } from "./config/prisma";
export * from "./config/prisma";

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

