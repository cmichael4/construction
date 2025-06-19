# Construction Expense Tracker

A modern web application for construction companies to track project expenses and payments. Built with React, TypeScript, and Node.js.

## Features

- 📊 **Dashboard Overview**: Real-time financial metrics and project status
- 🏗️ **Project Management**: Create and manage construction projects
- 💰 **Expense Tracking**: Log and categorize project expenses
- 💳 **Payment Management**: Track incoming and outgoing payments
- 📈 **Financial Analytics**: Visual charts and reports
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Recharts for data visualization
- Lucide React for icons
- Axios for API communication

### Backend
- Node.js with Express
- TypeScript
- In-memory data storage (easily replaceable with database)

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the development servers:**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Manual Installation

If you prefer to install dependencies separately:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

## Project Structure

```
construction/
├── server/                 # Backend API
│   ├── src/
│   │   ├── index.ts       # Express server setup
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── data.ts        # In-memory data storage
│   ├── package.json
│   └── tsconfig.json
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api.ts         # API service functions
│   │   ├── types.ts       # TypeScript interfaces
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── package.json           # Root package.json
└── README.md
```

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `GET /api/projects/:id/summary` - Get project summary with financial data

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/projects/:id/expenses` - Get expenses for a project
- `POST /api/projects/:id/expenses` - Add expense to project

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/projects/:id/payments` - Get payments for a project
- `POST /api/projects/:id/payments` - Add payment to project

### Dashboard
- `GET /api/dashboard` - Get dashboard summary data

## Sample Data

The application comes with sample data including:
- 3 construction projects (office complex, residential subdivision, shopping center renovation)
- Sample expenses (materials, labor, equipment, permits)
- Sample payments (client payments, vendor payments)

## Development

### Backend Development
```bash
cd server
npm run dev  # Start with nodemon
```

### Frontend Development
```bash
cd client
npm start    # Start React development server
```

### Building for Production
```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build
```

## Customization

### Adding a Database
The current implementation uses in-memory storage. To add a database:

1. Replace the data storage in `server/src/data.ts`
2. Add database connection and models
3. Update API endpoints to use database queries

### Styling
The application uses utility-first CSS classes. You can customize the styling by:
- Modifying the CSS classes in components
- Adding custom CSS files
- Implementing a CSS framework like Tailwind CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for your construction business!

## Support

For questions or issues, please open an issue on GitHub. 