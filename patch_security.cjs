const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add imports
const imports = `import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";`;

code = code.replace(/import cors from "cors";/, imports);

// Configure CORS and Helmet
const middlewares = `// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabling CSP for development/vite compatibility, can be configured later
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://directrent.space', 'https://www.directrent.space']
    : '*',
  credentials: true
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per \`window\` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 auth requests per hour
  message: 'Too many authentication attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));`;

code = code.replace(/app\.use\(cors\(\)\);\napp\.use\(express\.json\(\{ limit: '10mb' \}\)\);/, middlewares);

fs.writeFileSync('server.ts', code);
