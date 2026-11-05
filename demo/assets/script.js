
const bungalows = [
    {
        name: 'Akasya',
        images: [
            "assets/images/Akasya/1.svg",
            "assets/images/Akasya/2.svg",
            "assets/images/Akasya/3.svg"
        ],
        capacity: '2-4 Kişi',
        bedrooms: '1 Yatak Odası',
        bathrooms: '1 Banyo',
        area: '45 m²',
        description: 'Sessiz ve huzurlu ortamda konumlanmış, doğayla bağlantılı rahat yaşam alanı.',
        features: ['WiFi', 'Klima', 'Balkon', 'Mutfak'],
        price: '₺850'
    },
    {
        name: 'Ihlamur',
        images: [
            "assets/images/Ihlamur/1.svg",
            "assets/images/Ihlamur/2.svg",
            "assets/images/Ihlamur/3.svg"
        ],
        capacity: '3-5 Kişi',
        bedrooms: '2 Yatak Odası',
        bathrooms: '2 Banyo',
        area: '60 m²',
        description: 'Geniş ve aydınlık iç mekanıyla, aile tatılları için ideal seçim.',
        features: ['WiFi', 'Klima', 'Teras', 'Uydu TV'],
        price: '₺1,200'
    },
    {
        name: 'Meşe',
        images: [
            "assets/images/Meşe/1.svg",
            "assets/images/Meşe/2.svg",
            "assets/images/Meşe/3.svg"
        ],
        capacity: '4-6 Kişi',
        bedrooms: '3 Yatak Odası',
        bathrooms: '2 Banyo',
        area: '80 m²',
        description: 'Lüks tasarımı ve konfor seçenekleriyle, özel ve rahat bir ortam.',
        features: ['WiFi', 'Isıtma', 'Balkon', 'Sauna'],
        price: '₺1,600'
    },
    {
        name: 'Palmiye',
        images: [
            "assets/images/Palmiye/1.svg",
            "assets/images/Palmiye/2.svg",
            "assets/images/Palmiye/3.svg"
        ],
        capacity: '2-4 Kişi',
        bedrooms: '1 Yatak Odası',
        bathrooms: '1 Banyo',
        area: '50 m²',
        description: 'Tropikal bahçe ortamında, sürdürülebilir ve doğa dostu tasarım.',
        features: ['WiFi', 'Bahçe', 'Mini Bar', 'Açık Alan'],
        price: '₺950'
    },
    {
        name: 'Zeytin',
        images: [
            "assets/images/Zeytin/1.svg",
            "assets/images/Zeytin/2.svg",
            "assets/images/Zeytin/3.svg"
        ],
        capacity: '3-5 Kişi',
        bedrooms: '2 Yatak Odası',
        bathrooms: '1 Banyo',
        area: '65 m²',
        description: 'Klasik ve şık tasarımıyla, doğanın bereketi hissettiren ortam.',
        features: ['WiFi', 'Şömine', 'Veranda', 'Kurulu Masa'],
        price: '₺1,100'
    }
];

let currentSlideIndex = 0;
let currentBungalow = null;

// Generate bungalow cards dynamically
function generateBungalowCards() {
    const grid = document.getElementById('bungalowsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    bungalows.forEach((bungalow, index) => {
        const card = document.createElement('div');
        card.className = 'bungalow-card';
        
        const specsHTML = `
            <div class="spec-item">
                <iconify-icon width="18" height="18" icon="mdi:people"></iconify-icon>
                <span>${bungalow.capacity}</span>
            </div>
            <div class="spec-item">
                <iconify-icon width="18" height="18" icon="mdi:door"></iconify-icon>
                <span>${bungalow.bedrooms}</span>
            </div>
            <div class="spec-item">
                <iconify-icon width="18" height="18" icon="mdi:shower"></iconify-icon>
                <span>${bungalow.bathrooms}</span>
            </div>
            <div class="spec-item">
                <iconify-icon width="18" height="18" icon="mdi:ruler"></iconify-icon>
                <span>${bungalow.area}</span>
            </div>
        `;
        
        const featuresHTML = bungalow.features.map(feature => 
            `<span class="feature-tag">${feature}</span>`
        ).join('');
        
        card.innerHTML = `
            <div class="bungalow-image-container">
                <img src="${bungalow.images[0]}" alt="${bungalow.name} Bungalow" class="bungalow-image">
            </div>
            <div class="bungalow-content">
                <h2 class="bungalow-name">${bungalow.name}</h2>
                
                <div class="bungalow-specs">
                    ${specsHTML}
                </div>

                <p class="bungalow-description">
                    ${bungalow.description}
                </p>

                <div class="features-list">
                    ${featuresHTML}
                </div>

                <div class="bungalow-footer">
                    <div class="price-section">
                        <div class="price">${bungalow.price}</div>
                        <div class="price-label">Gece / Başına</div>
                    </div>
                    <a href="reservation.html" class="reserve-btn">Rezervasyon Yap</a>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => openModal(index));
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', generateBungalowCards);

function openModal(index) {
    currentBungalow = bungalows[index];
    currentSlideIndex = 0;
    
    displaySlide(0);
    
    document.getElementById('modalName').textContent = currentBungalow.name;
    
    const specsHTML = `
        <div class="modal-spec-item">
            <iconify-icon width="20" height="20" icon="mdi:people"></iconify-icon>
            <span>${currentBungalow.capacity}</span>
        </div>
        <div class="modal-spec-item">
            <iconify-icon width="20" height="20" icon="mdi:door"></iconify-icon>
            <span>${currentBungalow.bedrooms}</span>
        </div>
        <div class="modal-spec-item">
            <iconify-icon width="20" height="20" icon="mdi:shower"></iconify-icon>
            <span>${currentBungalow.bathrooms}</span>
        </div>
        <div class="modal-spec-item">
            <iconify-icon width="20" height="20" icon="mdi:ruler"></iconify-icon>
            <span>${currentBungalow.area}</span>
        </div>
    `;
    document.getElementById('modalSpecs').innerHTML = specsHTML;
    
    document.getElementById('modalDescription').textContent = currentBungalow.description;
    
    const featuresHTML = currentBungalow.features.map(feature => 
        `<div class="modal-feature-tag">${feature}</div>`
    ).join('');
    document.getElementById('modalFeatures').innerHTML = featuresHTML;
    
    document.getElementById('modalPrice').textContent = currentBungalow.price;
    
    document.getElementById('bungalowModal').classList.add('active');
}

function displaySlide(index) {
    if (!currentBungalow) return;
    
    const images = currentBungalow.images;
    const dotsContainer = document.getElementById('sliderDots');
    
    if (index >= images.length) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = images.length - 1;
    } else {
        currentSlideIndex = index;
    }
    
    document.getElementById('modalImage').src = images[currentSlideIndex];
    
    dotsContainer.innerHTML = '';
    images.forEach((img, i) => {
        const dot = document.createElement('div');
        dot.className = 'slider-dot' + (i === currentSlideIndex ? ' active' : '');
        dot.onclick = () => displaySlide(i);
        dotsContainer.appendChild(dot);
    });
}

function nextImage() {
    displaySlide(currentSlideIndex + 1);
}

function prevImage() {
    displaySlide(currentSlideIndex - 1);
}

function closeModal() {
    document.getElementById('bungalowModal').classList.remove('active');
}

function goToReservation() {
    window.location.href = 'reservation.html';
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('bungalowModal');
    if (e.target === modal) {
        closeModal();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

const galleryImages = [];
let currentLightboxIndex = 0;

function generateGallerySections() {
    const container = document.getElementById('gallerySections');
    if (!container) return;
    container.innerHTML = '';
    galleryImages.length = 0;

    bungalows.forEach(bungalow => {
        const grid = document.createElement('div');
        grid.className = 'gallery-grid gallery-grid-section';

        const coverItem = document.createElement('div');
        coverItem.className = 'gallery-item gallery-cover-item';

        const coverImg = document.createElement('img');
        coverImg.src = bungalow.images[0];
        coverImg.alt = bungalow.name;

        const coverOverlay = document.createElement('div');
        coverOverlay.className = 'gallery-item-overlay gallery-cover-overlay';
        coverOverlay.innerHTML = `<h2 class="gallery-cover-title">${bungalow.name}</h2>`;

        coverItem.appendChild(coverImg);
        coverItem.appendChild(coverOverlay);

        const coverIndex = galleryImages.length;
        galleryImages.push(bungalow.images[0]);
        coverItem.addEventListener('click', () => openLightbox(coverIndex));

        grid.appendChild(coverItem);

        bungalow.images.forEach((image, idx) => {
            if (idx > 0) {
                const item = document.createElement('div');
                item.className = 'gallery-item';

                const img = document.createElement('img');
                img.src = image;
                img.alt = bungalow.name;

                const overlay = document.createElement('div');
                overlay.className = 'gallery-item-overlay';
                overlay.innerHTML = '<iconify-icon class="gallery-item-icon" width="50" height="50" icon="solar:eye-bold"></iconify-icon>';

                item.appendChild(img);
                item.appendChild(overlay);

                const index = galleryImages.length;
                galleryImages.push(image);

                item.addEventListener('click', () => openLightbox(index));

                grid.appendChild(item);
            }
        });

        container.appendChild(grid);
    });
}

function openLightbox(index) {
    currentLightboxIndex = index;
    displayLightboxImage(index);
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function displayLightboxImage(index) {
    if (index >= galleryImages.length) {
        currentLightboxIndex = 0;
    } else if (index < 0) {
        currentLightboxIndex = galleryImages.length - 1;
    } else {
        currentLightboxIndex = index;
    }

    document.getElementById('lightboxImage').src = galleryImages[currentLightboxIndex];
    document.getElementById('lightboxCounter').textContent = 
        `${currentLightboxIndex + 1} / ${galleryImages.length}`;
}

function nextLightboxImage() {
    displayLightboxImage(currentLightboxIndex + 1);
}

function prevLightboxImage() {
    displayLightboxImage(currentLightboxIndex - 1);
}

document.addEventListener('DOMContentLoaded', generateGallerySections);

const lightboxEl = document.getElementById('lightbox');
if (lightboxEl) lightboxEl.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') {
        closeLightbox();
    }
});

document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            prevLightboxImage();
        } else if (e.key === 'ArrowRight') {
            nextLightboxImage();
        } else if (e.key === 'Escape') {
            closeLightbox();
        }
    }
});