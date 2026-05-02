#!/bin/bash

# Chad Solutions - Proactive Quality Assurance Script
# This script ensures the project builds and lints before submission.

echo "🚀 Starting God-Tier Quality Audit..."

# 1. Syntax & Lint Check
echo "🔍 Running Linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix errors before submitting."
    exit 1
fi

# 2. Type Check (if using TS)
if [ -f "tsconfig.json" ]; then
    echo "⌨️  Running Type Check..."
    npx tsc --noEmit
    if [ $? -ne 0 ]; then
        echo "❌ Type check failed."
        exit 1
    fi
fi

# 3. Build Check
echo "🏗️  Running Production Build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Syntax or structural error detected."
    exit 1
fi

echo "✅ Quality Audit Passed. Code is stable."
exit 0
