import "dotenv/config.js";
import app from "./src/app.js";
import { saveClicks } from "./src/services/url.service.js";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("server is running");
});

// every 10 seconds, move the click counts from redis to postgres
setInterval(saveClicks, 10000);
