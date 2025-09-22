// Masonry 圖片加載模組
class ImageLoader {
    constructor(galleryElement, dataLoader) {
        this.galleryElement = galleryElement;
        this.dataLoader = dataLoader;
        this.imagesPerLoad = 10;
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
        // Masonry 100% 自動佈局 - 讓 Masonry 完全控制容器寬度和圖片排列
        this.masonry = new Masonry(this.galleryElement, {
            itemSelector: 'img',
            columnWidth: 200, // 設置列寬與圖片寬度一致
            gutter: 8,
            fitWidth: true,    // 讓 Masonry 自動計算容器寬度
            initLayout: false  // 手動控制初始化時機
        });

        console.log('Masonry 100% 自動佈局初始化完成 - Masonry 控制容器寬度');
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
                // Masonry percentPosition 自動處理響應式，只需觸發重新佈局
                if (this.masonry) {
                    this.masonry.layout();
                    console.log('螢幕尺寸改變 - Masonry 自動重新佈局');
                }
                this.updateImagesPerLoad();
            }, 250);
        });
    }

    updateImagesPerLoad() {
        // 僅根據螢幕寬度調整加載性能，讓 Masonry 自動決定佈局
        const width = window.innerWidth;
        if (width < 600) {
            this.imagesPerLoad = 8;   // 移動設備：較少加載
        } else if (width < 900) {
            this.imagesPerLoad = 12;  // 平板：中等加載
        } else if (width < 1200) {
            this.imagesPerLoad = 16;  // 小桌面：較多加載
        } else if (width < 1500) {
            this.imagesPerLoad = 20;  // 大桌面：更多加載
        } else {
            this.imagesPerLoad = 24;  // 超大螢幕：最多加載
        }
    }

    checkIfMoreImagesNeeded() {
        const viewportHeight = window.innerHeight;
        const scrollPosition = window.scrollY + viewportHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const totalImages = this.dataLoader.getAllImages().length;
        const remainingImages = totalImages - this.imagesLoadedCount;

        console.log(`🔍 滾動檢查:`, {
            viewportHeight,
            scrollPosition,
            documentHeight,
            已載入圖片: this.imagesLoadedCount,
            總圖片數: totalImages,
            剩餘圖片: remainingImages,
            觸發條件: scrollPosition >= documentHeight - viewportHeight * 0.5
        });

        // 如果還有圖片未載入，且滿足以下任一條件就觸發載入：
        // 1. 接近底部 (原始邏輯)
        // 2. 已載入圖片數少於總數的 80%
        // 3. 文檔高度較小時 (內容不夠長無法觸發滾動)
        const shouldLoadMore = remainingImages > 0 && (
            scrollPosition >= documentHeight - viewportHeight * 0.5 ||
            this.imagesLoadedCount < totalImages * 0.8 ||
            documentHeight < viewportHeight * 2
        );

        if (shouldLoadMore) {
            console.log(`🚀 觸發載入更多圖片: 剩餘 ${remainingImages} 張`);
            this.loadNextImages(this.currentTag);
        } else if (remainingImages === 0) {
            console.log('✅ 所有圖片已載入完成');
        }
    }

    loadNextImages(tag = 'all') {
        if (this.isScrollLoading) {
            console.log('⏳ 圖片載入中，跳過重複請求');
            return;
        }

        const allAvailableImages = this.getCurrentImages().filter(img => {
            return (tag === 'all' || img.category === tag) &&
                   !this.loadedImageUrls.has(img.preview);
        });

        // 修復：從可用圖片數組的開頭取出需要的數量，而不是使用 currentIndex
        const imagesToLoad = allAvailableImages.slice(0, this.imagesPerLoad);

        console.log(`🔍 載入狀態檢查:`, {
            總圖片數: this.getCurrentImages().length,
            當前標籤: tag,
            已載入: this.imagesLoadedCount,
            可載入圖片數: allAvailableImages.length,
            本批次載入: imagesToLoad.length,
            每批次大小: this.imagesPerLoad
        });

        if (imagesToLoad.length === 0) {
            console.log('✅ 沒有更多圖片可載入');
            this.isScrollLoading = false; // 確保標記被重置
            return;
        }

        this.isScrollLoading = true;
        console.log(`🚀 開始載入 ${imagesToLoad.length} 張圖片 (Masonry版本)`);

        const loadSingleImage = (index) => {
            if (index >= imagesToLoad.length) {
                this.isScrollLoading = false;
                console.log(`✅ 本批次圖片載入完成 (Masonry) - 總計已載入 ${this.imagesLoadedCount} 張`);
                return;
            }

            const imageData = imagesToLoad[index];
            console.log(`📷 載入圖片 ${index + 1}/${imagesToLoad.length}: ${imageData.name}`);

            // 先預加載圖片，不立即添加到 DOM
            const preloadImg = new Image();

            // 設置超時機制防止卡住
            const loadTimeout = setTimeout(() => {
                console.warn(`⏰ 圖片載入超時: ${imageData.preview}`);
                preloadImg.onload = null;
                preloadImg.onerror = null;
                // 跳過該圖片，繼續載入下一張
                loadSingleImage(index + 1);
            }, 10000); // 10秒超時

            preloadImg.onload = () => {
                clearTimeout(loadTimeout);
                console.log(`✅ 圖片預載入成功: ${imageData.name}`);

                // 圖片預加載完成後，創建 DOM 元素
                const img = document.createElement('img');

                // 設置基本屬性
                img.src = imageData.preview;
                img.alt = imageData.name || 'Gallery Image';
                img.dataset.original = imageData.original;
                img.dataset.preview = imageData.preview;
                img.dataset.category = imageData.category || 'unknown';

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

                // 添加圖片到 gallery (此時圖片已預加載完成)
                this.galleryElement.appendChild(img);
                this.loadedImageUrls.add(imageData.preview);

                // 使用 imagesLoaded 確保 DOM 中的圖片完全載入後再更新 Masonry
                imagesLoaded(img, () => {
                    // Masonry 佈局更新 - 圖片已在正確尺寸下
                    this.masonry.reloadItems();
                    this.masonry.layout();

                    // 添加載入動畫效果
                    setTimeout(() => {
                        img.classList.add('loaded');
                    }, 50); // 稍微延遲確保 Masonry 佈局完成

                    // 刷新 lightGallery
                    this.refreshLightGallery();

                    // 載入下一張圖片
                    this.imagesLoadedCount++;
                    console.log(`📊 進度更新: ${this.imagesLoadedCount} 張已載入`);
                    loadSingleImage(index + 1);
                });
            };

            preloadImg.onerror = () => {
                clearTimeout(loadTimeout);
                console.error(`❌ 圖片載入失敗: ${imageData.preview}`);
                // 即使載入失敗也要繼續下一張
                loadSingleImage(index + 1);
            };

            // 開始預加載圖片
            preloadImg.src = imageData.preview;
        };

        loadSingleImage(0);
    }

    filterImages(tag) {
        console.log(`篩選圖片: ${tag} (Masonry 100% 自動佈局)`);
        this.currentTag = tag;
        this.imagesLoadedCount = 0;
        this.loadedImageUrls.clear();

        // 清除現有圖片
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
        // 簡化版本 - 只考慮 header 高度
        const header = document.querySelector('header');
        let totalHeight = 0;

        if (header) totalHeight += header.offsetHeight;
        totalHeight += 40; // 額外間距

        this.galleryElement.style.marginTop = `${totalHeight}px`;
    }
}

// 導出為全局變數
window.ImageLoader = ImageLoader;