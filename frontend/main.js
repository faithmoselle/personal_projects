// DevPalette Application
class DevPalette {
  constructor() {
    this.baseColor = '#3b82f6';
    this.currentScheme = 'analogous';
    this.currentPalette = [];
    this.apiUrl = 'http://localhost:8000/api';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadFromUrl();
    this.generatePalette();
  }

  setupEventListeners() {
    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    const hexInput = document.getElementById('hexInput');
    
    if (colorPicker && hexInput) {
      colorPicker.value = this.baseColor;
      hexInput.value = this.baseColor;
      
      colorPicker.addEventListener('input', (e) => {
        this.baseColor = e.target.value;
        hexInput.value = e.target.value;
        this.generatePalette();
      });
      
      hexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (this.isValidHex(hex)) {
          this.baseColor = this.formatHex(hex);
          colorPicker.value = this.baseColor;
          this.generatePalette();
        }
      });
    }

    // Random color button
    const randomBtn = document.getElementById('randomColor');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        this.baseColor = this.getRandomColor();
        colorPicker.value = this.baseColor;
        hexInput.value = this.baseColor;
        this.generatePalette();
      });
    }

    // Scheme selector
    const schemeSelect = document.getElementById('schemeSelect');
    if (schemeSelect) {
      schemeSelect.addEventListener('change', (e) => {
        this.currentScheme = e.target.value;
        this.generatePalette();
      });
    }

    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generatePalette();
      });
    }

    // Export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.target.dataset.format;
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

    // Save palette button
    const saveBtn = document.getElementById('savePaletteBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.savePalette();
      });
    }
  }

  async generatePalette() {
    try {
      const hex = this.baseColor.replace('#', '');
      const response = await fetch(
        `${this.apiUrl}/palette/${hex}?scheme=${this.currentScheme}`
      );
      
      if (!response.ok) throw new Error('Failed to generate palette');
      
      const data = await response.json();
      this.currentPalette = data.colors;
      this.displayPalette(data);
      this.updateUrl();
      this.showToast('Palette generated!', 'success');
      
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Using fallback palette', 'warning');
      this.generateFallbackPalette();
    }
  }

  displayPalette(data) {
    const container = document.getElementById('paletteContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    data.colors.forEach((color, index) => {
      const swatch = this.createColorSwatch(color, data.color_names[index], index);
      container.appendChild(swatch);
    });
    
    // Update scheme display
    const schemeDisplay = document.getElementById('currentScheme');
    if (schemeDisplay) {
      const schemeNames = {
        analogous: 'Analogous',
        complementary: 'Complementary',
        triadic: 'Triadic',
        monochromatic: 'Monochromatic'
      };
      schemeDisplay.textContent = `${schemeNames[data.scheme]} Scheme`;
    }
  }

  createColorSwatch(color, name, index) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    
    // Determine text color for contrast
    const textColor = this.getContrastColor(color);
    
    swatch.innerHTML = `
      <div class="h-40 flex items-end p-4">
        <div class="text-white bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 w-full transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div class="flex justify-between items-start mb-1">
            <span class="font-semibold text-sm">${name}</span>
            <button class="copy-color text-xs px-2 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors" data-color="${color}">
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
              <span class="font-mono">${this.hexToRgbString(color)}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="p-4" style="color: ${textColor}">
        <div class="font-bold">${color}</div>
        <div class="text-sm opacity-90">${name}</div>
      </div>
    `;
    
    // Add copy functionality
    swatch.querySelector('.copy-color').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyToClipboardText(color);
      this.showToast(`Copied ${color}`, 'success');
    });
    
    // Click to set as base color
    swatch.addEventListener('click', () => {
      this.baseColor = color;
      document.getElementById('colorPicker').value = color;
      document.getElementById('hexInput').value = color;
      this.generatePalette();
    });
    
    return swatch;
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
      this.showToast('Failed to check contrast', 'error');
    }
  }

  displayContrastResult(data) {
    const resultDiv = document.getElementById('contrastResult');
    const ratioSpan = document.getElementById('ratioValue');
    const badgesDiv = document.getElementById('complianceBadges');
    
    if (!resultDiv || !ratioSpan || !badgesDiv) return;
    
    ratioSpan.textContent = data.contrast_ratio.toFixed(2);
    ratioSpan.className = data.is_accessible ? 'text-green-600' : 'text-red-600';
    
    badgesDiv.innerHTML = '';
    data.wcag_compliance.forEach(compliance => {
      const badge = document.createElement('span');
      badge.className = 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800';
      badge.textContent = compliance;
      badgesDiv.appendChild(badge);
    });
    
    // Add overall status
    const statusBadge = document.createElement('span');
    statusBadge.className = data.is_accessible 
      ? 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'
      : 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
    statusBadge.textContent = data.is_accessible ? 'Accessible' : 'Not Accessible';
    badgesDiv.appendChild(statusBadge);
    
    resultDiv.classList.remove('hidden');
  }

  async exportPalette(format) {
    if (this.currentPalette.length === 0) {
      this.showToast('Generate a palette first', 'warning');
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
      this.showToast(`Exported as ${format.toUpperCase()}`, 'success');
      
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Failed to export', 'error');
    }
  }

  savePalette() {
    if (this.currentPalette.length === 0) {
      this.showToast('No palette to save', 'warning');
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
    
    // Get existing palettes
    const savedPalettes = JSON.parse(localStorage.getItem('devpalette_saved') || '[]');
    savedPalettes.unshift(palette);
    localStorage.setItem('devpalette_saved', JSON.stringify(savedPalettes));
    
    this.showToast('Palette saved!', 'success');
    this.loadSavedPalettes();
  }

  loadSavedPalettes() {
    const container = document.getElementById('savedPalettes');
    if (!container) return;
    
    const savedPalettes = JSON.parse(localStorage.getItem('devpalette_saved') || '[]');
    
    if (savedPalettes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
          </svg>
          <p>No saved palettes yet.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = savedPalettes.map(palette => `
      <div class="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-medium">${palette.name}</h3>
            <p class="text-xs text-gray-500">${new Date(palette.createdAt).toLocaleDateString()}</p>
          </div>
          <button class="load-palette text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600" data-id="${palette.id}">
            Load
          </button>
        </div>
        <div class="flex gap-1 h-8 rounded overflow-hidden">
          ${palette.colors.map(color => `
            <div class="flex-1" style="background-color: ${color}" title="${color}"></div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    // Add load event listeners
    container.querySelectorAll('.load-palette').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        this.loadPalette(id, savedPalettes);
      });
    });
  }

  loadPalette(id, savedPalettes) {
    const palette = savedPalettes.find(p => p.id === id);
    if (!palette) return;
    
    this.baseColor = palette.baseColor;
    this.currentScheme = palette.scheme;
    
    document.getElementById('colorPicker').value = palette.baseColor;
    document.getElementById('hexInput').value = palette.baseColor;
    document.getElementById('schemeSelect').value = palette.scheme;
    
    this.currentPalette = palette.colors;
    this.displayPalette({
      colors: palette.colors,
      color_names: palette.colors.map((_, i) => i === 0 ? 'Base Color' : `Accent ${i}`),
      scheme: palette.scheme
    });
    
    this.showToast('Palette loaded!', 'success');
  }

  // Utility methods
  generateFallbackPalette() {
    const colors = this.generateColors(this.baseColor, this.currentScheme);
    this.currentPalette = colors;
    
    this.displayPalette({
      colors: colors,
      color_names: colors.map((_, i) => i === 0 ? 'Base Color' : `Accent ${i}`),
      scheme: this.currentScheme
    });
  }

  generateColors(baseHex, scheme) {
    // Simple fallback color generation
    const base = this.hexToRgb(baseHex);
    
    switch(scheme) {
      case 'analogous':
        return [
          baseHex,
          this.adjustHue(baseHex, 30),
          this.adjustHue(baseHex, 60),
          this.adjustHue(baseHex, -30),
          this.adjustHue(baseHex, -60)
        ];
      case 'complementary':
        return [baseHex, this.adjustHue(baseHex, 180)];
      case 'triadic':
        return [baseHex, this.adjustHue(baseHex, 120), this.adjustHue(baseHex, 240)];
      default: // monochromatic
        return [
          this.adjustLightness(baseHex, 20),
          this.adjustLightness(baseHex, 10),
          baseHex,
          this.adjustLightness(baseHex, -10),
          this.adjustLightness(baseHex, -20)
        ];
    }
  }

  adjustHue(hex, degrees) {
    const rgb = this.hexToRgb(hex);
    const [h, s, l] = this.rgbToHsl(rgb);
    const newH = (h + degrees + 360) % 360;
    return this.hslToHex(newH, s, l);
  }

  adjustLightness(hex, percent) {
    const rgb = this.hexToRgb(hex);
    const [h, s, l] = this.rgbToHsl(rgb);
    const newL = Math.max(0, Math.min(100, l + percent));
    return this.hslToHex(h, s, newL);
  }

  hexToRgb(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16)
    ];
  }

  hexToRgbString(hex) {
    const [r, g, b] = this.hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  }

  rgbToHsl(rgb) {
    const [r, g, b] = rgb.map(c => c / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
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
      this.showToast('Nothing to copy', 'warning');
      return;
    }
    
    navigator.clipboard.writeText(textarea.value)
      .then(() => this.showToast('Copied to clipboard!', 'success'))
      .catch(() => this.showToast('Failed to copy', 'error'));
  }

  copyToClipboardText(text) {
    navigator.clipboard.writeText(text)
      .then(() => this.showToast('Color copied!', 'success'))
      .catch(() => this.showToast('Failed to copy', 'error'));
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    // Set colors based on type
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-gray-900'
    };
    
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl transform translate-y-10 opacity-0 transition-all duration-300`;
    toastMessage.textContent = message;
    
    // Show
    setTimeout(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-10', 'opacity-0');
    }, 3000);
  }

  updateUrl() {
    const params = new URLSearchParams({
      color: this.baseColor.replace('#', ''),
      scheme: this.currentScheme
    });
    window.history.replaceState({}, '', `?${params.toString()}`);
  }

  loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const color = params.get('color');
    const scheme = params.get('scheme');
    
    if (color && this.isValidHex(color)) {
      this.baseColor = this.formatHex(color);
      document.getElementById('colorPicker').value = this.baseColor;
      document.getElementById('hexInput').value = this.baseColor;
    }
    
    if (scheme && ['analogous', 'complementary', 'triadic', 'monochromatic'].includes(scheme)) {
      this.currentScheme = scheme;
      document.getElementById('schemeSelect').value = scheme;
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const app = new DevPalette();
  
  // Load saved palettes
  app.loadSavedPalettes();
  
  // Add to window for debugging
  window.devpalette = app;
});
EOF