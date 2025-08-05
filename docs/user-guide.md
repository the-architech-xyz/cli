# The Architech CLI User Guide

## 🚀 Getting Started

### Installation

The Architech CLI can be installed globally or run directly with npx:

```bash
# Global installation (recommended)
npm install -g the-architech

# Or run directly
npx the-architech new my-app
```

### Prerequisites

- Node.js 16.0.0 or higher
- Any package manager (npm, yarn, pnpm, bun)
- Git (optional, for version control)

## 🎯 Basic Usage

### Interactive Mode (Recommended)

The easiest way to get started is using interactive mode:

```bash
architech new my-app
```

This will guide you through an intelligent, context-aware process:

1. **Project Description** - Describe what you want to build
2. **Smart Recommendations** - Review AI-powered technology suggestions
3. **Customization** - Fine-tune based on your needs
4. **Generation** - Create your project with all dependencies

### Quick Start with Defaults

For rapid prototyping with the recommended stack, use the `--yes` flag:

```bash
architech new my-app --yes
```

This creates a Next.js 14 project with:
- **Next.js 14** (App Router)
- **Drizzle ORM** + **Local SQLite**
- **Better Auth**
- **Shadcn UI**
- **TypeScript** + **ESLint**
- **Railway** deployment config
- **Vitest** testing setup

### Custom Configuration

Specify options directly for more control:

```bash
architech new my-app \
  --project-type ecommerce \
  --package-manager yarn \
  --no-git \
  --no-install
```

## 🧠 Smart Question System

### 🎯 Intelligent 3-Step Flow

The Architech uses a modern, intelligent question system that adapts to your project type and expertise level.

#### **Step 1: Project Context Analysis**
The system analyzes your input to understand:
- Project type (e-commerce, blog, dashboard, etc.)
- Required features and requirements
- Complexity level and user expertise

#### **Step 2: Smart Recommendations**
Based on your input, the system presents intelligent technology recommendations:

```
🎯 I'll create a project with these features:

📊 Database: drizzle (90%)
   TypeScript-first ORM with excellent performance and type safety
🔐 Authentication: better-auth (90%)
   Modern, secure authentication with excellent Next.js integration
🎨 UI Library: chakra-ui (80%)
   Comprehensive component library with excellent accessibility
🚀 Deployment: railway (80%)
   Full-stack deployment platform with excellent developer experience
🧪 Testing: vitest (80%)
   Fast testing framework for modern projects

📊 Project: A full-stack web application
⏱️  Estimated time: 4 minutes
🎯 Confidence: 95%
```

#### **Step 3: Minimal Customization**
Only ask what's needed based on context:

```
⚙️  Smart defaults will be applied:
   drizzle: provider, orm, features, connectionString, migrations, seeding
   better-auth: providers, session, emailVerification
   railway: environment, builder, watchPatterns
   vitest: testTypes, coverage, coverageThreshold

What would you like to do?
✅ Looks perfect, let's build it!
```

## 🏗️ Agent-Driven Intelligence

### **Specialized Agents**

The Architech uses AI-powered agents that understand your project context:

#### **🎯 SmartRecommender**
- Analyzes your project description
- Determines project type and complexity
- Generates intelligent technology recommendations
- Calculates confidence scores for each recommendation

#### **❓ UnifiedQuestioner**
- Presents recommendations in a user-friendly format
- Handles user acceptance or rejection
- Manages customization questions
- Integrates with DynamicQuestioner for plugin-specific questions

#### **🔧 DynamicQuestioner**
- Reads plugin ParameterSchema automatically
- Generates configuration questions dynamically
- Validates user input against plugin requirements
- Ensures all plugins receive correct configuration

#### **⚙️ OrchestratorAgent**
- Coordinates the entire generation process
- Manages plugin execution order
- Handles dependencies and conflicts
- Creates project structure and artifacts

### **Plugin Discovery & Intelligence**

Agents dynamically discover and understand available plugins:

```typescript
// Agents can query available plugins
const availablePlugins = await uiAgent.getAvailablePlugins();
const dbPlugins = await dbAgent.getAvailablePlugins();

// Get plugin capabilities
const capabilities = await agent.getPluginCapabilities('drizzle');

// Get domain-specific recommendations
const recommendations = await agent.getRecommendations(projectContext);
```

## 📦 Supported Project Types

### **Blog Platform**
- Content management with SEO optimization
- Comments and user engagement
- Newsletter signup integration
- Social media sharing

### **E-commerce Store**
- Product catalog and inventory management
- Shopping cart and checkout process
- Payment processing integration
- Order tracking and management

### **SaaS Application**
- User authentication and authorization
- Subscription management
- Billing and payment processing
- Admin dashboard and analytics

### **Dashboard**
- Data visualization and charts
- User management and roles
- Real-time updates
- Export and reporting features

### **API Backend**
- RESTful API endpoints
- Database integration
- Authentication and authorization
- API documentation

### **Portfolio Website**
- Responsive design
- Contact forms
- Project showcase
- Blog integration

## 🛠️ Available Commands

### **Create New Project**
```bash
# Interactive mode
architech new my-app

# Quick start with defaults
architech new my-app --yes

# Specify project type
architech new my-app --project-type ecommerce

# Custom options
architech new my-app \
  --project-type blog \
  --package-manager yarn \
  --no-git \
  --no-install
```

### **Project Options**

| Option | Description | Default |
|--------|-------------|---------|
| `--project-type` | Project type (blog, ecommerce, saas, dashboard, api, portfolio) | `custom` |
| `--package-manager` | Package manager (npm, yarn, pnpm, bun) | `npm` |
| `--yes` | Accept all defaults without questions | `false` |
| `--no-git` | Skip Git initialization | `false` |
| `--no-install` | Skip dependency installation | `false` |

## 🎨 Smart Defaults

The Architech uses intelligent defaults to minimize configuration:

### **Blog Projects**
- Comments system
- Newsletter signup
- SEO optimization
- Social sharing

### **E-commerce**
- Inventory management
- Shopping cart
- Payment processing
- Order tracking

### **SaaS**
- User authentication
- Subscription management
- Admin dashboard
- Analytics integration

### **Dashboards**
- Data visualization
- User management
- Real-time updates
- Export functionality

## 🔧 Generated Project Structure

### **Next.js App Router Structure**
```
my-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/             # UI components
│   ├── ui/                # Shadcn UI components
│   └── layout/            # Layout components
├── lib/                    # Utility libraries
│   ├── db/                # Database setup
│   ├── auth/              # Authentication
│   └── utils/             # Utility functions
├── public/                 # Static assets
├── types/                  # TypeScript types
├── drizzle.config.ts       # Database configuration
├── railway.json           # Deployment configuration
├── vitest.config.ts       # Testing configuration
├── tailwind.config.ts     # Tailwind CSS config
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies & scripts
└── README.md              # Project documentation
```

### **Monorepo Structure**
```
my-monorepo/
├── apps/
│   ├── web/               # Main web application
│   └── admin/             # Admin dashboard
├── packages/
│   ├── ui/                # Shared UI components
│   ├── database/          # Shared database
│   └── config/            # Shared configuration
├── turbo.json             # Turborepo configuration
└── package.json           # Root dependencies
```

## 🚀 Deployment

### **Railway Deployment**
Projects include Railway configuration for easy deployment:

```bash
# Deploy to Railway
railway up

# Deploy to production
railway up --environment production
```

### **Other Platforms**
- **Vercel**: Zero-config deployment
- **Netlify**: Static site deployment
- **Docker**: Containerized deployment
- **AWS**: Cloud deployment

## 🧪 Testing

### **Vitest Setup**
Projects include comprehensive testing setup:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Testing Structure**
```
tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── e2e/                  # End-to-end tests
└── __mocks__/            # Test mocks
```

## 🔍 Troubleshooting

### **Common Issues**

#### **Installation Problems**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall globally
npm uninstall -g the-architech
npm install -g the-architech
```

#### **Permission Issues**
```bash
# Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

#### **Path Issues**
```bash
# Check if architech is in PATH
which architech

# Add to PATH if needed
export PATH="$PATH:$(npm bin -g)"
```

### **Getting Help**

- 📧 **Email**: support@the-architech.dev
- 💬 **Discord**: [Join our community](https://discord.gg/the-architech)
- 🐛 **Issues**: [GitHub Issues](https://github.com/the-architech/cli/issues)
- 📖 **Documentation**: [docs.the-architech.dev](https://docs.the-architech.dev)

## 🎯 Best Practices

### **Project Naming**
- Use kebab-case for project names: `my-awesome-app`
- Avoid special characters and spaces
- Keep names descriptive but concise

### **Project Types**
- Choose the closest project type to your needs
- Custom projects offer maximum flexibility
- Blog and e-commerce have specialized features

### **Development Workflow**
1. Generate project with The Architech
2. Review and customize generated code
3. Add your business logic
4. Deploy and iterate

### **Plugin Integration**
- All plugins provide unified interfaces
- Generated code is technology-agnostic
- Easy to switch between technologies
- Consistent APIs across all plugins

---

**Ready to build something amazing? Start with `architech new my-app`! 🚀** 