require('dotenv').config()
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()

const port = process.env.PORT || 5000


//middleware 
app.use(express.json())
app.use(cors())

//mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.25fgudl.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const userCollection=client.db('BuildingManagement').collection('users')
const apartmentCollection=client.db('BuildingManagement').collection('apartment')
//post users details
app.post('/users',async(req,res)=>{
  let result="Alreary added this user";
  const users=req.body;
  const userEmail=users.email;
  const query={email:userEmail};
  const findUser=await userCollection.findOne(query);
  if(!findUser){
     result=await userCollection.insertOne(users)
  }
  console.log(result);
   res.send(result);
})

//get apartmentdata
 app.get('/apartment',async(req,res)=>{
  const result=await apartmentCollection.find().toArray()
  res.send(result)
  console.log(result)
 })



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//connecting server
app.get('/', (req, res) => {
    res.send('server is connecting')
  })
  
  //runing port
  app.listen(port, () => {
    console.log('running  port is : ', port)
  })
  