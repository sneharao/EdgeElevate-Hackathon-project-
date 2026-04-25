#!/bin/bash

# EdgeElevate Notebook Setup Script
# This script sets up the Python environment for running EdgeElevate notebooks

set -e

echo "🚀 EdgeElevate Notebook Setup"
echo "=============================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r notebooks/requirements.txt > /dev/null 2>&1

echo "✅ Dependencies installed successfully"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚙️  Please edit .env file and add your API keys:"
    echo "   - OPENROUTER_API_KEY (Required)"
    echo "   - TAVILY_API_KEY (Required)"
    echo "   - PEEC_API_KEY (Optional)"
    echo "   - QCONTEXT_API_KEY (Optional)"
    echo "   - HERA_API_KEY (Optional)"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create outputs directory if it doesn't exist
if [ ! -d "outputs" ]; then
    echo "📁 Creating outputs directory..."
    mkdir -p outputs
    echo "✅ Outputs directory created"
else
    echo "✅ Outputs directory already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run: source venv/bin/activate"
echo "3. Run: jupyter notebook"
echo "4. Open notebooks/api_integration_tests.ipynb to test API connections"
echo "5. Then open notebooks/edge_elevate_complete_workflow.ipynb to run the full workflow"
echo ""
echo "Happy analyzing! 🚀"
