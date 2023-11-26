require('dotenv').config()
const express = require('express')
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()

const port = process.env.PORT || 5000

// console.log(process.env.ACCESS_TOKEN_SECRET)
//middleware 
app.use(express.json())
app.use(cors())
//middleware
const varifyToken = (req, res, next) => {
  console.log("varify token: ", req.headers)
  console.log("varify token: ", req.headers.authorization)
  if (!req.headers.authorization) {
    return res.status(401).send({ messages: 'forbiden assess' })
  }
  const token = req.headers.authorization.split(' ')[1];
  console.log(token)
  // console.log(token)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ messages: 'forbiden assess' })
    }
    req.decoded = decoded
    // console.log(decoded)
    next()
  });
}
// //varify admin
// const verifyAdmin = async (req, res, next) => {
//   const email = req.decoded.email;
//   const query = { userEmail: email };
//   const user = await userCollection.findOne(query);
//   const isAdmin = user?.role === 'admin';

//   if (!isAdmin) {
//     return res.status(403).send({ messages: "forbidden access" })
//   }
//   console.log("Admin", isAdmin)
//   console.log('All user:', user)
//   //  req.user=user
//   next()
// }

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
//database collection
const userCollection = client.db('BuildingManagement').collection('users')
const apartmentCollection = client.db('BuildingManagement').collection('apartment')
const ageementCollection = client.db('BuildingManagement').collection('ageements')
//jwt 
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' })

  res.send({ token })
})
//post users details
app.post('/users', async (req, res) => {
  let result = "Alreary added this user";
  const users = req.body;
  const userEmail = users.email;
  const query = { email: userEmail };
  const findUser = await userCollection.findOne(query);
  if (!findUser) {
    result = await userCollection.insertOne(users)
  }
  // console.log(result);
  res.send(result);
})
//get users details
app.get('/users', async (req, res) => {
  const findUser = await userCollection.find().toArray();
  console.log(findUser);
  res.send(findUser);
})
//get agreements request
app.get('/agreementsRequest',varifyToken, async (req, res) => {
  const agreementsUser = await ageementCollection.find().toArray();
  console.log(agreementsUser);
  res.send(agreementsUser);
})

//get apartmentdata
app.get('/apartment', async (req, res) => {
  const result = await apartmentCollection.find().toArray()
  res.send(result)
  // console.log(result)
})
//post user Ageement 
app.post('/ageement', async (req, res) => {
  const ageementData = req.body;
  const result = await ageementCollection.insertOne(ageementData)
  console.log(result)
  res.send(result)
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
