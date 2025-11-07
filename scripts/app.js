// ===========================
// TEAJIA - MODERN UPSCALE APP
// ===========================

// State Management
const appState = {
    allTeas: [],
    filteredTeas: [],
    activeFilters: {
        search: '',
        preset: null,
        types: [],
        priceMax: 100,
        origins: [],
        tags: []
    },
    recentlyViewed: [],
    priceMax: 100
};

// DOM Elements
const elements = {
    filterToggle: document.getElementById('filterToggle'),
    filterSidebar: document.getElementById('filterSidebar'),
    searchInput: document.getElementById('searchInput'),
    presetButtons: document.querySelectorAll('.preset-btn'),
    typeFilters: document.getElementById('typeFilters'),
    priceRange: document.getElementById('priceRange'),
    priceDisplay: document.getElementById('priceDisplay'),
    originFilters: document.getElementById('originFilters'),
    clearFiltersBtn: document.getElementById('clearFilters'),
    teaGrid: document.getElementById('teaGrid'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    emptyState: document.getElementById('emptyState'),
    recentlyViewedSection: document.getElementById('recentlyViewedSection'),
    recentTeas: document.getElementById('recentTeas'),
    statsTotal: document.getElementById('totalTeas'),
    statsTypes: document.getElementById('totalTypes'),
    statsInStock: document.getElementById('inStock'),
    modal: document.getElementById('modal'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalClose: document.querySelector('.modal-close')
};

// Tea Type Configuration
const teaTypeConfig = {
    'dark': { label: 'Dark/Pu-erh', pattern: 'pattern-dark' },
    'oolong': { label: 'Oolong', pattern: 'pattern-oolong' },
    'red': { label: 'Red Tea', pattern: 'pattern-red' },
    'green': { label: 'Green Tea', pattern: 'pattern-green' },
    'white': { label: 'White Tea', pattern: 'pattern-white' },
    'flower': { label: 'Flower Tea', pattern: 'pattern-flower' }
};

// ===========================
// DATA FETCHING
// ===========================

async function fetchTeaData() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSdkRy61map_HCqtlujOt_N-1Q5m3ZA6n9pRUsmgrOL1kaWdNpEEHfqMWL5rPcM5WCNIqoGDQ7QiKX9/pub?output=csv';

    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Network response was not ok');

        const csvText = await response.text();
        const teas = parseCSV(csvText);

        appState.allTeas = teas;
        appState.filteredTeas = teas;

        // Calculate max price for price range slider
        const prices = teas
            .map(t => {
                const match = (t.gramPrice || '0').match(/\d+\.?\d*/);
                return match ? parseFloat(match[0]) : 0;
            })
            .filter(p => p > 0);

        appState.priceMax = Math.ceil(Math.max(...prices)) || 100;
        elements.priceRange.max = appState.priceMax;
        elements.priceRange.value = appState.priceMax;

        generateFilters();
        loadRecentlyViewed();
        renderAllCards();
        updateStatistics();
        hideLoadingState();
    } catch (error) {
        console.error('Error fetching tea data:', error);
        showErrorState();
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const teas = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const tea = {
            type: (values[0] || '').trim(),
            givenName: (values[1] || '').trim(),
            age: (values[2] || '').trim(),
            name: (values[3] || '').trim(),
            grams: (values[4] || '').trim(),
            bagCost: (values[5] || '').trim(),
            gramPrice: (values[6] || '').trim(),
            bagSizeUsd: (values[7] || '').trim(),
            sizeUsd: (values[8] || '').trim(),
            stock: (values[9] || '').trim(),
            itemNum: (values[10] || '').trim(),
            source: (values[11] || '').trim(),
            gramCost: (values[12] || '').trim(),
            tasting: (values[13] || '').trim(),
            shipping: (values[14] || '').trim(),
            rawData: values
        };

        if (tea.name) {
            teas.push(tea);
        }
    }

    return teas;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// ===========================
// FILTER GENERATION
// ===========================

function generateFilters() {
    // Generate tea type checkboxes
    const types = [...new Set(appState.allTeas.map(t => t.type.toLowerCase()))];
    let typeHTML = '';
    types.forEach(type => {
        const config = getTeaTypeConfig(type);
        typeHTML += `
            <div class="filter-checkbox">
                <input type="checkbox" id="type-${type}" value="${type}" class="type-checkbox">
                <label for="type-${type}">${config.label}</label>
            </div>
        `;
    });
    elements.typeFilters.innerHTML = typeHTML;
    document.querySelectorAll('.type-checkbox').forEach(cb => {
        cb.addEventListener('change', () => applyFilters());
    });

    // Generate origin checkboxes
    const origins = [...new Set(appState.allTeas.map(t => t.source).filter(s => s))];
    let originHTML = '';
    origins.forEach(origin => {
        originHTML += `
            <div class="filter-checkbox">
                <input type="checkbox" id="origin-${origin}" value="${origin}" class="origin-checkbox">
                <label for="origin-${origin}">${escapeHtml(origin)}</label>
            </div>
        `;
    });
    elements.originFilters.innerHTML = originHTML;
    document.querySelectorAll('.origin-checkbox').forEach(cb => {
        cb.addEventListener('change', () => applyFilters());
    });
}

// ===========================
// FILTER APPLICATION
// ===========================

function applyFilters() {
    // Get all active filters
    appState.activeFilters.types = Array.from(document.querySelectorAll('.type-checkbox:checked')).map(cb => cb.value);
    appState.activeFilters.origins = Array.from(document.querySelectorAll('.origin-checkbox:checked')).map(cb => cb.value);
    appState.activeFilters.priceMax = parseFloat(elements.priceRange.value);
    appState.activeFilters.search = elements.searchInput.value.toLowerCase();

    let filtered = appState.allTeas;

    // Apply preset filter if active
    if (appState.activeFilters.preset) {
        filtered = filterByPreset(filtered, appState.activeFilters.preset);
    }

    // Apply type filter
    if (appState.activeFilters.types.length > 0) {
        filtered = filtered.filter(tea => {
            const typeNorm = tea.type.toLowerCase();
            return appState.activeFilters.types.some(t => typeNorm.includes(t));
        });
    }

    // Apply price filter
    filtered = filtered.filter(tea => {
        const priceMatch = (tea.gramPrice || '0').match(/\d+\.?\d*/);
        const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
        return price <= appState.activeFilters.priceMax;
    });

    // Apply origin filter
    if (appState.activeFilters.origins.length > 0) {
        filtered = filtered.filter(tea => appState.activeFilters.origins.includes(tea.source));
    }

    // Apply search filter
    if (appState.activeFilters.search) {
        filtered = filtered.filter(tea => {
            const searchTerm = appState.activeFilters.search;
            return (
                tea.name.toLowerCase().includes(searchTerm) ||
                tea.givenName.toLowerCase().includes(searchTerm) ||
                tea.source.toLowerCase().includes(searchTerm) ||
                tea.tasting.toLowerCase().includes(searchTerm) ||
                tea.type.toLowerCase().includes(searchTerm)
            );
        });
    }

    // Apply tag filter
    if (appState.activeFilters.tags.length > 0) {
        filtered = filtered.filter(tea => {
            const tags = extractFlavorTags(tea.tasting);
            return appState.activeFilters.tags.some(tag =>
                tags.some(t => t.toLowerCase() === tag.toLowerCase())
            );
        });
    }

    appState.filteredTeas = filtered;
    renderAllCards();
    updateStatistics();
}

function filterByPreset(teas, preset) {
    const medianPrice = getMedianPrice(teas);

    switch(preset) {
        case 'beginners':
            return teas.filter(tea => {
                const tastingLower = tea.tasting.toLowerCase();
                return /smooth|mellow|mild|light|beginner|easy/.test(tastingLower);
            });

        case 'premium':
            return teas.filter(tea => {
                const priceMatch = (tea.gramPrice || '0').match(/\d+\.?\d*/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
                return price > medianPrice;
            });

        case 'value':
            return teas.filter(tea => {
                const priceMatch = (tea.gramPrice || '0').match(/\d+\.?\d*/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
                return price < medianPrice && price > 0;
            });

        case 'bold':
            return teas.filter(tea => {
                const tastingLower = tea.tasting.toLowerCase();
                return /bold|strong|robust|intense|rich|deep/.test(tastingLower);
            });

        default:
            return teas;
    }
}

function getMedianPrice(teas) {
    const prices = teas
        .map(t => {
            const match = (t.gramPrice || '0').match(/\d+\.?\d*/);
            return match ? parseFloat(match[0]) : 0;
        })
        .filter(p => p > 0)
        .sort((a, b) => a - b);

    if (prices.length === 0) return 0;
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
}

// Event Listeners for Filters
elements.searchInput.addEventListener('input', applyFilters);
elements.priceRange.addEventListener('input', () => {
    elements.priceDisplay.textContent = `Up to $${elements.priceRange.value}/${100}g`;
    applyFilters();
});
elements.presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.activeFilters.preset = btn.dataset.preset;
        applyFilters();
    });
});
elements.clearFiltersBtn.addEventListener('click', () => {
    document.querySelectorAll('.type-checkbox, .origin-checkbox').forEach(cb => cb.checked = false);
    elements.presetButtons.forEach(btn => btn.classList.remove('active'));
    elements.searchInput.value = '';
    elements.priceRange.value = appState.priceMax;
    elements.priceDisplay.textContent = 'All Prices';
    appState.activeFilters = { search: '', preset: null, types: [], priceMax: appState.priceMax, origins: [], tags: [] };
    applyFilters();
});

// ===========================
// RENDERING
// ===========================

function renderAllCards() {
    elements.teaGrid.innerHTML = '';

    if (appState.filteredTeas.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    appState.filteredTeas.forEach((tea) => {
        const card = createTeaCard(tea);
        elements.teaGrid.appendChild(card);
    });
}

function createTeaCard(tea) {
    const card = document.createElement('div');
    card.className = 'tea-card';
    card.role = 'button';
    card.tabIndex = 0;

    const typeNorm = tea.type.toLowerCase();
    const typeConfig = getTeaTypeConfig(typeNorm);
    const stockStatus = getStockStatus(tea.stock);
    const tags = extractFlavorTags(tea.tasting);
    const priceMatch = (tea.gramPrice || '0').match(/\d+\.?\d*/);
    const price = priceMatch ? priceMatch[0] : 'N/A';

    const titleDisplay = tea.age && tea.age !== '0' && tea.age !== 'Unknown'
        ? `${escapeHtml(tea.name)} (${escapeHtml(tea.age)})`
        : escapeHtml(tea.name);

    let tagsHTML = '';
    tags.slice(0, 2).forEach(tag => {
        tagsHTML += `<span class="tea-tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`;
    });

    card.innerHTML = `
        <div class="tea-card-image ${typeConfig.pattern}">
            <span class="tea-card-type-badge">${typeConfig.label}</span>
        </div>
        <div class="tea-card-content">
            <h3 class="tea-card-name">${titleDisplay}</h3>
            <div class="tea-card-price">$${price}/g</div>
            ${tea.source ? `<p class="tea-card-origin">${escapeHtml(tea.source)}</p>` : ''}
            <div class="tea-card-tags">
                ${tagsHTML}
            </div>
            <div class="tea-card-stock">
                <span class="stock-indicator ${stockStatus.class}"></span>
                <span>${stockStatus.text}</span>
            </div>
        </div>
    `;

    // Add tag click handlers
    card.querySelectorAll('.tea-tag').forEach(tagEl => {
        tagEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const tag = tagEl.dataset.tag;
            appState.activeFilters.tags = [tag];
            applyFilters();
        });
    });

    card.addEventListener('click', () => openModal(tea));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(tea);
        }
    });

    return card;
}

function extractFlavorTags(tastingNotes) {
    if (!tastingNotes) return [];

    const flavorKeywords = [
        'smooth', 'bold', 'mellow', 'floral', 'earthy', 'fruity', 'sweet', 'bitter',
        'roasted', 'fresh', 'bright', 'creamy', 'spicy', 'grassy', 'woody', 'honey',
        'light', 'dark', 'rich', 'delicate', 'robust', 'smooth', 'intense', 'gentle'
    ];

    const tags = [];
    const lowerTasting = tastingNotes.toLowerCase();

    flavorKeywords.forEach(keyword => {
        if (lowerTasting.includes(keyword) && !tags.includes(keyword)) {
            tags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
    });

    return tags.slice(0, 2); // Return max 2 tags
}

function getTeaTypeConfig(type) {
    const typeNormalized = (type || '').toLowerCase().trim();

    if (typeNormalized.includes('dark') || typeNormalized.includes('puerh') || typeNormalized.includes('pu-erh')) {
        return teaTypeConfig['dark'];
    } else if (typeNormalized.includes('oolong')) {
        return teaTypeConfig['oolong'];
    } else if (typeNormalized.includes('red')) {
        return teaTypeConfig['red'];
    } else if (typeNormalized.includes('green')) {
        return teaTypeConfig['green'];
    } else if (typeNormalized.includes('white')) {
        return teaTypeConfig['white'];
    } else if (typeNormalized.includes('flower') || typeNormalized.includes('floral')) {
        return teaTypeConfig['flower'];
    }

    return { label: 'Tea', pattern: 'pattern-dark' };
}

function getStockStatus(amount) {
    const numMatch = (amount || '').match(/\d+/);
    const quantity = numMatch ? parseInt(numMatch[0]) : 0;

    if (quantity === 0) {
        return { text: 'Out of Stock', class: 'stock-out' };
    } else if (quantity < 50) {
        return { text: `${amount} (Low)`, class: 'stock-low' };
    } else {
        return { text: amount, class: 'stock-good' };
    }
}

// ===========================
// RECENTLY VIEWED
// ===========================

function addToRecentlyViewed(tea) {
    // Remove if already exists
    appState.recentlyViewed = appState.recentlyViewed.filter(t => t.name !== tea.name);

    // Add to front
    appState.recentlyViewed.unshift(tea);

    // Keep only last 5
    appState.recentlyViewed = appState.recentlyViewed.slice(0, 5);

    // Save to localStorage
    localStorage.setItem('teajiaRecent', JSON.stringify(appState.recentlyViewed));

    renderRecentlyViewed();
}

function loadRecentlyViewed() {
    const saved = localStorage.getItem('teajiaRecent');
    if (saved) {
        appState.recentlyViewed = JSON.parse(saved);
        renderRecentlyViewed();
    }
}

function renderRecentlyViewed() {
    if (appState.recentlyViewed.length === 0) {
        elements.recentlyViewedSection.style.display = 'none';
        return;
    }

    elements.recentlyViewedSection.style.display = 'block';
    let html = '';
    appState.recentlyViewed.forEach(tea => {
        html += `<div class="recent-tea" data-name="${escapeHtml(tea.name)}">${escapeHtml(tea.name)}</div>`;
    });
    elements.recentTeas.innerHTML = html;

    document.querySelectorAll('.recent-tea').forEach(el => {
        el.addEventListener('click', () => {
            const name = el.dataset.name;
            const tea = appState.allTeas.find(t => t.name === name);
            if (tea) openModal(tea);
        });
    });
}

// ===========================
// MODAL
// ===========================

function openModal(tea) {
    addToRecentlyViewed(tea);

    const typeConfig = getTeaTypeConfig(tea.type);
    const stockStatus = getStockStatus(tea.stock);
    const priceMatch = (tea.gramPrice || '0').match(/\d+\.?\d*/);
    const price = priceMatch ? priceMatch[0] : 'N/A';

    document.getElementById('modalTitle').textContent = tea.name;
    document.getElementById('modalEnglishName').textContent = tea.givenName || '';

    const badge = document.getElementById('modalBadge');
    badge.textContent = typeConfig.label;

    document.getElementById('modalOrigin').innerHTML = `
        <strong>Source:</strong> ${escapeHtml(tea.source || 'Not specified')}<br/>
        <strong>Type:</strong> ${escapeHtml(tea.type)}<br/>
        ${tea.age && tea.age !== '0' && tea.age !== 'Unknown' ? `<strong>Age:</strong> ${escapeHtml(tea.age)}<br/>` : ''}
        ${tea.grams ? `<strong>Weight:</strong> ${escapeHtml(tea.grams)}<br/>` : ''}
    `;

    document.getElementById('modalFlavor').textContent = tea.tasting || 'See tasting notes';

    document.getElementById('modalBrewing').innerHTML = `
        <strong>Price per Gram:</strong> $${price}<br/>
        ${tea.itemNum ? `<strong>Item #:</strong> ${escapeHtml(tea.itemNum)}<br/>` : ''}
        ${tea.shipping ? `<strong>Shipping:</strong> ${escapeHtml(tea.shipping)}<br/>` : ''}
    `;

    const stockElement = document.getElementById('modalStock');
    stockElement.innerHTML = `
        <span class="stock-indicator ${stockStatus.class}"></span>
        <span><strong>${stockStatus.text}</strong></span>
    `;

    const imageContainer = document.querySelector('.modal-image');
    imageContainer.innerHTML = `<span style="font-size: 4rem;">${getTeaEmoji(tea.type)}</span>`;

    elements.modal.style.display = 'block';
    elements.modalBackdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function getTeaEmoji(type) {
    const typeNormalized = (type || '').toLowerCase();
    const emojiMap = {
        'dark': '🏺',
        'oolong': '☕',
        'green': '🍃',
        'red': '❤️',
        'white': '⚪',
        'flower': '🌸',
    };

    for (let key of Object.keys(emojiMap)) {
        if (typeNormalized.includes(key)) {
            return emojiMap[key];
        }
    }

    return '🍵';
}

function closeModal() {
    elements.modal.style.display = 'none';
    elements.modalBackdrop.style.display = 'none';
    document.body.style.overflow = 'auto';
}

elements.modalClose.addEventListener('click', closeModal);
elements.modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal.style.display === 'block') {
        closeModal();
    }
});

// ===========================
// STATISTICS
// ===========================

function updateStatistics() {
    const totalTeas = appState.allTeas.length;
    const typeSet = new Set(appState.allTeas.map(t => t.type));
    const totalTypes = typeSet.size;

    let inStockCount = 0;
    appState.allTeas.forEach(tea => {
        const stockStr = (tea.stock || '').toLowerCase();
        if (stockStr && stockStr !== 'unknown' && stockStr !== 'out of stock') {
            const numMatch = tea.stock.match(/\d+/);
            const quantity = numMatch ? parseInt(numMatch[0]) : (stockStr ? 1 : 0);
            if (quantity > 0) {
                inStockCount++;
            }
        }
    });

    elements.statsTotal.textContent = totalTeas;
    elements.statsTypes.textContent = totalTypes;
    elements.statsInStock.textContent = inStockCount;
}

// ===========================
// UI STATE
// ===========================

function showLoadingState() {
    elements.loadingState.style.display = 'flex';
    elements.teaGrid.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.emptyState.style.display = 'none';
}

function hideLoadingState() {
    elements.loadingState.style.display = 'none';
    elements.teaGrid.style.display = 'grid';
}

function showErrorState() {
    elements.loadingState.style.display = 'none';
    elements.teaGrid.style.display = 'none';
    elements.errorState.style.display = 'block';
}

function showEmptyState() {
    elements.emptyState.style.display = 'block';
}

function hideEmptyState() {
    elements.emptyState.style.display = 'none';
}

// ===========================
// RESPONSIVE FILTER TOGGLE
// ===========================

elements.filterToggle.addEventListener('click', () => {
    const isActive = elements.filterSidebar.classList.toggle('active');
    elements.filterToggle.setAttribute('aria-expanded', isActive);
});

// Close filter sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!elements.filterSidebar.contains(e.target) && !elements.filterToggle.contains(e.target)) {
            elements.filterSidebar.classList.remove('active');
            elements.filterToggle.setAttribute('aria-expanded', 'false');
        }
    }
});

// ===========================
// UTILITY FUNCTIONS
// ===========================

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    showLoadingState();
    fetchTeaData();
});
