document.addEventListener('DOMContentLoaded', function(){
    var rssShowDetailTimeout = null;
    function c(tagName){ return document.createElement(tagName); }
    items.forEach(function(item){
        if(item.type === 'html'){
            var i = c('iframe');
            i.onmouseover = function(){
                document.body.scrollTop = i.offsetTop;
            };
            i.src = 'data:text/html;base64,' + item.content;
            i.className = 'html';
            document.body.appendChild(i);
        }else if(item.type === 'rss'){
            var container = c('div');
            container.className = item.template + '_rssContainer';
            var rssItemContainer = c('div');
            rssItemContainer.className = item.template + '_rssItemContainer';
            var title = c('a');
            title.innerHTML = item.title;
            title.className = item.template + '_rssTitle';
            title.href = item.link;
            title.target = item.title;
            item.content.forEach(function(rssItem){
                var articleDetail = c('div');
                articleDetail.className = item.template + '_rssDetail';
                var articleTitle = c('a');
                articleTitle.innerHTML = rssItem.title;
                articleTitle.className = item.template + '_rssArticleTitle';
                articleTitle.href = rssItem.link;
                if(item.options.expanded){
                    articleDetail.innerHTML = rssItem.description;
                }else{
                    clearTimeout(rssShowDetailTimeout);
                    articleTitle.addEventListener('mouseover', function(){
                        rssShowDetailTimeout = setTimeout(function(){
                            if (item.options.scrapeLink) {
                                var xhr = new XMLHttpRequest();
                                xhr.onload = function () {
                                    var i = c('iframe');
                                    i.src = 'data:text/html;base64,' + this.responseText;
                                    i.className = 'subhtml';
                                    articleDetail.innerHTML = '';
                                    articleDetail.appendChild(i);
                                };
                                xhr.open("get", "/proxy", true);
                                xhr.setRequestHeader("x-get-url", rssItem.link);
                                xhr.setRequestHeader("x-item-title", item.title);
                                xhr.send();
                            } else {
                                articleDetail.innerHTML = rssItem.description;
                            }
                        }, 700);
                    }, true);
                    articleTitle.addEventListener('mouseout', function(){
                        clearTimeout(rssShowDetailTimeout);
                    }, true);
                }
                rssItemContainer.appendChild(articleTitle);
                rssItemContainer.appendChild(articleDetail);
            });
            container.appendChild(title);
            container.appendChild(rssItemContainer);
            document.body.appendChild(container);
        }
    });
});