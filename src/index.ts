import express from 'express';
import subjectsRouter from './routes/subjects';
import cors from 'cors';

const app = express();
const port = 8000;

app.use(cors({
    origin: process.env.FRONTEND_URL , // Allow requests from the frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies to be sent with requests
}));

app.use(express.json());
app.use('/api/subjects', subjectsRouter) 

app.get('/', (req, res) => {
  res.send('Hello, there!');
});

app.listen(port, () => {
  console
});
