// const express = require('express');
// const cors = require('cors');
// const { MongoClient, ServerApiVersion } = require('mongodb');
// require('dotenv').config();

// const app = express();
// const port = 3000;
// const { ObjectId } = require('mongodb');
// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Server is running fine....');
// });

// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wcellxl.mongodb.net/?appName=Cluster0`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     // ✅ CONNECT MONGODB
//     await client.connect();
//     console.log('✅ Connected to MongoDB');

//     const db = client.db('Personal_Finance_Management_App');
//     const addCollection = db.collection('add');
//     //get loging user transactions delete
// const { ObjectId } = require('mongodb');

//   app.get('/transactions', async (req, res) => {
//     const email = req.query.email;
//     if (!email) return res.status(400).send({ message: 'Email is required' });

//     const transactions = await addCollection
//       .find({ email })
//       .sort({ createdAt: -1 })
//       .toArray();
//     res.send(transactions);
//   });

//   app.get('/transactions/:id', async (req, res) => {
//     const transaction = await addCollection.findOne({
//       _id: new ObjectId(req.params.id),
//     });
//     if (!transaction)
//       return res.status(404).send({ message: 'Transaction not found' });
//     res.send(transaction);
//   });
// app.put('/transactions/:id', async (req, res) => {
//   const id = req.params.id;
//   const updatedData = req.body;

//   let objectId;
//   try {
//     objectId = new ObjectId(id);
//   } catch {
//     return res.status(400).send({ message: 'Invalid ID' });
//   }

//   if (!updatedData.amount || isNaN(updatedData.amount)) {
//     return res.status(400).send({ message: 'Invalid amount' });
//   }
//   updatedData.amount = Number(updatedData.amount);

//   if (updatedData.date) {
//     const d = new Date(updatedData.date);
//     if (isNaN(d.getTime()))
//       return res.status(400).send({ message: 'Invalid date' });
//     updatedData.date = d;
//   }

//   try {
//     const result = await addCollection.updateOne(
//       { _id: objectId },
//       { $set: updatedData }
//     );
//     if (result.matchedCount === 0)
//       return res.status(404).send({ message: 'Transaction not found' });
//     res.send({ message: 'Transaction updated successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: 'Server error' });
//   }
// });

//   app.delete('/transactions/:id', async (req, res) => {
//     const result = await addCollection.deleteOne({
//       _id: new ObjectId(req.params.id),
//     });
//     if (result.deletedCount === 0)
//       return res.status(404).send({ message: 'Transaction not found' });
//     res.send({ message: 'Transaction deleted successfully' });
//   });

//   app.get('/transactions/category-total', async (req, res) => {
//     const email = req.query.email;
//     if (!email) return res.status(400).send({ message: 'Email is required' });

//     const totals = await addCollection
//       .aggregate([
//         { $match: { email } },
//         { $group: { _id: '$category', total: { $sum: '$amount' } } },
//       ])
//       .toArray();

//     res.send(totals);
//   });

//     // ✅ Add Transaction API
//    app.post('/transactions', async (req, res) => {
//      try {
//        const transaction = req.body;

//        if (!transaction.email || !transaction.amount) {
//          return res.status(400).send({ message: 'Invalid data' });
//        }

//        transaction.amount = Number(transaction.amount);
//        transaction.date = new Date(transaction.date);
//        transaction.createdAt = new Date();

//        const result = await addCollection.insertOne(transaction);

//        res.send({
//          insertedId: result.insertedId,
//          acknowledged: result.acknowledged,
//        });
//      } catch (error) {
//        console.error(error);
//        res.status(500).send({ message: 'Server error' });
//      }
//    });

//   } catch (error) {
//     console.error('❌ MongoDB Error:', error);
//   }
// }

// run();

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

let addCollection;

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('Personal_Finance_Management_App');
    addCollection = db.collection('add'); // Using your collection 'add'

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
    delete updatedData._id; // remove if present

    // Convert data types
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

run();

app.get('/', (req, res) => {
  res.send('Server is running fine....');
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
