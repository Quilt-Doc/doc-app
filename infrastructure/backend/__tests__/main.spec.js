require('dotenv').config();
const api = require('../apis/api');


const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

mongoose.connect(dbRoute, { useNewUrlParser: true });


let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));



const initializeRepositories = async () => {

    var backendClient = await api.requestTestingBackendClient();


    var defaultIcon = 1;
    var repositoryCreateData = [
        {
            fullName: 'kgodara-testing/brodal_queue',
            installationId: 12337076,
            icon: defaultIcon,
        },
        {
            fullName: 'kgodara-testing/hamecha',
            installationId: 12337076,
            icon: defaultIcon,
        },
    ];

   
    var requestPromiseList = repositoryCreateData.map(postDataObj => backendClient.post("/repositories/init", postDataObj));
    
    var results;
    try {
        results = await Promise.all(requestPromiseList);
    }
    catch (err) {
        console.log('Failed to successfully Create Repositories');
        throw err;
    }
    console.log('Create Repository Response: ');
    console.log(results);
}


const createWorkspace = async () => {

}



const deleteRepositories = async () => {
    var backendClient = await api.requestTestingBackendClient();


    var defaultIcon = 1;
    var repositoryDeleteData = [
        {
            fullName: 'kgodara-testing/brodal_queue',
            installationId: 12337076,
            icon: defaultIcon,
        },
        {
            fullName: 'kgodara-testing/hamecha',
            installationId: 12337076,
            icon: defaultIcon,
        },
    ];

   
    var requestPromiseList = repositoryCreateData.map(postDataObj => backendClient.post("/repositories/init", postDataObj));
    
    var results;
    try {
        results = await Promise.all(requestPromiseList);
    }
    catch (err) {
        console.log('Failed to successfully Create Repositories');
        throw err;
    }
    console.log('Create Repository Response: ');
    console.log(results);
}



const fetchWorkspace = async () => {

}



beforeAll(async () => {
    return await initializeRepositories();
});
  
afterAll(() => {
    return clearCityDatabase();
});  