// const express = require('express');
// const cors = require('cors');
// const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wcellxl.mongodb.net/?appName=Cluster0`;
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// let addCollection;

// async function run() {
//   try {
//     // await client.connect();
//     console.log('✅ Connected to MongoDB');

//     const db = client.db('Personal_Finance_Management_App');
//     const addCollection = db.collection('add');
//     const userCollection = db.collection('user');
//     // GET user by email
//     // GET user by email
//     app.get('/users/by-email', async (req, res) => {
//       try {
//         const email = req.query.email;

//         if (!email) {
//           return res.status(400).send({ message: 'Email is required' });
//         }

//         const user = await userCollection.findOne({ email });

//         if (!user) {
//           return res.status(404).send({ message: 'User not found' });
//         }

//         // শুধুমাত্র প্রয়োজনীয় ডেটা রিটার্ন করা
//         const userData = {
//           _id: user._id,
//           firstName: user.firstName,
//           email: user.email,
//           imgUrl: user.imgUrl,
//           createdAt: user.createdAt,
//           updatedAt: user.updatedAt || null,
//         };

//         res.send(userData);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: 'Server error' });
//       }
//     });

//     app.post('/users', async (req, res) => {
//       try {
//         const { firstName, email, password, imgUrl } = req.body;

//         if (!firstName || !email || !imgUrl) {
//           return res.status(400).send({ message: 'All fields are required' });
//         }

//         // Check if user already exists
//         const existingUser = await userCollection.findOne({ email });

//         if (existingUser) {
//           // Update existing user data (especially for Google login)
//           const updatedUser = await userCollection.updateOne(
//             { email },
//             {
//               $set: {
//                 firstName,
//                 imgUrl,
//                 password: password || existingUser.password, // Keep existing password if empty
//                 updatedAt: new Date(),
//               },
//             }
//           );

//           return res.send({
//             message: 'User updated successfully',
//             insertedId: existingUser._id,
//           });
//         }

//         // If user does not exist, create a new one
//         const newUser = {
//           firstName,
//           email,
//           password,
//           imgUrl,
//           createdAt: new Date(),
//         };

//         const result = await userCollection.insertOne(newUser);

//         res.send({
//           message: 'User created successfully',
//           insertedId: result.insertedId,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: 'Server error' });
//       }
//     });

//     // GET all transactions by user email
//     app.get('/transactions', async (req, res) => {
//       const email = req.query.email;
//       if (!email) return res.status(400).send({ message: 'Email is required' });

//       const transactions = await addCollection
//         .find({ email })
//         .sort({ createdAt: -1 })
//         .toArray();
//       res.send(transactions);
//     });

//     // GET transaction by ID
//     app.get('/transactions/:id', async (req, res) => {
//       try {
//         const transaction = await addCollection.findOne({
//           _id: new ObjectId(req.params.id),
//         });
//         if (!transaction)
//           return res.status(404).send({ message: 'Transaction not found' });
//         res.send(transaction);
//       } catch {
//         res.status(400).send({ message: 'Invalid ID' });
//       }
//     });

//     // POST create transaction
//     app.post('/transactions', async (req, res) => {
//       try {
//         const transaction = req.body;
//         if (!transaction.email || !transaction.amount || !transaction.type) {
//           return res.status(400).send({ message: 'Invalid data' });
//         }

//         transaction.amount = Number(transaction.amount);
//         transaction.date = transaction.date
//           ? new Date(transaction.date)
//           : new Date();
//         transaction.createdAt = new Date();

//         const result = await addCollection.insertOne(transaction);
//         res.send({
//           insertedId: result.insertedId,
//           acknowledged: result.acknowledged,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: 'Server error' });
//       }
//     });

//     // PUT update transaction
//     app.put('/transactions/:id', async (req, res) => {
//       const id = req.params.id;
//       const updatedData = { ...req.body };
//       delete updatedData._id; // remove if present

//       // Convert data types
//       if (updatedData.amount) updatedData.amount = Number(updatedData.amount);
//       if (updatedData.date) updatedData.date = new Date(updatedData.date);

//       try {
//         const result = await addCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: updatedData }
//         );

//         if (result.matchedCount === 0)
//           return res.status(404).send({ message: 'Transaction not found' });

//         res.send({ message: 'Transaction updated successfully' });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: 'Server error' });
//       }
//     });

//     // DELETE transaction
//     app.delete('/transactions/:id', async (req, res) => {
//       try {
//         const result = await addCollection.deleteOne({
//           _id: new ObjectId(req.params.id),
//         });
//         if (result.deletedCount === 0)
//           return res.status(404).send({ message: 'Transaction not found' });
//         res.send({ message: 'Transaction deleted successfully' });
//       } catch {
//         res.status(400).send({ message: 'Invalid ID' });
//       }
//     });

//     // GET total by category
//     app.get('/transactions/category-total', async (req, res) => {
//       const email = req.query.email;
//       if (!email) return res.status(400).send({ message: 'Email is required' });

//       const totals = await addCollection
//         .aggregate([
//           { $match: { email } },
//           { $group: { _id: '$category', total: { $sum: '$amount' } } },
//         ])
//         .toArray();

//       res.send(totals);
//     });
//   } catch (error) {
//     console.error('❌ MongoDB Error:', error);
//   }
// }

// run();

// app.get('/', (req, res) => {
//   res.send('Server is running fine..');
// });
// app.get('/as', (req, res) => {
//   res.send('Server is running fine....ssssssssssssssss');
// });

// app.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wcellxl.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Global collections
let addCollection;
let userCollection;

async function run() {
  try {
    // Connect to MongoDB
    // await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('Personal_Finance_Management_App');
    addCollection = db.collection('add'); // assign to global
    userCollection = db.collection('user');
    // UPDATE USER
    // UPDATE USER BY EMAIL
    app.put('/users/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, photo } = req.body;

        if (!name && !photo) {
          return res.status(400).send({ message: 'Nothing to update' });
        }

        const result = await userCollection.findOneAndUpdate(
          { _id: new ObjectId(id) }, // _id দিয়ে খুঁজছে
          {
            $set: {
              ...(name && { name }),
              ...(photo && { photo }),
              updatedAt: new Date(),
            },
          },
          { returnDocument: 'after' } // আপডেটের পরের ডকুমেন্ট রিটার্ন করবে
        );

        if (!result.value) {
          return res.status(404).send({ message: 'User not found' });
        }

        res.send({
          message: 'User updated successfully',
          user: result.value,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });
    // GET user by email
    app.get('/users/by-email', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const user = await userCollection.findOne({ email });
        if (!user) return res.status(404).send({ message: 'User not found' });

        const userData = {
          _id: user._id,
          firstName: user.firstName,
          email: user.email,
          imgUrl: user.imgUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt || null,
        };

        res.send(userData);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // POST create/update user
    app.post('/users', async (req, res) => {
      try {
        const { firstName, email, password, imgUrl } = req.body;
        if (!firstName || !email || !imgUrl) {
          return res.status(400).send({ message: 'All fields are required' });
        }

        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          // Update existing user
          await userCollection.updateOne(
            { email },
            {
              $set: {
                firstName,
                imgUrl,
                password: password || existingUser.password,
                updatedAt: new Date(),
              },
            }
          );

          return res.send({
            message: 'User updated successfully',
            insertedId: existingUser._id,
          });
        }

        // Create new user
        const newUser = {
          firstName,
          email,
          password,
          imgUrl,
          createdAt: new Date(),
        };

        const result = await userCollection.insertOne(newUser);
        res.send({
          message: 'User created successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // GET all transactions by user email
    app.get('/transactions', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: 'Email is required' });

      const transactions = await addCollection
        .find({ email })
        .sort({ createdAt: -1 })
        .toArray();
      res.send(transactions);
    });

    // GET transaction by ID
    app.get('/transactions/:id', async (req, res) => {
      try {
        const transaction = await addCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!transaction)
          return res.status(404).send({ message: 'Transaction not found' });
        res.send(transaction);
      } catch {
        res.status(400).send({ message: 'Invalid ID' });
      }
    });

    // POST create transaction
    app.post('/transactions', async (req, res) => {
      try {
        const transaction = req.body;
        if (!transaction.email || !transaction.amount || !transaction.type) {
          return res.status(400).send({ message: 'Invalid data' });
        }

        transaction.amount = Number(transaction.amount);
        transaction.date = transaction.date
          ? new Date(transaction.date)
          : new Date();
        transaction.createdAt = new Date();

        const result = await addCollection.insertOne(transaction);
        res.send({
          insertedId: result.insertedId,
          acknowledged: result.acknowledged,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // PUT update transaction
    app.put('/transactions/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = { ...req.body };
      delete updatedData._id;

      if (updatedData.amount) updatedData.amount = Number(updatedData.amount);
      if (updatedData.date) updatedData.date = new Date(updatedData.date);

      try {
        const result = await addCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        if (result.matchedCount === 0)
          return res.status(404).send({ message: 'Transaction not found' });

        res.send({ message: 'Transaction updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // DELETE transaction
    app.delete('/transactions/:id', async (req, res) => {
      try {
        const result = await addCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        if (result.deletedCount === 0)
          return res.status(404).send({ message: 'Transaction not found' });

        res.send({ message: 'Transaction deleted successfully' });
      } catch {
        res.status(400).send({ message: 'Invalid ID' });
      }
    });

    // GET total by category
    app.get('/transactions/category-total', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: 'Email is required' });

      const totals = await addCollection
        .aggregate([
          { $match: { email } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
        ])
        .toArray();

      res.send(totals);
    });
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
  }
}

run().catch(console.dir);

// Test routes
app.get('/', (req, res) => res.send('Server is running fine..'));
app.get('/as', (req, res) =>
  res.send('Server is running fine....ssssssssssssssss')
);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
