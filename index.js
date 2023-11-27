require('dotenv').config()
const express = require('express')
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()

const port = process.env.PORT || 5000

// console.log(process.env.ACCESS_TOKEN_SECRET)
//middleware 
app.use(express.json())
app.use(cors())
//middleware
const varifyToken = (req, res, next) => {
  // console.log("varify token: ", req.headers)
  // console.log("varify token: ", req.headers.authorization)
  if (!req.headers.authorization) {
    return res.status(401).send({ messages: 'forbiden assess' })
  }
  const token = req.headers.authorization.split(' ')[1];
  // console.log(token)
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
const announcementCollection = client.db('BuildingManagement').collection('announcements')
const ageementAcceptCollection = client.db('BuildingManagement').collection('Acceptapartment')
const cuponsCollection = client.db('BuildingManagement').collection('cupons')
//jwt 
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' })

  res.send({ token })
})
//cupon collection
app.post('/cupons',varifyToken,async (req, res) => {
  const cupon = req.body;
  console.log('cupon',cupon)
  const result = await cuponsCollection.insertOne(cupon);
  res.send(result)
  console.log(result)
})
//announcement Collection
app.get('/announcements', async (req, res) => {
  const result = await announcementCollection.find().toArray()
  res.send(result)
  console.log(result)
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
  // console.log(findUser);
  res.send(findUser);
})
//check admin
app.get('/user/admin/:email', varifyToken, async (req, res) => {
  const email = req.params.email;
  // console.log(email)
  // console.log(req.decoded.email)
  if (email !== req.decoded.email) {
    return res.status(403).send({ massages: 'unauthorized access' })
  }
  const query = { email: email }

  const user = await userCollection.findOne(query);
  let role = false;
  // let member = false;
  // console.log(user)
  if (user?.role === 'admin') {
    role = 'admin';

  } else if (user?.role === 'member') {
    role = 'member'
  } else {
    role = 'user'
  }
  res.send({ role });
  console.log({ role })
})


//get agreements request
app.get('/agreementsRequest', varifyToken, async (req, res) => {
  const agreementsUser = await ageementCollection.find().toArray();
  // console.log(agreementsUser);
  res.send(agreementsUser);
})
//update agreements request
app.patch('/agreementsRequest', varifyToken, async (req, res) => {
  const id = req.query.id;
  const useremail = req.query.email;
  // console.log(id,email)
  const filter = { _id: new ObjectId(id) }
  console.log(filter)
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      status: 'checked',
    },
  };
  // const result =await ageementCollection.findOne(filter)
  const result = await ageementCollection.updateOne(filter, updateDoc, options);

  if (result.modifiedCount) {
    const query = { email: useremail }
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        role: 'member'
      },
    };
    const userresult = await userCollection.updateOne(query, updateDoc, options);
    if (userresult) {
      const acceptRequest = await ageementCollection.findOne(filter)


      const requestinfo = {
        requetsId: acceptRequest?._id,
        userName: acceptRequest?.userName,
        userEmail: acceptRequest?.userEmail,
        floorNo: acceptRequest?.floorNo,
        apartmentNo: acceptRequest?.apartmentNo,
        blockName: acceptRequest?.blockName,
        rent: acceptRequest?.rent,
        requestDate: acceptRequest?.requestDate,
        RoomNo: acceptRequest?.roomNo,
        // acceptRequest,
        AcceptedDate: formattedDate,
      }
      const insertData = await ageementAcceptCollection.insertOne(requestinfo)
      console.log('userRole', userresult)
      res.send({ acceptStatus: result, userStasus: userresult, insertData })
    }
  }
  // console.log(result)
})
//handle reject request
app.patch('/agreementsRejectRequest', varifyToken, async (req, res) => {
  const id = req.query.id;
  // console.log(id,email)
  const filter = { _id: new ObjectId(id) }
  console.log(filter)

  const updateDoc = {
    $set: {
      status: 'checked'
    },
  };
  // const result =await ageementCollection.findOne(filter)
  const result = await ageementCollection.updateOne(filter, updateDoc);

  console.log("update user:", result)
  res.send(result)
})

//manage member
app.patch('/userRole', varifyToken, async (req, res) => {
  const id = req.query.id;
  console.log(id)
  const filter = { _id: new ObjectId(id) }
  console.log(filter)
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      role: 'user'
    },
  };
  const userresult = await userCollection.updateOne(filter, updateDoc, options);
  res.send(userresult)
  console.log(userresult)

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
//find user Ageement of specific user 
app.get('/ageementuser/:email', varifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { userEmail: email }
  console.log(email)
  console.log(query)
  const result = await ageementAcceptCollection.findOne(query)
  console.log(result)
  res.send(result)
})
//make Announcement
app.post('/makeannouncement', varifyToken, async (req, res) => {
  const announcementInfo = req.body
  const result = await announcementCollection.insertOne(announcementInfo)
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
