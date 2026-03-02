// 全局变量
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
// 保存首次打开时的视图状态（用于 reset）
let initialScale = null;
let initialOffsetX = null;
let initialOffsetY = null;
let startX, startY;

// 获取元素
const mapContainer = document.getElementById('map-container');
const subwayMap = document.getElementById('subway-map');
const textDisplay = document.getElementById('text-display');


// 初始化显示内容（维护者输入的文字内容）
function initializeTextContent() {
    textDisplay.innerHTML = `
        <h3>鲤鱼交通集团简介：</h3>
        <p>鲤鱼交通集团成立于2025年5月20日，是服务器内的第三家有独立运营能力的公司。</p>
        <p>运营线路有α、β、A、B、C、D线，服务于鲤城和鲤湖湾州，以及一条带有市域性质的γ线，该线路联通都会地区、第一城、第二城、铜钿城和梅友机场。</p>
        <p>另有一条借道鲤城南铁路的中心线，是连接鲤城和鲤湖湾州的重要铁路线路。</p>
    `;
}


// 鼠标按下事件（开始拖拽）
mapContainer.addEventListener('mousedown', function(e) {
    // 仅在容器内有效
    const rect = mapContainer.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    mapContainer.style.cursor = 'grabbing';
    e.preventDefault();
});

// 全局鼠标移动事件（解决鼠标移出容器的问题）
document.addEventListener('mousemove', function(e) {
    if (isDragging) {
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;

    // 应用变换（translate 在 scale 前）
            subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            // 仅在首次设置时保存初始视图，用于 reset 恢复到第一次打开的样子
            if (initialScale === null) {
                initialScale = scale;
                initialOffsetX = offsetX;
                initialOffsetY = offsetY;
            }
    }
});

// 全局鼠标释放事件（确保在任何地方松开鼠标都能停止拖拽）
document.addEventListener('mouseup', function() {
    if (isDragging) {
        isDragging = false;
        mapContainer.style.cursor = 'grab';
    }
});

// 防止在拖拽过程中选择文本
document.addEventListener('selectstart', function(e) {
    if (isDragging) {
        e.preventDefault();
    }
});

// 滚轮缩放功能（仅在矩形框内生效，以鼠标为原点进行缩放）
mapContainer.addEventListener('wheel', function(e) {
    // 只有鼠标在矩形框内时才执行缩放；阻止页面默认滚动
    const rect = mapContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (!(mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height)) return;

    e.preventDefault();

    // 保存当前缩放前的缩放比例
    const oldScale = scale;

    // 计算新的缩放比例
    const delta = e.deltaY < 0 ? 1.1 : 0.9; // 放大或缩小比例
    scale = Math.max(0.1, Math.min(scale * delta, 5)); // 限制在0.1-5之间

    // 关键：保持鼠标下的页面像素在视觉上不动。
    // 计算鼠标在图片坐标系（未变换前）中的位置：
    // imagePoint = (mouse - offset) / oldScale
    const imgX = (mouseX - offsetX) / oldScale;
    const imgY = (mouseY - offsetY) / oldScale;

    // 缩放后新的偏移，使得 imgPoint 在屏幕上的位置仍然等于 mouse
    offsetX = mouseX - imgX * scale;
    offsetY = mouseY - imgY * scale;

    // 应用变换
    subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
});

// 缩放函数 - 以容器中心为中心进行缩放
function zoomIn() {
    // 以容器中心为缩放点
    const rect = mapContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const oldScale = scale;
    scale = Math.min(scale * 1.2, 5);

    // 使用与 wheel 相同的公式：先把屏幕点转换到图片点，再计算新的 offset
    const imgX = (centerX - offsetX) / oldScale;
    const imgY = (centerY - offsetY) / oldScale;

    offsetX = centerX - imgX * scale;
    offsetY = centerY - imgY * scale;

    subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function zoomOut() {
    const rect = mapContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const oldScale = scale;
    scale = Math.max(scale * 0.8, 0.1);

    const imgX = (centerX - offsetX) / oldScale;
    const imgY = (centerY - offsetY) / oldScale;

    offsetX = centerX - imgX * scale;
    offsetY = centerY - imgY * scale;

    subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function resetView() {
    // 重新居中并重置缩放
    scale = 1;
    // 计算居中时的 offset，使图片在容器中居中
    const rect = mapContainer.getBoundingClientRect();
    const imgW = subwayMap.naturalWidth;
    const imgH = subwayMap.naturalHeight;

    // 如果图片尚未加载，直接置为0
    if (!imgW || !imgH) {
        offsetX = 0;
        offsetY = 0;
    } else {
        offsetX = (rect.width - imgW) / 2;
        offsetY = (rect.height - imgH) / 2;
    }

    subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeTextContent();
    // 当图片加载后，初始化其位置以居中显示
    if (subwayMap.complete) {
        // 图片已经加载 — 计算初始 scale 使整张图片完整可见并居中
        const rect = mapContainer.getBoundingClientRect();
        const imgW = subwayMap.naturalWidth;
        const imgH = subwayMap.naturalHeight;

        if (!imgW || !imgH) {
            // 如果无法获取尺寸，回退到原有居中逻辑
            scale = 1;
            offsetX = (rect.width - imgW) / 2;
            offsetY = (rect.height - imgH) / 2;
        } else {
            // 计算能完整显示图片的 scale（不强制不放大），并限制到允许范围
            const fitScale = Math.min(rect.width / imgW, rect.height / imgH);
            scale = Math.max(0.1, Math.min(fitScale, 5));
            offsetX = (rect.width - imgW * scale) / 2;
            offsetY = (rect.height - imgH * scale) / 2;
        }

        subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    } else {
        subwayMap.addEventListener('load', function() {
            const rect = mapContainer.getBoundingClientRect();
            const imgW = subwayMap.naturalWidth;
            const imgH = subwayMap.naturalHeight;

            if (!imgW || !imgH) {
                scale = 1;
                offsetX = (rect.width - imgW) / 2;
                offsetY = (rect.height - imgH) / 2;
            } else {
                const fitScale = Math.min(rect.width / imgW, rect.height / imgH);
                scale = Math.max(0.1, Math.min(fitScale, 5));
                offsetX = (rect.width - imgW * scale) / 2;
                offsetY = (rect.height - imgH * scale) / 2;
            }

            subwayMap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        });
    }
});


