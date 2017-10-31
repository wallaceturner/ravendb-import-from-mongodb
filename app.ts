import { Migrator } from "./migrator";
import { RavenOptions } from "./ravenOptions";
import { MongoOptions } from "./mongoOptions";

process.on('uncaughtException', (err: any) => { console.error('uncaughtException', err); });
process.on("unhandledRejection", (reason: any, promise: any) => { console.error('unhandledRejection', reason); });


try {
  (async () => {
    let mongoOptions = new MongoOptions('localhost', 27017, 'TestDb');
    let ravenOptions = new RavenOptions('http://localhost:8080', 'TestDb');

    await new Migrator().run(mongoOptions, ravenOptions);
    console.log('finished');
    process.exit(0);
  })();



} catch (e) {
  console.log(e);
}

