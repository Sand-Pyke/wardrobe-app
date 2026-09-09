import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`Wardrobe API listening on :${env.port}`);
});
