import { configDotenv } from "dotenv";
configDotenv();

import app from "./app.js";
const PORT = process.env?.PORT || 9000;

async function startServer() {
  await app.listen(PORT, () => {
    console.log(`Auth Server is running on port:${PORT}`);
  });
}

startServer()
  .then(() => console.log("Server is connected succesfully"))
  .catch((err) => {
    console.log("Error while connecting to server");
    process.exit(1);
  });
