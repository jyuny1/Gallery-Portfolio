// 主画廊模块
class Gallery {
    constructor() {
        this.dataLoader = new DataLoader();
        this.autoScroll = new AutoScroll();
        this.tagFilter = null;
        this.imageLoader = null;
        this.isPageLoading = true;
        this.lastWidth = window.innerWidth;

        this.init();
    }

    async init() {
        // 等待页面加载完成
        window.addEventListener('load', () => {
            this.isPageLoading = false;
        });

        // 监听浏览器前进后退按钮
        window.addEventListener('popstate', () => {
            // 确保 tagFilter 初始化后再处理 URL
            setTimeout(() => this.handleUrlParams(), 0);
        });

        // 加载图片数据
        await this.dataLoader.loadGalleryData();

        // 初始化组件（包括 tagFilter）
        this.initComponents();

        // 设置自动滚动按钮显示逻辑
        this.autoScroll.setupScrollButtonVisibility();

        // 处理 URL 参数（此时 tagFilter 已准备好）
        this.handleUrlParams();

        // 初始加载
        this.loadInitialImages();
    }

    initComponents() {
        const galleryElement = document.getElementById('gallery');

        // 使用 Masonry 作為主要佈局系統
        console.log('🎯 使用 Masonry 佈局系統');
        this.imageLoader = new ImageLoader(galleryElement, this.dataLoader);

        // 初始化标签筛选器
        this.tagFilter = new TagFilter((tag) => {
            this.imageLoader.filterImages(tag);
            this.updateUrlForTag(tag);
        });

        // 创建标签筛选器
        const categories = this.dataLoader.getCategories();
        this.tagFilter.createTagFilter(categories);

        // lightGallery events are handled automatically

        // 设置gallery的margin-top
        this.imageLoader.setGalleryMarginTop();
    }

    // 处理URL参数
    handleUrlParams() {
        if (!this.tagFilter || typeof this.tagFilter.selectTagByValue !== 'function') {
            console.warn('tagFilter 尚未初始化，跳过 handleUrlParams');
            return;
        }

        const path = window.location.pathname;
        const tagFromUrl = path.substring(1); // 移除开头的斜杠

        console.log('处理URL参数:', { path, tagFromUrl });

        if (tagFromUrl && tagFromUrl !== '') {
            const categories = this.dataLoader.getCategories();
            console.log('可用标签:', categories);

            if (categories.includes(tagFromUrl)) {
                console.log('找到匹配的标签:', tagFromUrl);
                this.tagFilter.selectTagByValue(tagFromUrl);
                this.imageLoader.filterImages(tagFromUrl);
            } else {
                console.log('标签不存在:', tagFromUrl);
                if (this.tagFilter.getCurrentTag() !== 'all') {
                    this.tagFilter.selectTagByValue('all');
                    this.imageLoader.filterImages('all');
                }
            }
        } else {
            console.log('URL中没有标签参数，选择All标签');
            if (this.tagFilter.getCurrentTag() !== 'all') {
                this.tagFilter.selectTagByValue('all');
                this.imageLoader.filterImages('all');
            }
        }
    }

    // 更新URL
    updateUrlForTag(tag) {
        console.log('更新URL为标签:', tag);

        if (tag === 'all') {
            if (window.location.pathname !== '/') {
                console.log('移除URL中的标签参数');
                window.history.pushState({}, '', '/');
            }
        } else {
            const newUrl = `/${tag}`;
            if (window.location.pathname !== newUrl) {
                console.log('更新URL为:', newUrl);
                window.history.pushState({}, '', newUrl);
            }
        }
    }

    loadInitialImages() {
        if (this.tagFilter.getCurrentTag() === 'all') {
            this.imageLoader.filterImages('all');
        }

        setTimeout(() => {
            this.imageLoader.checkIfMoreImagesNeeded();
        }, 500);
    }
}

// 页面加载完成后初始化画廊
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new Gallery();
});
