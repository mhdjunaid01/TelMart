const MongoClient = require('mongodb').MongoClient;
const state={
    db:null
};
let dbname;
let url;
//mongodb://127.0.0.1:27017
module.exports.connect=function(done){
    url='mongodb+srv://admin:admin123@telmart.hvaxpa6.mongodb.net/?retryWrites=true&w=majority';
    dbname='user';

    MongoClient.connect(url,(err,data)=>{
        if(err) return done(err);
        state.db=data.db(dbname);
        done();
    });
};

module.exports.get= ()=>{
    return state.db;
};