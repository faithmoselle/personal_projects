console.log("=== DEVPALETTE APP LOADED ===");

// Simple DevPalette App
class DevPalette {
  constructor() {
    console.log("Constructor called");
    this.baseColor = '#3b82f6';
    this.currentScheme = 'analogous';
    this.apiUrl = 'http://localhost:8000/api';
    this.init();
  }

  init() {
    console.log("Initializing app...");
    this.setupEventListeners();
    this.showMessage('Welcome to DevPalette!', 'success');
  }

  setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    const hexInput = document.getElementById('hexInput');
    
    if (colorPicker && hexInput) {
      console.log("✓ Found color picker and hex input");
      
      colorPicker.addEventListener('input', (e) => {
        console.log("Color picker changed to:", e.target.value);
        this.baseColor = e.target.value;
        hexInput.value = e.target.value;
        this.updatePreview();
      });
      
      hexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        console.log("Hex input changed to:", hex);
        if (this.isValidHex(hex)) {
          this.baseColor = this.formatHex(hex);
          colorPicker.value = this.baseColor;
          this.updatePreview();
        }
      });
    }
    
    // RANDOM BUTTON - This is what you're missing!
    const randomBtn = document.getElementById('randomColor');
    console.log("Looking for random button:", randomBtn);
    
    if (randomBtn) {
      console.log("✓ Found random button, adding click event...");
      randomBtn.addEventListener('click', () => {
        console.log("=== RANDOM BUTTON CLICKED! ===");
        this.baseColor = this.getRandomColor();
        console.log("Generated random color:", this.baseColor);
        
        // Update UI
        if (colorPicker) {
          colorPicker.value = this.baseColor;
          console.log("Updated color picker");
        }
        if (hexInput) {
          hexInput.value = this.baseColor;
          console.log("Updated hex input");
        }
        
        this.updatePreview();
        this.showMessage('Random color generated!', 'success');
      });
    } else {
      console.error("✗ Random button NOT FOUND! Check HTML ID.");
    }
    
    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      console.log("✓ Found generate button");
      generateBtn.addEventListener('click', () => {
        console.log("Generate button clicked");
        this.generatePalette();
      });
    }
    
    // Scheme selector
    const schemeSelect = document.getElementById('schemeSelect');
    if (schemeSelect) {
      console.log("✓ Found scheme selector");
      schemeSelect.addEventListener('change', (e) => {
        this.currentScheme = e.target.value;
        console.log("Scheme changed to:", this.currentScheme);
        this.generatePalette();
      });
    }
    
    // Export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.target.dataset.format;
        console.log("Export clicked:", format);
        this.exportPalette(format);
      });
    });
    
    // Copy button
    const copyBtn = document.getElementById('copyCodeBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyToClipboard();
      });
    }
    
    // Contrast checker
    const checkContrastBtn = document.getElementById('checkContrastBtn');
    if (checkContrastBtn) {
      checkContrastBtn.addEventListener('click', () => {
        this.checkContrast();
      });
    }
    
    // Save palette
    const saveBtn = document.getElementById('savePaletteBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.savePalette();
      });
    }
  }

  updatePreview() {
    console.log("Updating preview with color:", this.baseColor);
    const container = document.getElementById('paletteContainer');
    if (!container) {
      console.error("✗ Palette container not found!");
      return;
    }
    
    // Simple preview
    container.innerHTML = `
      <div class="color-swatch" style="background-color: ${this.baseColor}">
        <div class="h-40 flex items-end p-4">
          <div class="text-white bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 w-full">
            <div class="font-semibold text-sm mb-1">Current Color</div>
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>HEX</span>
                <span class="font-mono font-bold">${this.baseColor}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 text-white">
          <div class="font-bold">${this.baseColor}</div>
          <div class="text-sm opacity-90">Click Random to change</div>
        </div>
      </div>
    `;
  }

  async generatePalette() {
    console.log("Attempting to generate palette...");
    try {
      const hex = this.baseColor.replace('#', '');
      console.log("Calling API:", `${this.apiUrl}/palette/${hex}?scheme=${this.currentScheme}`);
      
      const response = await fetch(
        `${this.apiUrl}/palette/${hex}?scheme=${this.currentScheme}`
      );
      
      console.log("API response status:", response.status);
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      console.log("API response data:", data);
      this.displayPalette(data);
      this.showMessage('Palette generated!', 'success');
      
    } catch (error) {
      console.error('Error generating palette:', error);
      this.showMessage('Using fallback colors', 'warning');
      this.generateFallbackPalette();
    }
  }

  displayPalette(data) {
    const container = document.getElementById('paletteContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    data.colors.forEach((color, index) => {
      const textColor = this.getContrastColor(color);
      const rgb = this.hexToRgb(color);
      
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.innerHTML = `
        <div class="h-40 flex items-end p-4">
          <div class="text-white bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 w-full">
            <div class="flex justify-between items-start mb-1">
              <span class="font-semibold text-sm">${data.color_names[index]}</span>
              <button class="copy-color text-xs px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30" data-color="${color}">
                Copy
              </button>
            </div>
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>HEX</span>
                <span class="font-mono font-bold">${color}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>RGB</span>
                <span class="font-mono">${rgb.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4" style="color: ${textColor}">
          <div class="font-bold">${color}</div>
          <div class="text-sm opacity-90">${data.color_names[index]}</div>
        </div>
      `;
      
      // Add copy functionality
      swatch.querySelector('.copy-color').addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyToClipboardText(color);
      });
      
      container.appendChild(swatch);
    });
  }

  async checkContrast() {
    try {
      const color1 = document.getElementById('foregroundHex').value;
      const color2 = document.getElementById('backgroundHex').value;
      
      const response = await fetch(`${this.apiUrl}/contrast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color1, color2 })
      });
      
      if (!response.ok) throw new Error('Failed to check contrast');
      
      const data = await response.json();
      this.displayContrastResult(data);
      
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('Failed to check contrast', 'error');
    }
  }

  async exportPalette(format) {
    if (!this.currentPalette || this.currentPalette.length === 0) {
      this.showMessage('Generate a palette first', 'warning');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colors: this.currentPalette,
          format: format
        })
      });
      
      if (!response.ok) throw new Error('Failed to export');
      
      const data = await response.json();
      document.getElementById('exportCode').value = data.content;
      this.showMessage(`Exported as ${format.toUpperCase()}`, 'success');
      
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('Failed to export', 'error');
    }
  }

  savePalette() {
    if (!this.currentPalette || this.currentPalette.length === 0) {
      this.showMessage('No palette to save', 'warning');
      return;
    }
    
    const palette = {
      id: Date.now(),
      name: `Palette ${new Date().toLocaleDateString()}`,
      colors: [...this.currentPalette],
      baseColor: this.baseColor,
      scheme: this.currentScheme,
      createdAt: new Date().toISOString()
    };
    
    const savedPalettes = JSON.parse(localStorage.getItem('devpalette_saved') || '[]');
    savedPalettes.unshift(palette);
    localStorage.setItem('devpalette_saved', JSON.stringify(savedPalettes));
    
    this.showMessage('Palette saved!', 'success');
    this.loadSavedPalettes();
  }

  loadSavedPalettes() {
    const container = document.getElementById('savedPalettes');
    if (!container) return;
    
    const savedPalettes = JSON.parse(localStorage.getItem('devpalette_saved') || '[]');
    
    if (savedPalettes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p>No saved palettes yet.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = savedPalettes.map(palette => `
      <div class="border border-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-medium">${palette.name}</h3>
            <p class="text-xs text-gray-500">${new Date(palette.createdAt).toLocaleDateString()}</p>
          </div>
          <button class="load-palette text-xs px-3 py-1 bg-primary-500 text-white rounded" data-id="${palette.id}">
            Load
          </button>
        </div>
        <div class="flex gap-1 h-8 rounded overflow-hidden">
          ${palette.colors.map(color => `
            <div class="flex-1" style="background-color: ${color}"></div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // Utility methods
  getRandomColor() {
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    console.log("Generated random color:", color);
    return color;
  }

  generateFallbackPalette() {
    const colors = [
      this.baseColor,
      this.adjustColor(this.baseColor, 30),
      this.adjustColor(this.baseColor, 60),
      this.adjustColor(this.baseColor, -30),
      this.adjustColor(this.baseColor, -60)
    ];
    
    this.currentPalette = colors;
    
    this.displayPalette({
      colors: colors,
      color_names: colors.map((_, i) => i === 0 ? 'Base Color' : `Color ${i+1}`)
    });
  }

  adjustColor(hex, amount) {
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);
    
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  hexToRgb(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16)
    ];
  }

  isValidHex(hex) {
    return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }

  formatHex(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    return '#' + hex.toLowerCase();
  }

  getContrastColor(hex) {
    const rgb = this.hexToRgb(hex);
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  copyToClipboard() {
    const textarea = document.getElementById('exportCode');
    if (!textarea || !textarea.value) {
      this.showMessage('Nothing to copy', 'warning');
      return;
    }
    
    navigator.clipboard.writeText(textarea.value)
      .then(() => this.showMessage('Copied to clipboard!', 'success'))
      .catch(() => this.showMessage('Failed to copy', 'error'));
  }

  copyToClipboardText(text) {
    navigator.clipboard.writeText(text)
      .then(() => this.showMessage('Color copied!', 'success'))
      .catch(() => this.showMessage('Failed to copy', 'error'));
  }

  showMessage(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-gray-900'
    };
    
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl`;
    toastMessage.textContent = message;
    
    setTimeout(() => {
      toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl hidden`;
    }, 3000);
  }
}

// Initialize app
console.log("Waiting for DOM to load...");
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, creating DevPalette instance...");
  window.app = new DevPalette();
  console.log("DevPalette instance created:", window.app);
  
  // Test: Can we access the app?
  console.log("Type 'app' in console to access DevPalette instance");
});