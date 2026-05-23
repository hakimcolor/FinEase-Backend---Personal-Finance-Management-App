const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// JWT Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'Unauthorized access' });

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'fintrack-secret-key',
    (err, decoded) => {
      if (err) return res.status(403).send({ message: 'Invalid token' });
      req.user = decoded;
      next();
    }
  );
};

// Admin Middleware
const verifyAdmin = async (req, res, next) => {
  const email = req.user.email;
  const user = await req.db.collection('user').findOne({ email });
  if (user?.role !== 'admin') {
    return res
      .status(403)
      .send({ message: 'Forbidden: Admin access required' });
  }
  next();
};

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_Password}@cluster0.wcellxl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Async function to connect to MongoDB
async function run() {
  try {
    console.log('✅ Connected to MongoDB');

    const db = client.db('Personal_Finance_Management_App');
    const addCollection = db.collection('add');
    const userCollection = db.collection('user');
    const categoryCollection = db.collection('categories');
    const savingsGoalCollection = db.collection('savingsGoals');
    const budgetCollection = db.collection('budgets');
    const billReminderCollection = db.collection('billReminders');
    const tipsCollection = db.collection('financialTips');

    // Middleware to attach db to request
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // ============ AUTH ROUTES ============

    // Register user
    app.post('/auth/register', async (req, res) => {
      try {
        const { firstName, email, password, imgUrl } = req.body;

        if (!firstName || !email || !password) {
          return res.status(400).send({ message: 'All fields are required' });
        }

        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).send({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
          firstName,
          email,
          password: hashedPassword,
          imgUrl: imgUrl || '',
          role: 'user', // default role
          createdAt: new Date(),
        };

        const result = await userCollection.insertOne(newUser);

        const token = jwt.sign(
          { email, role: 'user' },
          process.env.JWT_SECRET || 'fintrack-secret-key',
          { expiresIn: '7d' }
        );

        res.send({
          message: 'User registered successfully',
          token,
          user: { email, firstName, role: 'user', imgUrl: imgUrl || '' },
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Login user
    app.post('/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res
            .status(400)
            .send({ message: 'Email and password required' });
        }

        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).send({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { email: user.email, role: user.role || 'user' },
          process.env.JWT_SECRET || 'fintrack-secret-key',
          { expiresIn: '7d' }
        );

        res.send({
          message: 'Login successful',
          token,
          user: {
            email: user.email,
            firstName: user.firstName,
            role: user.role || 'user',
            imgUrl: user.imgUrl,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // GET overview (total income, expense, balance)
    app.get('/transactions/overview', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const result = await addCollection
          .aggregate([
            { $match: { email } },
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
              },
            },
          ])
          .toArray();

        let totalIncome = 0;
        let totalExpense = 0;

        result.forEach((item) => {
          if (item._id === 'income') totalIncome = item.total;
          if (item._id === 'expense') totalExpense = item.total;
        });

        const balance = totalIncome - totalExpense;

        res.send({ totalIncome, totalExpense, balance });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // GET all transactions by user emailk
    app.get('/transactions', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const transactions = await addCollection
          .find({ email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(transactions);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });
    // GET total by category
    app.get('/transactions/category-total', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const totals = await addCollection
          .aggregate([
            { $match: { email } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
          ])
          .toArray();

        res.send(totals);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
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
      } catch (error) {
        console.error(error);
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
      try {
        const id = req.params.id;
        const updatedData = { ...req.body };
        delete updatedData._id;

        if (updatedData.amount) updatedData.amount = Number(updatedData.amount);
        if (updatedData.date) updatedData.date = new Date(updatedData.date);

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
      } catch (error) {
        console.error(error);
        res.status(400).send({ message: 'Invalid ID' });
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

        res.send({
          _id: user._id,
          firstName: user.firstName,
          email: user.email,
          imgUrl: user.imgUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt || null,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // POST create/update user
    app.post('/users', async (req, res) => {
      try {
        const { firstName, email, password, imgUrl } = req.body;
        if (!firstName || !email || !imgUrl)
          return res.status(400).send({ message: 'All fields are required' });

        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          // Update existing user
          const updateData = {
            firstName,
            imgUrl,
            updatedAt: new Date(),
          };

          if (password) {
            updateData.password = await bcrypt.hash(password, 10);
          }

          await userCollection.updateOne({ email }, { $set: updateData });
          return res.send({
            message: 'User updated successfully',
            insertedId: existingUser._id,
          });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : '';

        const newUser = {
          firstName,
          email,
          password: hashedPassword,
          imgUrl,
          role: 'user',
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

    // ============ ADMIN ROUTES ============

    // Get all users (works with Firebase auth - no JWT needed)
    app.get('/users/all', async (req, res) => {
      try {
        const users = await userCollection
          .find({})
          .project({ password: 0 })
          .toArray();
        res.send(users);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Update user role (works with Firebase auth - no JWT needed)
    app.patch('/users/:id/role', async (req, res) => {
      try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
          return res.status(400).send({ message: 'Invalid role' });
        }

        const result = await userCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { role, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'User not found' });
        }

        res.send({ message: 'User role updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Legacy JWT routes (kept for compatibility)
    app.get('/admin/users', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const users = await userCollection
          .find({})
          .project({ password: 0 })
          .toArray();
        res.send(users);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    app.patch(
      '/admin/users/:id/role',
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const { role } = req.body;
          if (!['user', 'admin'].includes(role)) {
            return res.status(400).send({ message: 'Invalid role' });
          }

          const result = await userCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { role, updatedAt: new Date() } }
          );

          if (result.matchedCount === 0) {
            return res.status(404).send({ message: 'User not found' });
          }

          res.send({ message: 'User role updated successfully' });
        } catch (error) {
          console.error(error);
          res.status(500).send({ message: 'Server error' });
        }
      }
    );

    // ============ CATEGORY MANAGEMENT (Admin) ============

    // Get all categories
    app.get('/categories', async (req, res) => {
      try {
        const categories = await categoryCollection.find({}).toArray();
        res.send(categories);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Create category (works with Firebase auth)
    app.post('/categories', async (req, res) => {
      try {
        const { name, type, icon } = req.body;

        if (!name || !type) {
          return res
            .status(400)
            .send({ message: 'Name and type are required' });
        }

        const existingCategory = await categoryCollection.findOne({
          name: name.toLowerCase(),
        });

        if (existingCategory) {
          return res.status(400).send({ message: 'Category already exists' });
        }

        const category = {
          name: name.toLowerCase(),
          type, // 'income' or 'expense' or 'both'
          icon: icon || 'FiTag',
          createdAt: new Date(),
        };

        const result = await categoryCollection.insertOne(category);
        res.send({
          message: 'Category created successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Update category (works with Firebase auth)
    app.put('/categories/:id', async (req, res) => {
      try {
        const { name, type, icon } = req.body;
        const updateData = {};

        if (name) updateData.name = name.toLowerCase();
        if (type) updateData.type = type;
        if (icon) updateData.icon = icon;
        updateData.updatedAt = new Date();

        const result = await categoryCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Category not found' });
        }

        res.send({ message: 'Category updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Delete category (works with Firebase auth)
    app.delete('/categories/:id', async (req, res) => {
      try {
        const result = await categoryCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Category not found' });
        }

        res.send({ message: 'Category deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // ============ SAVINGS GOALS ============

    // Get user's savings goals
    app.get('/savings-goals', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const goals = await savingsGoalCollection
          .find({ email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(goals);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Create savings goal
    app.post('/savings-goals', async (req, res) => {
      try {
        const { email, title, targetAmount, currentAmount, deadline } =
          req.body;

        if (!email || !title || !targetAmount) {
          return res.status(400).send({ message: 'Required fields missing' });
        }

        const goal = {
          email,
          title,
          targetAmount: Number(targetAmount),
          currentAmount: Number(currentAmount) || 0,
          deadline: deadline ? new Date(deadline) : null,
          createdAt: new Date(),
        };

        const result = await savingsGoalCollection.insertOne(goal);
        res.send({
          message: 'Savings goal created successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Update savings goal
    app.put('/savings-goals/:id', async (req, res) => {
      try {
        const { title, targetAmount, currentAmount, deadline } = req.body;
        const updateData = { updatedAt: new Date() };

        if (title) updateData.title = title;
        if (targetAmount) updateData.targetAmount = Number(targetAmount);
        if (currentAmount !== undefined)
          updateData.currentAmount = Number(currentAmount);
        if (deadline) updateData.deadline = new Date(deadline);

        const result = await savingsGoalCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Goal not found' });
        }

        res.send({ message: 'Goal updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Delete savings goal
    app.delete('/savings-goals/:id', async (req, res) => {
      try {
        const result = await savingsGoalCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Goal not found' });
        }

        res.send({ message: 'Goal deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // ============ BUDGETS (Optional Feature) ============

    // Get user's budgets
    app.get('/budgets', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const budgets = await budgetCollection.find({ email }).toArray();
        res.send(budgets);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Create budget
    app.post('/budgets', async (req, res) => {
      try {
        const { email, category, amount, month, year } = req.body;

        if (!email || !category || !amount) {
          return res.status(400).send({ message: 'Required fields missing' });
        }

        const budget = {
          email,
          category,
          amount: Number(amount),
          month: month || new Date().getMonth() + 1,
          year: year || new Date().getFullYear(),
          createdAt: new Date(),
        };

        const result = await budgetCollection.insertOne(budget);
        res.send({
          message: 'Budget created successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Update budget
    app.put('/budgets/:id', async (req, res) => {
      try {
        const { category, amount, month, year } = req.body;
        const updateData = { updatedAt: new Date() };

        if (category) updateData.category = category;
        if (amount) updateData.amount = Number(amount);
        if (month) updateData.month = month;
        if (year) updateData.year = year;

        const result = await budgetCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Budget not found' });
        }

        res.send({ message: 'Budget updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Delete budget
    app.delete('/budgets/:id', async (req, res) => {
      try {
        const result = await budgetCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Budget not found' });
        }

        res.send({ message: 'Budget deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // ============ BILL REMINDERS (Optional Feature) ============

    // Get user's bill reminders
    app.get('/bill-reminders', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const reminders = await billReminderCollection
          .find({ email })
          .sort({ dueDate: 1 })
          .toArray();

        res.send(reminders);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Create bill reminder
    app.post('/bill-reminders', async (req, res) => {
      try {
        const { email, title, amount, dueDate, recurring, isPaid } = req.body;

        if (!email || !title || !amount || !dueDate) {
          return res.status(400).send({ message: 'Required fields missing' });
        }

        const reminder = {
          email,
          title,
          amount: Number(amount),
          dueDate: new Date(dueDate),
          recurring: recurring || false,
          isPaid: isPaid || false,
          createdAt: new Date(),
        };

        const result = await billReminderCollection.insertOne(reminder);
        res.send({
          message: 'Bill reminder created successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Update bill reminder
    app.put('/bill-reminders/:id', async (req, res) => {
      try {
        const { title, amount, dueDate, recurring, isPaid } = req.body;
        const updateData = { updatedAt: new Date() };

        if (title) updateData.title = title;
        if (amount) updateData.amount = Number(amount);
        if (dueDate) updateData.dueDate = new Date(dueDate);
        if (recurring !== undefined) updateData.recurring = recurring;
        if (isPaid !== undefined) updateData.isPaid = isPaid;

        const result = await billReminderCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Reminder not found' });
        }

        res.send({ message: 'Reminder updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Delete bill reminder
    app.delete('/bill-reminders/:id', async (req, res) => {
      try {
        const result = await billReminderCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Reminder not found' });
        }

        res.send({ message: 'Reminder deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // ============ FINANCIAL INSIGHTS ============

    // Get personalized financial insights
    app.get('/insights', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email)
          return res.status(400).send({ message: 'Email is required' });

        const transactions = await addCollection.find({ email }).toArray();

        if (transactions.length === 0) {
          return res.send({
            insights: [
              'Start tracking your expenses to get personalized insights',
              'Set a savings goal to build better financial habits',
              'Categorize your transactions for better analysis',
            ],
            hasData: false,
          });
        }

        const insights = [];

        // Calculate totals
        const income = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        // Insight 1: Savings rate
        if (income > 0) {
          const savingsRate = ((income - expense) / income) * 100;
          if (savingsRate > 20) {
            insights.push(
              `Great job! You're saving ${savingsRate.toFixed(1)}% of your income.`
            );
          } else if (savingsRate > 0) {
            insights.push(
              `You're saving ${savingsRate.toFixed(1)}% of your income. Try to reach 20% for better financial health.`
            );
          } else {
            insights.push(
              `Your expenses exceed your income. Consider reducing spending or increasing income.`
            );
          }
        }

        // Insight 2: Top spending category
        const expensesByCategory = {};
        transactions
          .filter((t) => t.type === 'expense')
          .forEach((t) => {
            expensesByCategory[t.category] =
              (expensesByCategory[t.category] || 0) + t.amount;
          });

        const topCategory = Object.entries(expensesByCategory).sort(
          (a, b) => b[1] - a[1]
        )[0];
        if (topCategory) {
          const percentage = ((topCategory[1] / expense) * 100).toFixed(1);
          insights.push(
            `Your highest spending is on ${topCategory[0]} (${percentage}% of total expenses).`
          );
        }

        // Insight 3: Monthly average
        const monthlyExpense =
          expense /
          Math.max(
            1,
            new Set(transactions.map((t) => new Date(t.date).getMonth())).size
          );
        insights.push(
          `Your average monthly expense is $${monthlyExpense.toFixed(2)}.`
        );

        // Insight 4: Recent trend
        const recentTransactions = transactions.slice(-10);
        const recentExpense = recentTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const avgRecentExpense =
          recentExpense /
          Math.max(
            1,
            recentTransactions.filter((t) => t.type === 'expense').length
          );

        if (avgRecentExpense > monthlyExpense / 30) {
          insights.push(
            `Your recent spending is higher than usual. Consider reviewing your expenses.`
          );
        } else {
          insights.push(`Your recent spending is under control. Keep it up!`);
        }

        res.send({
          insights,
          hasData: true,
          stats: {
            totalIncome: income,
            totalExpense: expense,
            balance,
            savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
            topCategory: topCategory ? topCategory[0] : null,
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // ============ ADMIN REPORTS ============

    // Get platform-wide financial reports
    app.get('/admin/reports', async (req, res) => {
      try {
        const totalUsers = await userCollection.countDocuments();
        const totalTransactions = await addCollection.countDocuments();

        const allTransactions = await addCollection.find({}).toArray();

        const totalIncome = allTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = allTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalCategories = await categoryCollection.countDocuments();
        const totalGoals = await savingsGoalCollection.countDocuments();

        const reports = [
          {
            title: 'Total Users',
            value: totalUsers,
            description: 'Registered platform users',
          },
          {
            title: 'Total Transactions',
            value: totalTransactions,
            description: 'All recorded transactions',
          },
          {
            title: 'Total Income',
            value: `${totalIncome.toFixed(0)}`,
            description: 'Platform-wide income',
          },
          {
            title: 'Total Expenses',
            value: `${totalExpense.toFixed(0)}`,
            description: 'Platform-wide expenses',
          },
          {
            title: 'Categories',
            value: totalCategories,
            description: 'Available transaction categories',
          },
          {
            title: 'Savings Goals',
            value: totalGoals,
            description: 'Active savings goals',
          },
        ];

        res.send(reports);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // ============ FINANCIAL TIPS MANAGEMENT ============

    // Get all financial tips
    app.get('/tips', async (req, res) => {
      try {
        const featured = req.query.featured;
        const query = featured === 'true' ? { featured: true } : {};

        const tips = await tipsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(tips);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Create financial tip
    app.post('/tips', async (req, res) => {
      try {
        const { title, description, category, featured } = req.body;

        if (!title || !description) {
          return res
            .status(400)
            .send({ message: 'Title and description are required' });
        }

        const tip = {
          title,
          description,
          category: category || 'general',
          featured: featured !== undefined ? featured : true,
          createdAt: new Date(),
        };

        const result = await tipsCollection.insertOne(tip);
        res.send({
          message: 'Tip created successfully',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Update financial tip
    app.put('/tips/:id', async (req, res) => {
      try {
        const { title, description, category, featured } = req.body;
        const updateData = { updatedAt: new Date() };

        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (featured !== undefined) updateData.featured = featured;

        const result = await tipsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Tip not found' });
        }

        res.send({ message: 'Tip updated successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Delete financial tip
    app.delete('/tips/:id', async (req, res) => {
      try {
        const result = await tipsCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Tip not found' });
        }

        res.send({ message: 'Tip deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
  }
}

// Run MongoDB connection and routes
run().catch(console.dir);

// Test routes
app.get('/', (req, res) => res.send('Server is running fine..'));

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
