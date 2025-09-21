document.addEventListener('DOMContentLoaded', () => {


    // 强制设置为深色模式
    document.body.classList.add('dark');

    // Add footer dynamically
    const footer = document.createElement('footer');
    const currentYear = new Date().getFullYear();
    footer.innerHTML = `<p>© ${currentYear} LJY Photography All Rights Reserved</p>`;
    document.body.appendChild(footer);

    // Add loaded class to images after window load to enable hover effect
    window.addEventListener('load', () => {
        const images = document.querySelectorAll('.gallery img');
        images.forEach(img => {
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => img.classList.add('loaded'));
            }
        });
        document.querySelector('footer').style.opacity = '1'; // 显示底栏
        
    });
});
