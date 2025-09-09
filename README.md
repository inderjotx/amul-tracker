## Docker Setup Instructions

### ✅ Completed Tasks

#### 1. Docker Files Created

- **Dockerfile.nextjs** - NextJS application container
  - Uses Node.js 22 Alpine base image
  - Multi-stage build for optimization
  - Sets placeholder environment variables during build to skip validation
  - Configured with standalone output for Docker deployment
  - Runs on port 3000

- **Dockerfile.cron** - Cron job container
  - Bundles only necessary files for the product service cron method
  - Includes dependencies: store service, redis service, queue service, and database
  - Runs the `cron` method from `./src/services/product.ts` every 5 minutes
  - Optimized to include only required TypeScript files and dependencies

- **Dockerfile.worker** - Worker container
  - Separate container for the worker package in `./worker` directory
  - Uses the worker's own package.json and dependencies
  - Runs the worker process for email notifications

#### 2. Docker Compose Configuration

- **docker-compose.yml** - Complete orchestration setup including:
  - **NextJS Application** - Main web application
  - **Cron Job** - Automated product tracking service
  - **Worker** - Email notification processing
  - **Redis** - Message queue and caching (with password protection)
  - **PostgreSQL** - Database storage
  - All services configured with proper dependencies and networking

#### 3. Environment Configuration

- **env.global.template** - Template file with all required environment variables:
  - Database configuration (PostgreSQL)
  - Redis configuration with password
  - Google OAuth settings
  - Better Auth secret
  - Email service API key (Resend)

### 🚀 How to Use

1. **Copy the environment template:**

   ```bash
   cp env.global.template .env.global
   ```

2. **Update the .env.global file with your actual values:**
   - Replace placeholder values with your real API keys and secrets
   - Update database credentials as needed

3. **Build and start all services:**

   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - NextJS App: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### 📋 Service Details

- **NextJS App**: Handles web interface and API endpoints
- **Cron Job**: Runs every 5 minutes to check for product availability changes
- **Worker**: Processes email notifications from the queue
- **Redis**: Handles message queuing and caching with password protection
- **PostgreSQL**: Stores user data, tracking requests, and product information

All environment variables are properly configured to reference the `.env.global` file as requested.
