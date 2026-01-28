# my-api

Express.js API built with Aspire for Scripters

## Features

- ✅ TypeScript
- ✅ Express.js
- ✅ JWT Authentication
- ✅ API Documentation (Swagger)
- ✅ Database Support

- ✅ Docker Support


## Getting Started

### Prerequisites

- Node.js >= 18
- Docker and Docker Compose

### Installation

```bash
 install
```

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Running with Docker

```bash
docker-compose up -d
 run dev
```

### Running locally

```bash
 run dev
```

The API will be available at `http://localhost:3000`
API documentation will be available at `http://localhost:3000/api-docs`

## Scripts

- ` run dev` - Start development server
- ` run build` - Build for production
- ` start` - Start production server
- ` run lint` - Lint code
- ` run format` - Format code

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── types/           # TypeScript types
```

## License

MIT

Generated with [Aspire for Scripters](https://github.com/ouda711/aspire-for-scripters)