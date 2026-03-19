// 微信公众号排版工具 - Chrome 插件

const input = document.getElementById('input');
const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const notification = document.getElementById('notification');

// 实时预览
input.addEventListener('input', updatePreview);
input.addEventListener('paste', () => {
    setTimeout(updatePreview, 10);
});

function updatePreview() {
    const text = input.value.trim();
    if (text) {
        const html = parseContent(text);
        preview.innerHTML = html;
    } else {
        preview.innerHTML = '<p style="color: #999; text-align: center; margin-top: 80px;">输入内容 → 预览效果</p>';
    }
}

// 内容解析
function parseContent(text) {
    if (text.includes('<') && text.includes('>')) {
        return sanitizeHTML(text);
    }
    return parseMarkdown(text);
}

// Markdown 解析
function parseMarkdown(text) {
    let html = text;
    
    // 转义
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 标题
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    
    // 分割线
    html = html.replace(/^---+$/gm, '<hr>');
    html = html.replace(/^\*\*\*+$/gm, '<hr>');
    
    // 引用
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 粗体斜体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 链接
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    
    // 列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\.\s*(.+)$/gm, '<li>$2</li>');
    
    // 合并 li
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
        const items = match.trim().split('\n').map(li => li.replace(/<\/?li>/g, ''));
        return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
    });
    
    // 段落
    const lines = html.split('\n');
    const paragraphs = [];
    let currentParagraph = [];
    
    for (let line of lines) {
        const isBlock = /^<(h[1-3]|blockquote|pre|ul|ol|li|hr)/.test(line.trim()) || 
                        /<\/(h[1-3]|blockquote|pre|ul|ol|li)>$/.test(line.trim()) ||
                        line.trim() === '<hr>';
        
        if (isBlock || line.trim() === '') {
            if (currentParagraph.length > 0) {
                paragraphs.push('<p>' + currentParagraph.join(' ') + '</p>');
                currentParagraph = [];
            }
            if (line.trim() !== '') paragraphs.push(line);
        } else {
            currentParagraph.push(line);
        }
    }
    
    if (currentParagraph.length > 0) {
        paragraphs.push('<p>' + currentParagraph.join(' ') + '</p>');
    }
    
    return paragraphs.join('\n');
}

// HTML 安全处理
function sanitizeHTML(html) {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/on\w+="[^"]*"/gi, '')
               .replace(/on\w+='[^']*'/gi, '')
               .replace(/javascript:/gi, '');
}

// 复制
copyBtn.addEventListener('click', async () => {
    const html = preview.innerHTML;
    
    try {
        await navigator.clipboard.write([
            new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([preview.innerText], { type: 'text/plain' })
            })
        ]);
        showNotification('已复制到剪贴板！');
    } catch (e) {
        navigator.clipboard.writeText(preview.innerText).then(() => {
            showNotification('已复制纯文本');
        });
    }
});

clearBtn.addEventListener('click', () => {
    input.value = '';
    updatePreview();
});

function showNotification(msg) {
    notification.textContent = msg;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 2000);
}

// 初始化
updatePreview();
