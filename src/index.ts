import dotenv from "dotenv";
import log from "@utils/logger";
import createServer, { getServerPort } from "./config/server";

dotenv.config();

const port = getServerPort();
const app = createServer(port);

app.listen(port, async () => {
  log.info(`Server is running at ${process.env.URL}:${port}`);
});
