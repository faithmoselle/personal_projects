# DevPalette - Color Palette Generator

## Overview
A full-stack web application for generating color palettes with accessibility features.

## Features
- Color palette generation from base color
- Multiple color schemes (Analogous, Complementary, etc.)
- Real-time preview
- RESTful API backend

## Tech Stack
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Tools**: Git, VSCode

## How to Run
# Terminal 1: Backend
cd ~/devpalette/backend
source venv/Scripts/activate
uvicorn app:app --reload --port 8000

# Terminal 2: Open frontend
# Just open frontend/index.html in browser