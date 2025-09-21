// 實驗性 Masonry 圖片加載模組
class MasonryImageLoader {
    constructor(galleryElement, dataLoader) {
        this.galleryElement = galleryElement;
        this.dataLoader = dataLoader;
        this.imagesPerLoad = 10;
        this.currentIndex = 0;
        this.imagesLoadedCount = 0;
        this.currentTag = 'all';
        this.isScrollLoading = false;
        this.loadedImageUrls = new Set();
        this.lightGallery = null;
        this.masonry = null;

        this.init();
    }

    init() {
        this.setupMasonry();
        this.setupScrollListener();
        this.setupResizeListener();
        this.initLightGallery();
    }

    setupMasonry() {
        // 啟用 Masonry 模式
        this.galleryElement.classList.add('masonry-enabled');

        // 創建 grid-sizer 元素
        const gridSizer = document.createElement('div');
        gridSizer.className = 'grid-sizer';
        this.galleryElement.appendChild(gridSizer);

        // 初始化 Masonry
        this.masonry = new Masonry(this.galleryElement, {
            itemSelector: 'img',
            columnWidth: '.grid-sizer',
            percentPosition: true,
            gutter: 8 // 0.8em converted to pixels approximately
        });

        console.log('Masonry 初始化完成');
    }

    initLightGallery() {
        // 初始化 lightGallery
        if (this.lightGallery) {
            this.lightGallery.destroy(true);
        }

        this.lightGallery = lightGallery(this.galleryElement, {
            plugins: [lgZoom, lgHash, lgThumbnail],
            selector: 'img',
            speed: 400,
            hideBarsDelay: 2000,
            download: false,
            counter: true,
            closeOnTap: true,
            slideDelay: 400,
            preload: 2,
            showAfterLoad: true,
            elementClassNames: {
                slide: 'lg-slide',
                outer: 'lg-outer lg-dark-mode'
            },
            // Hash plugin settings
            hash: true,
            galleryId: 'ljy-gallery',
            // Thumbnails plugin settings
            thumbnail: true,
            animateThumb: true,
            currentPagerPosition: 0,
            thumbWidth: 100,
            thumbHeight: '80px',
            thumbMargin: 5,
            toggleThumb: true,
            enableThumbDrag: true,
            enableThumbSwipe: true,
            // Zoom plugin settings
            zoom: true,
            scale: 1.2,
            enableZoomAfter: 0,
            actualSize: true,
            zoomFromOrigin: false,
            showZoomInOutIcons: true,
            actualSizeIcons: {
                zoomIn: 'lg-zoom-in',
                zoomOut: 'lg-zoom-out'
            }
        });

        // 添加事件監聽器
        this.galleryElement.addEventListener('lgAfterSlide', (event) => {
            this.enforceImageAspectRatio();
            this.fixThumbnailSrc();
        });

        this.galleryElement.addEventListener('lgAfterOpen', (event) => {
            this.enforceImageAspectRatio();
            this.fixThumbnailSrc();
        });
    }

    // 強制保持圖片正確比例
    enforceImageAspectRatio() {
        setTimeout(() => {
            const lgImage = document.querySelector('.lg-outer .lg-current picture.lg-img-wrap .lg-object.lg-image');
            if (lgImage) {
                lgImage.style.setProperty('width', 'auto', 'important');
                lgImage.style.setProperty('height', 'auto', 'important');
                lgImage.style.setProperty('max-width', '90vw', 'important');
                lgImage.style.setProperty('max-height', '90vh', 'important');
                lgImage.style.setProperty('object-fit', 'contain', 'important');
                console.log('強制應用圖片比例保持樣式 - Masonry版本');
            }
        }, 100);
    }

    // 修復縮略圖src屬性
    fixThumbnailSrc() {
        setTimeout(() => {
            const galleryImages = document.querySelectorAll('.gallery img');
            const thumbnails = document.querySelectorAll('.lg-thumb-item img');

            galleryImages.forEach((img, index) => {
                const thumbSrc = img.getAttribute('data-thumb');
                if (thumbnails[index] && thumbSrc) {
                    thumbnails[index].src = thumbSrc;
                }
            });
        }, 200);
    }

    setupScrollListener() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(() => {
                this.checkIfMoreImagesNeeded();
            }, 100);
        });
    }

    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                this.updateImagesPerLoad();
                if (this.masonry) {
                    this.masonry.layout();
                }
            }, 250);
        });
    }

    updateImagesPerLoad() {
        const width = window.innerWidth;
        if (width < 600) {
            this.imagesPerLoad = 8;
        } else if (width < 900) {
            this.imagesPerLoad = 12;
        } else if (width < 1200) {
            this.imagesPerLoad = 16;
        } else if (width < 1500) {
            this.imagesPerLoad = 20;
        } else {
            this.imagesPerLoad = 24;
        }
    }

    checkIfMoreImagesNeeded() {
        const viewportHeight = window.innerHeight;
        const scrollPosition = window.scrollY + viewportHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // 當接近底部時載入更多圖片
        if (scrollPosition >= documentHeight - viewportHeight * 0.5) {
            this.loadNextImages(this.currentTag);
        }
    }

    loadNextImages(tag = 'all') {
        if (this.isScrollLoading) return;

        const imagesToLoad = this.getCurrentImages().filter(img => {
            return (tag === 'all' || img.category === tag) &&
                   !this.loadedImageUrls.has(img.preview);
        }).slice(this.currentIndex, this.currentIndex + this.imagesPerLoad);

        if (imagesToLoad.length === 0) {
            console.log('沒有更多圖片可載入');
            return;
        }

        this.isScrollLoading = true;
        console.log(`載入 ${imagesToLoad.length} 張圖片 (Masonry版本)`);

        const loadSingleImage = (index) => {
            if (index >= imagesToLoad.length) {
                this.isScrollLoading = false;
                console.log('本批次圖片載入完成 (Masonry)');
                return;
            }

            const imageData = imagesToLoad[index];
            const img = document.createElement('img');

            img.onload = () => {
                // 設置 lightGallery 所需的屬性
                img.setAttribute('data-src', imageData.original);
                img.setAttribute('data-sub-html', `<h4>${imageData.name}</h4>`);
                img.setAttribute('data-thumb', imageData.preview);

                // 獲取原圖尺寸並設置 data-lg-size 屬性
                this.getImageDimensions(imageData.original).then(dimensions => {
                    if (dimensions) {
                        img.setAttribute('data-lg-size', `${dimensions.width}-${dimensions.height}`);
                    }
                }).catch(error => {
                    console.warn('無法獲取圖片尺寸:', imageData.original, error);
                });

                // 添加圖片到 gallery
                this.galleryElement.appendChild(img);
                this.loadedImageUrls.add(imageData.preview);

                // 使用 imagesLoaded 確保圖片完全載入後再更新 Masonry
                imagesLoaded(img, () => {
                    // 添加載入動畫
                    setTimeout(() => {
                        img.classList.add('loaded');
                    }, 10);

                    // 更新 Masonry 佈局
                    this.masonry.appended(img);
                    this.masonry.layout();

                    // 刷新 lightGallery
                    this.refreshLightGallery();

                    // 載入下一張圖片
                    this.currentIndex++;
                    this.imagesLoadedCount++;
                    loadSingleImage(index + 1);
                });
            };

            img.onerror = () => {
                console.error('圖片載入失敗:', imageData.preview);
                loadSingleImage(index + 1);
            };

            img.src = imageData.preview;
            img.alt = imageData.name || 'Gallery Image';
            img.dataset.original = imageData.original;
            img.dataset.preview = imageData.preview;
            img.dataset.category = imageData.category || 'unknown';
        };

        loadSingleImage(0);
    }

    filterImages(tag) {
        console.log(`篩選圖片: ${tag} (Masonry版本)`);
        this.currentTag = tag;
        this.currentIndex = 0;
        this.imagesLoadedCount = 0;
        this.loadedImageUrls.clear();

        // 清除現有圖片，保留 grid-sizer
        const images = this.galleryElement.querySelectorAll('img');
        images.forEach(img => img.remove());

        // 重新初始化 Masonry
        if (this.masonry) {
            this.masonry.destroy();
        }
        this.setupMasonry();

        // 載入新的圖片
        this.loadNextImages(tag);
    }

    getCurrentImages() {
        return this.dataLoader.getAllImages();
    }

    refreshLightGallery() {
        if (this.lightGallery) {
            this.lightGallery.refresh();
        }
    }

    // 獲取圖片尺寸
    async getImageDimensions(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                resolve({
                    width: this.naturalWidth,
                    height: this.naturalHeight
                });
            };
            img.onerror = function() {
                reject(new Error('圖片加載失敗'));
            };
            img.src = imageUrl;
        });
    }

    setGalleryMarginTop() {
        // 與原版本保持一致
        const header = document.querySelector('header');
        const tagFilter = document.querySelector('.tag-filter-vertical');

        let totalHeight = 0;
        if (header) totalHeight += header.offsetHeight;
        if (tagFilter && window.getComputedStyle(tagFilter).display !== 'none') {
            totalHeight += tagFilter.offsetHeight;
        }

        totalHeight += 40; // 額外間距
        this.galleryElement.style.marginTop = `${totalHeight}px`;
    }
}

// 導出為全局變數
window.MasonryImageLoader = MasonryImageLoader;