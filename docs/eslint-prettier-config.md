# ESLint & Prettier Configuration Guide

This project uses modern ESLint flat config and Prettier for code quality and formatting.

## ESLint Configuration

### Overview

- **Config File**: `eslint.config.mjs`
- **Format**: ESLint 9.x flat config
- **TypeScript Support**: Full support via `@typescript-eslint`
- **Framework Integration**: Next.js, React, React Hooks

### Key Features

- **Modern Flat Config**: Uses the new ESLint configuration format for better performance
- **TypeScript Integration**: Complete TypeScript support with type-aware linting
- **React & Next.js Rules**: Comprehensive React and Next.js specific rules
- **Global Variables**: Configured for both browser and Node.js environments
- **Smart Ignores**: Automatically ignores build outputs, dependencies, and generated files

### Rule Categories

#### TypeScript Rules

- Enforces consistent type imports
- Prevents unused variables (with underscore prefix exceptions)
- Warns on `any` types
- Ensures type-safe conditions

#### React Rules

- Enforces JSX key props
- Prevents dangerous patterns
- Ensures proper component structure
- React Hooks dependency validation

#### Next.js Rules

- Image optimization enforcement
- Script optimization
- SEO and performance rules
- App Router specific rules

#### Code Quality Rules

- Consistent object shorthand
- Template literal preference
- Proper error handling
- Console usage guidelines

### Scripts

- `pnpm lint` - Run ESLint with Next.js integration
- `pnpm lint:fix` - Fix auto-fixable issues
- `pnpm lint:strict` - Run with zero warnings tolerance

## Prettier Configuration

### Overview

- **Config File**: `.prettierrc.json`
- **Tailwind Integration**: Automatic class sorting via `prettier-plugin-tailwindcss`
- **Schema Validation**: JSON schema for config validation

### Key Settings

- **Print Width**: 80 characters
- **Tab Width**: 2 spaces
- **Semicolons**: Always
- **Quotes**: Double quotes
- **Trailing Commas**: All (ES5+)
- **End of Line**: LF (Unix-style)

### Tailwind Integration

- Automatic class name sorting
- Support for custom utility functions: `clsx`, `cn`, `tw`, `apply`, `twMerge`
- Reads from `tailwind.config.ts`

### Scripts

- `pnpm format` - Format all files
- `pnpm format:check` - Check formatting without fixing
- `pnpm code-quality` - Run type check, lint, and format check
- `pnpm code-quality:fix` - Run type check, lint fix, and format fix

## Integration with IDEs

### VS Code

The configuration works seamlessly with VS Code ESLint and Prettier extensions:

1. **ESLint Extension**: Automatically detects the flat config
2. **Prettier Extension**: Uses the project's `.prettierrc.json`
3. **Format on Save**: Recommended to enable for automatic formatting

### Recommended VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.experimental.useFlatConfig": true
}
```

## Ignore Patterns

### ESLint Ignores (in config)

- Build outputs (`.next/`, `dist/`, `build/`)
- Dependencies (`node_modules/`)
- Generated files (`src/components/ui/`, `src/app/generated/`)
- Data files (`data/`)
- Type definitions (`**/*.d.ts`)

### Prettier Ignores (`.prettierignore`)

- Package files (`package.json`, `pnpm-lock.yaml`)
- Build outputs
- Documentation that should maintain original formatting
- Configuration files
- Generated content

## Best Practices

### Code Organization

1. **Type Imports**: Use `import type` for type-only imports
2. **Unused Variables**: Prefix with underscore if intentionally unused
3. **Console Usage**: Only `console.warn` and `console.error` allowed in production code
4. **Error Handling**: Always handle caught errors properly

### Development Workflow

1. **Pre-commit**: Run `pnpm code-quality:fix` before committing
2. **CI/CD**: Use `pnpm code-quality` in build pipelines
3. **IDE Integration**: Enable format-on-save and lint-on-type

### Performance Optimizations

- **Flat Config**: Faster than legacy `.eslintrc` format
- **Caching**: Both ESLint and Prettier use caching for better performance
- **Targeted Rules**: Rules are scoped to appropriate file types
- **Smart Ignores**: Reduces unnecessary file processing

## Troubleshooting

### Common Issues

#### ESLint Not Working

1. Ensure ESLint extension uses flat config: `eslint.experimental.useFlatConfig: true`
2. Check Node.js version compatibility (requires Node.js 18+)
3. Verify `eslint.config.mjs` syntax

#### Prettier Conflicts

1. ESLint config already disables formatting rules via `eslint-config-prettier`
2. Ensure Prettier extension is set as default formatter
3. Check for conflicting editor settings

#### Performance Issues

1. Check ignore patterns in both configs
2. Ensure caching is enabled (it is by default)
3. Consider excluding large directories

### Debug Commands

```bash
# Check ESLint config
npx eslint --print-config src/app/page.tsx

# Check Prettier config
npx prettier --find-config-path src/app/page.tsx

# Clear caches
rm -rf .eslintcache node_modules/.cache
```

## Migration Notes

### From Legacy ESLint Config

The project has been migrated from `.eslintrc.json` to `eslint.config.mjs`:

- Better performance and reliability
- More flexible configuration options
- Improved TypeScript integration
- Future-proof (ESLint 10.x will only support flat config)

### Benefits of Current Setup

- **Faster linting**: Flat config is more performant
- **Better TypeScript support**: Full type-aware linting
- **Modern tooling**: Uses latest best practices
- **Comprehensive coverage**: Covers React, Next.js, and TypeScript patterns
- **Developer friendly**: Clear error messages and auto-fixes
