var mongo = require('mongodb'), Server = mongo.Server, Db = mongo.Db;
import { IDocumentStore, DocumentStore, IDocumentSession, RequestExecutor, PutDocumentCommand } from 'ravendb';
import { MongoOptions } from './mongoOptions';
import { RavenOptions } from './ravenOptions';

export class Migrator {
    requestExecutor: RequestExecutor;
    private server: any = mongo.Server;
    db: any = mongo.Db;

    async run(mongoOptions: MongoOptions, ravenOptions: RavenOptions) :Promise<any> {
        await this.initRavenDb(ravenOptions);
        await this.initMongoDb(mongoOptions)
        let collInfos = await this.db.listCollections().toArray();
        console.log(`MongoDb database ${mongoOptions.dbName} has ${collInfos.length} collections`);
        for (let collInfo of collInfos) {
            let documents = await this.db.collection(collInfo.name).find().sort({ _id: 1 }).toArray();
            console.log(`migrating ${documents.length} from collection ${collInfo.name}`);
            await this.migrateDocuments(documents, collInfo.name);            
        }
    }

    async migrateDocuments(mongoDbDocuments:any[], collectionName) {
        let targetCollectionName = collectionName + '/';
        for(let document of mongoDbDocuments){
            document['@metadata'] = { '@collection': collectionName };
            if(document._id){
                document['created'] = this.convertMongoId(document._id);
                delete document['_id'];
            }
            await this.requestExecutor.execute(new PutDocumentCommand(targetCollectionName,  document))
        }
    }

    async initMongoDb(mongoOptions:MongoOptions): Promise<any> {
        this.server = new Server(mongoOptions.serverUrl, mongoOptions.port, { auto_reconnect: true });
        this.db = new Db(mongoOptions.dbName, this.server);
        return this.db.open();
    }

    async initRavenDb(options:RavenOptions): Promise<any> {
        let store = DocumentStore.create(options.serverUrl,  options.dbName);
        store.initialize();
        console.log('initialized ravendb');
        this.requestExecutor = store.getRequestExecutor();
    }

    convertMongoId(value):Date {
        let timestamp = value.toString().substring(0, 8);
        let date = new Date(parseInt(timestamp, 16) * 1000);
        return date;
      }
}