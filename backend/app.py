from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import colorsys

app = FastAPI(
    title="DevPalette API",
    description="Color Palette Generator API",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
)
# Models
class ContrastRequest(BaseModel):
    color1: str
    color2: str

class ExportRequest(BaseModel):
    colors: List[str]
    format: str

# Helper functions
def hex_to_rgb(hex_color: str):
    """Convert hex to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    """Convert RGB tuple to hex"""
    return '#{:02x}{:02x}{:02x}'.format(*rgb)

def rgb_to_hsl(rgb):
    """Convert RGB to HSL"""
    r, g, b = [x/255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (h * 360, s * 100, l * 100)

def generate_analogous(base_hex, num_colors=5):
    """Generate analogous color scheme"""
    base_rgb = hex_to_rgb(base_hex)
    base_hsl = rgb_to_hsl(base_rgb)
    
    colors = []
    for i in range(num_colors):
        # Rotate hue by 30 degrees for each color
        hue = (base_hsl[0] + (i * 30)) % 360
        hsl = (hue, base_hsl[1], base_hsl[2])
        
        # Convert back to RGB then HEX
        r, g, b = colorsys.hls_to_rgb(hsl[0]/360, hsl[2]/100, hsl[1]/100)
        rgb = (int(r * 255), int(g * 255), int(b * 255))
        colors.append(rgb_to_hex(rgb))
    
    return colors

def generate_complementary(base_hex):
    """Generate complementary color scheme"""
    base_rgb = hex_to_rgb(base_hex)
    base_hsl = rgb_to_hsl(base_rgb)
    
    # Complementary color is 180 degrees opposite
    comp_hue = (base_hsl[0] + 180) % 360
    comp_hsl = (comp_hue, base_hsl[1], base_hsl[2])
    
    r, g, b = colorsys.hls_to_rgb(comp_hue/360, comp_hsl[2]/100, comp_hsl[1]/100)
    comp_rgb = (int(r * 255), int(g * 255), int(b * 255))
    
    return [base_hex, rgb_to_hex(comp_rgb)]

def generate_triadic(base_hex):
    """Generate triadic color scheme"""
    base_rgb = hex_to_rgb(base_hex)
    base_hsl = rgb_to_hsl(base_rgb)
    
    colors = [base_hex]
    for i in range(1, 3):
        hue = (base_hsl[0] + (i * 120)) % 360
        hsl = (hue, base_hsl[1], base_hsl[2])
        
        r, g, b = colorsys.hls_to_rgb(hsl[0]/360, hsl[2]/100, hsl[1]/100)
        rgb = (int(r * 255), int(g * 255), int(b * 255))
        colors.append(rgb_to_hex(rgb))
    
    return colors

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to DevPalette API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "DevPalette API"}

@app.get("/api/schemes")
async def get_schemes():
    return {
        "schemes": [
            {"id": "analogous", "name": "Analogous", "description": "Colors next to each other on the color wheel"},
            {"id": "complementary", "name": "Complementary", "description": "Opposite colors on the color wheel"},
            {"id": "triadic", "name": "Triadic", "description": "Three colors evenly spaced on the color wheel"},
            {"id": "monochromatic", "name": "Monochromatic", "description": "Variations of a single hue"}
        ]
    }

@app.get("/api/palette/{hex_color}")
async def generate_palette(hex_color: str, scheme: str = "analogous"):
    """Generate color palette based on scheme"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        raise HTTPException(status_code=400, detail="Invalid hex color format")
    
    hex_color = f"#{hex_color}"
    
    schemes = {
        "analogous": generate_analogous,
        "complementary": generate_complementary,
        "triadic": generate_triadic,
        "monochromatic": lambda hex: [hex] + generate_analogous(hex, 4)[1:]  # Simple monochromatic
    }
    
    if scheme not in schemes:
        raise HTTPException(status_code=400, detail=f"Unknown scheme. Available: {list(schemes.keys())}")
    
    colors = schemes[scheme](hex_color)
    
    # Generate color names
    color_names = []
    for i, color in enumerate(colors):
        if i == 0:
            color_names.append("Base Color")
        else:
            color_names.append(f"Accent {i}")
    
    return {
        "base_color": hex_color,
        "scheme": scheme,
        "colors": colors,
        "color_names": color_names
    }

@app.post("/api/contrast")
async def calculate_contrast_ratio(request: ContrastRequest):
    """Calculate contrast ratio between two colors"""
    try:
        def calculate_luminance(hex_color):
            rgb = hex_to_rgb(hex_color)
            rgb = [x/255.0 for x in rgb]
            
            def adjust(channel):
                if channel <= 0.03928:
                    return channel / 12.92
                return ((channel + 0.055) / 1.055) ** 2.4
            
            rgb = [adjust(c) for c in rgb]
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
        
        l1 = calculate_luminance(request.color1)
        l2 = calculate_luminance(request.color2)
        
        # Ensure lighter color is first
        if l1 < l2:
            l1, l2 = l2, l1
        
        ratio = (l1 + 0.05) / (l2 + 0.05)
        
        # Determine WCAG compliance
        compliance = []
        if ratio >= 4.5:
            compliance.append("WCAG AA Normal Text")
        if ratio >= 7:
            compliance.append("WCAG AAA Normal Text")
        if ratio >= 3:
            compliance.append("WCAG AA Large Text")
        
        return {
            "color1": request.color1,
            "color2": request.color2,
            "contrast_ratio": round(ratio, 2),
            "wcag_compliance": compliance,
            "is_accessible": ratio >= 4.5
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/export")
async def export_palette(request: ExportRequest):
    """Export palette in various formats"""
    formats = {
        "css": ":root {{\n{0}\n}}",
        "json": '{{\n  "palette": [\n{0}\n  ]\n}}',
        "tailwind": 'module.exports = {{\n  theme: {{\n    extend: {{\n      colors: {{\n{0}\n      }}\n    }}\n  }}\n}}',
        "scss": "${0}"
    }
    
    if request.format not in formats:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Available: {list(formats.keys())}")
    
    # Generate content based on format
    if request.format == "css":
        lines = [f"  --color-{i+1}: {color};" for i, color in enumerate(request.colors)]
        content = formats[request.format].format("\n".join(lines))
    
    elif request.format == "json":
        lines = [f'    "{color}"' for color in request.colors]
        content = formats[request.format].format(",\n".join(lines))
    
    elif request.format == "tailwind":
        lines = [f"        'color-{i+1}': '{color}'," for i, color in enumerate(request.colors)]
        content = formats[request.format].format("\n".join(lines))
    
    elif request.format == "scss":
        lines = [f"$color-{i+1}: {color};" for i, color in enumerate(request.colors)]
        content = "\n".join(lines)
    
    return {
        "format": request.format,
        "content": content,
        "filename": f"palette.{request.format}"
    }