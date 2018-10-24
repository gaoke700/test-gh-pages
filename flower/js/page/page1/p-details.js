define(function (require, exports, module) {
    //模块
    var dialogSecondary = require('js/common/plug/dialog');//弹窗
    var CommentList = require('js/modules/m-comments-list'); //评论
    var auxiliary = require('js/common/auxiliary');//公用的

    //页面级别的dom
    var pageDetails = $('.page-details');
    var detailsTabs = pageDetails.find('.details-tabs');
    var detailsMine = pageDetails.find('.details-mine');
    var goodsInfo = pageDetails.find('.goods-info');
    var goodsDetails = pageDetails.find('.goods-details');
    var goodsComments = pageDetails.find('.goods-comments');
    var detailsHeader = pageDetails.find('.details-header');
    var goodsId = goodsInfo.attr('goods-id');
    var actId = goodsInfo.attr('act-id'); //秒杀提醒我用到了，可不可以改为goodsId
    var isPc = base.utils.isPc();
    var detailsData = '';
    var currentStandard = '';

    //点击导航我的切换
    detailsHeader.on('touchend', '.mine', function (event) {
        if (isPc) {
            dialogSecondary.dialogPrompt1({
                content: '请在手机中扫码查看'
            });
            return false;
        }
        if ($('.details-mine').hasClass('none')) {
            $('.details-mine').removeClass('none');
        } else {
            $('.details-mine').addClass('none');
        }
        event.preventDefault();
    });
    document.onclick = function (event) {
        if (!event.target.classList.contains('js-in-mine')) {
            $('.details-mine').addClass('none');
        }
    };

    //头部切换效果
    detailsHeader.on('touchend', '.details-tabs li', function (event) {
        if ($(this).hasClass('can-active')) {
            detailsHeader.find('.details-tabs li a').removeClass('active');
            $(this).find('a').addClass('active');

            pageDetails.find('.operate-none').addClass('none');
            if ($(this).hasClass('product-info')) {
                goodsInfo.removeClass('none');
                document.body.scrollTop = 0;
                event.preventDefault();
            } else if ($(this).hasClass('product-details')) {
                goodsInfo.removeClass('none');
            } else if ($(this).hasClass('comments')) {
                goodsComments.removeClass('none');
                document.body.scrollTop = 0;
                event.preventDefault();
            }
        }
    });

    //轮播图
    var autoPlay = $('.bd li').length;
    if (autoPlay > 1) {
        $('#TabBoxImg .pageState').removeClass('none');
        require.async(['js/common/plug/touch_slide'], function (TouchSlide) {  //轮播
            TouchSlide({
                slideCell: "#TabBoxImg",
                titCell: ".hd ul", //开启自动分页 autoPage:true ，此时设置 titCell 为导航元素包裹层
                mainCell: ".bd ul",
                effect: "leftLoop",
                autoPage: '<li><a></a></li>',
                delayTime: 500,
                interTime: 4000,
                autoPlay: true, //自动播放
                pageStateCell: ".pageState"
            });
        });
    }


    //秒杀底部按钮-提醒我
    $('.js-set-remind').on('tap', function () {
        var _this = $(this);
        $.ajax({
            type: "post",
            url: "index.php?seckill-doRemind.html",
            data: {act_id: actId},
            dataType: 'json',
            success: function (data) {
                if (data.res == 'succ') {
                    dialogSecondary.dialogPrompt1({time: 3000, content: data.msg});
                    $('.has-set-remind').removeClass('none');
                    _this.addClass('none');
                } else {
                    data.data ? dialogSecondary.dialogCustom1({
                        iconName: 'icons-gantanhao',
                        content: data.msg,
                        okCallback: function () {
                            //确认去绑手机号...
                            window.location.href = "index.php?member-verifyMobile.html";
                        }
                    }) : dialogSecondary.dialogPrompt1({time: 3000, content: data.msg});
                }
            }
        });
    });

    //渲染秒杀结构
    var renderSeckillDom = function (v) {
        var seckillMsg = v.seckillMsg;
        var gprices = v.gprices;
        let doms = ``;
        if (v.goods_store == 0) {
            //所有商品库存为0时让选择规格不可点
            doms = `
				<div class="seckill rush-out">
					<div class="seckill-out">商品已抢光</div>
				</div>`.trim();
        } else if (seckillMsg.act_status == 'beginning' || seckillMsg.act_status == 'preheat') {
            var times = base.secondsToDate({seconds: seckillMsg.begin_time});
            doms = `
				<div class="seckill">
					<div class="seckill-price">￥<span>${currentStandard.sec_price}</span></div>
					<div class="want-buy">
						<div class="market-price">￥<span>${gprices}</span></div>
					</div>
					<div class="times">
						<div class="away-time">
							<span>距结束</span>
							<i class="days">00</i>天<i class="hours">00</i>时<i class="minutes">00</i>分<i class="seconds">00</i>秒
						</div>
						<div class="progress-bottom">
							<div class="when-to-rush">今天<i>${times.hour}:${times.minu}</i>开抢</div>
						</div>
					</div>
				</div>`.trim();
        } else if (seckillMsg.act_status == 'running') {
            doms = `
				<div class="seckill running seckill-js">
					<div class="seckill-price">￥<span>${currentStandard.sec_price}</span></div>
					<div class="want-buy">
						<div class="market-price">￥<span>${gprices}</span></div>
					</div>
					<div class="times">
						<div class="away-time">
							<span>距结束</span>
							<i class="days">00</i>天<i class="hours">00</i>时<i class="minutes">00</i>分<i class="seconds">00</i>秒
						</div>
						<div class="progress-bottom">
							<div class="progress-top"></div>
						</div>
					</div>
				</div>`.trim();
        }
        return doms;
    };

    //获取商品信息
    $.ajax({
        url: "openapi.php?act=getGoodsInfos&goods_id=" + goodsId,
        type: "get",
        async: true,
        dataType: 'json',
        success: function (v) {
            detailsData = v || '';  //此行给弹窗用
            //修改规格和价格
            var data = detailsData.result || {};

            if(data.cartnum != 0){  //购物车数量
                $('.js-cart i').removeClass('none').html(data.cartnum)
            }

            currentStandard = data.product[0] || {};
            $.each(data.product,function (ind,val) {
                if(val.defaultselect){
                    currentStandard = val;
                    return false;
                }
            });

            $('body').find('.select-standard .content').html(currentStandard.text);//初值显示第一个规格
            if(currentStandard.isMPrice){
                $('body').find('.price .vipPrice').removeClass('none');
            }
            $('body').find('.price big').html(currentStandard.price);

            //判断秒杀
            if (data.goodsType == 'secKill') {
                //隐藏普通商品价格
                $('.goods-message').find('.price').addClass('none');
                //添加秒杀结构
                let doms = renderSeckillDom(data);
                $('.goods-info .goods-message').before(doms);

                if (data.goods_store == 0) {
                    $('.goods-message').find('.price').removeClass('none');
                } else if (data.seckillMsg.act_status == 'running') {  //马上抢
                    //进度条
                    var alltime = data.seckillMsg.end_time - data.seckillMsg.begin_time;
                    //倒计时
                    base.timeCountDown({
                        seconds: data.seckillMsg.countDown,
                        runCallback: function (obj) {
                            $('.times').find('.days').html(obj.d);
                            $('.times').find('.hours').html(obj.h);
                            $('.times').find('.minutes').html(obj.m);
                            $('.times').find('.seconds').html(obj.s);
                            var proGressWidth = (alltime - obj.a) / alltime * 100 + '%';
                            $('.times').find('.progress-top').css('width', proGressWidth)
                        }
                    });
                }
            }

            //拼团
            if (data.goodsType == 'group') {
                $('.price big').html(currentStandard.group_price);
                $('.group-btns-singlebuy b').html(currentStandard.price);
            }

            //商品详情信息
            var $goodsDetails = $('<div>' + (data.intro || '') + '</div>');
            goodsDetails.find('.goods-details-content').append($goodsDetails);
            var videoArr = data.video || [];
            if (videoArr.length > 0) {
                $(window).on('scroll', function () {
                    goodsDetails.find('.goods-details-content').find('.yq-detail-video-xyuzskjdj').each(function (index, item) {
                        if (($(window).scrollTop() + $(window).height() > $(item).offset().top) && ($(item).html() == '')) {
                            var height = $(item).css('height');
                            height = base.utils.px2rem(498);
                            $(item).css({'height': height});
                            var videoHtml = $(videoArr[index]);
                            videoHtml.css({'width': '100%', 'height': height});
                            // console.log(videoArr)
                            // console.log(videoHtml)
                            $(item).append(videoHtml);
                            // $(item).attr('class', '');
                        }
                    })
                });

                // function isArea(el,index){
                //     var mT = el.offset().top;
                //     var mh = el.height();  //自身高度
                //     // return ($(window).scrollTop() > mT-mh) && ($(window).scrollTop() < mT+mh)
                //     // return ($(window).scrollTop() > mT-mh)
                //     // console.log(index + '----' + $(window).scrollTop() + '----' +  (mT-mh))
                //     // ($(window).scrollTop()>($('#item').offset().top+$('#item').outerHeight()))||(($(window).scrollTop()+$(window).height())<$('#item').offset().top)
                //     var xx= ($(window).scrollTop() + $(window).height()) > mT
                //     console.log(index + '--' + xx);
                //     return true
                // }
            }
            resetSize()
        }
    });

    //领券
    goodsInfo.on('tap', '.tickets', function () {
        if (isPc) {
            dialogSecondary.dialogPrompt1({content: '请在手机中扫码查看'});
            return false;
        }
        require.async(['js/modules/dialog/dialog-get-coupons'], function (DialogGetCoupons) {
            // var DialogGetCoupons = require('js/modules/dialog/dialog-get-coupons.js');
            new DialogGetCoupons();
        });
    });

    //促销
    goodsInfo.on('tap', '.promotion', function () {
        if (isPc) {
            dialogSecondary.dialogPrompt1({content: '请在手机中扫码查看'});
            return false;
        }
        var $promotionContent = $('<div class="dialog-promotion"></div>');
        var $this = $(this);
        require.async(['js/common/plug/dialog'], function (Dialog) {
            new Dialog.Dialog({
                showHeader: true,
                showBtn: false,
                headerTxt: '查看促销活动',
                customContent: true,
                content: $promotionContent.html('<ul class="content">' + $this.find('.content').html() + '</ul>'),
                style: {
                    position: 'bottom',
                    borderRadius: .1,
                    width: '100%'
                }
            });
        });
    });

    //门店信息
    var $muiltStore = document.querySelector('.js-store');
    if ($muiltStore) {
        $.ajax({
            type: "get",
            url: "assist.php?act=getMuiltStore",
            async: true,
            dataType: 'json',
            success: function (v) {
                v = v || {};
                if (v.res == 'succ') {
                    $('.js-store').find('.js-store-link').prop('href',v.data.store_delivery.store_url);
                    $('.js-store').find('.js-store-name').html(v.data.store_delivery.store_name);
                    $('.js-store-msg').removeClass('none').find('i').html(v.data.distance+'km');
                    if (v.data.store_delivery.store_phone != '') {
                        $('.js-store').find('.phone').removeClass('none').prop('href', 'tel:' + v.data.store_delivery.store_phone);
                    }
                }
            }
        });
        if(location.href.indexOf('tiaomendian')!= -1){  //如果是选门店过来的
            document.body.scrollTop = $('#mendian').offset().top;
        }
    }

    //评论
    var goCommentsRequest = true;  //只进行一次请求开关
    var commentsOffOn = true;	//防止滑动太快请求多次
    function commentsAjax() {
        goCommentsRequest && $.ajax({
            type: "get",
            url: "assist.php?act=getComment&goods_id=" + goodsId,
            async: true,
            dataType: 'json',
            success: function (v) {
                v = v || {};
                if (v.res == 'succ') {
                    goCommentsRequest = false;
                    var datas = v.data;
                    $('body').find('.product-comments-header span b').html(datas.length);
                    if (datas.length > 0) {
                        $('.product-comments-header i').removeClass('none');
                        for (let i = 0; i < datas.length; i++) {
                            var ajaxData = datas[i];
                            var showContentImg = false;
                            if (ajaxData.images[i] != '') {
                                showContentImg = true;
                            }
                            var dom = new CommentList({ajaxData: ajaxData, showContentImg: showContentImg}).parentDom;
                            $('.goods-comments').append($(dom));
                            if (i < 3) {	//信息页只显示三条评论
                                $('.product-comments').append($(dom));
                            }
                        }
                        //点击更多评论
                        $('.product-comments-header i').on('click', function () {
                            detailsHeader.find('.details-tabs li a').removeClass('active');
                            $('.details-tabs .comments a').addClass('active');
                            goodsComments.removeClass('none');
                            goodsInfo.addClass('none');
                            document.body.scrollTop = 0;
                        });
                    }
                }
            },
            complete: function () {
                commentsOffOn = true;
            }
        });
    }

    window.onscroll = function () {
        var bodyScrollTop = $('body').scrollTop();
        var windowHeight = $(window).height();
        var commentsOffsetTop = $('.product-comments').offset().top;
        if (windowHeight + bodyScrollTop >= commentsOffsetTop) {
            commentsOffOn && commentsAjax();
            commentsOffOn = false;
        }
        //详情和商品切换
        var detailsOffsetTop = $('.goods-details').offset().top;
        var detailsActive = detailsTabs.find('.product-details a').hasClass('active');
        var productActive = detailsTabs.find('.product-info a').hasClass('active');
        if (detailsActive || productActive) {
            if (bodyScrollTop > detailsOffsetTop - 50) {
                if (!detailsActive) {
                    detailsHeader.find('.details-tabs li a').removeClass('active');
                    detailsTabs.find('.product-details a').addClass('active');
                }
            } else {
                if (!productActive) {
                    detailsHeader.find('.details-tabs li a').removeClass('active');
                    detailsTabs.find('.product-info a').addClass('active');
                }
            }
        }
    };

    //点击评论
    $('.comments').on('tap', function () {
        commentsAjax()
    });

    //收藏按钮(底部按钮)
    $('.js-collect').on('touchend', function (event) {
        if (isPc) {
            dialogSecondary.dialogPrompt1({content: '预览模式暂不支持收藏<br/>请在手机中扫码操作'});
            return false;
        }
        var _this = $(this);
        var $hasCollect = $(this).find('span').hasClass('has-collect') ? true : false;
        if (!$hasCollect) {//收藏
            $.ajax({
                type: 'post',
                url: 'index.php?ctl=member&act=doFavorite',
                data: {
                    goods_id: goodsId
                },
                dataType: 'json',
                success: function (res) {
                    if (res.res) {//操作成功
                        _this.find('span').addClass('has-collect');
                        $hasCollect = true;

                        detailsTabs.find('.js-my b').removeClass('none');
                        detailsMine.find('.js-dian-favorites b').removeClass('none');

                        dialogSecondary.dialogPrompt1({content: '已收藏'});

                    } else {
                        if (!res.mid) {
                            window.location.href = "index.php?passport-login.html";
                        }
                        dialogSecondary.dialogPrompt1({content: res.msg})
                    }
                }
            });
        } else {//取消收藏
            $.ajax({
                type: 'post',
                url: 'index.php?ctl=member&act=unFavorite',
                data: {
                    goods_id: goodsId
                },
                dataType: 'json',
                success: function (res) {
                    if (res.res) {//操作成功
                        _this.find('span').removeClass('has-collect');
                        dialogSecondary.dialogPrompt1({
                            content: '取消收藏'
                        });
                        $hasCollect = false;
                    } else {
                        dialogSecondary.dialogPrompt1({
                            content: res.msg
                        })
                    }
                }
            });
        }
        event.preventDefault();
    });

    //我要送礼跳过来
    if (window.location.hash.substring(1) == 'gifts') {
        require.async(['js/modules/product-select-standard'], function (ProductSelectStandard) {
            new ProductSelectStandard({goods_id: goodsId, showSendGift: true, showHowToGiftTip: true});
        });
    }

    //立即购买，加入购物车，送礼，选择规格,马上抢
    $('.select-standard,.btns-gifts,.btns-cart,.btns-buynow,.rush-now,.group-btns-onekey,.group-btns-singlebuy,.group-btns-join').on('tap', function (event) {
        if (isPc) {
            dialogSecondary.dialogPrompt1({
                content: '预览模式暂不支持购买<br/>请在手机中扫码操作'
            });
            return false;
        }
        var showSendGift = false, showHowToGiftTip = false, showJoinCart = false,groupSingleBuy = false, showBuyNow = true;
        if ($(this).hasClass('btns-gifts')) {
            showSendGift = true;
            showHowToGiftTip = true;
            showBuyNow = false;
        }
        if ($(this).hasClass('select-standard')) {
            showJoinCart = true;
            if (($('.rush-now').length > 0) || ($('.group-btns-singlebuy').length > 0)) {
                showJoinCart = false;
            }
        }
        if ($(this).hasClass('btns-cart')) {
            showJoinCart = true;
            showBuyNow = false;
        }
        if ($(this).hasClass('group-btns-singlebuy')) {//团购单独购买
            groupSingleBuy = true;
        }
        require.async(['js/modules/product-select-standard'], function (ProductSelectStandard) {
            new ProductSelectStandard({
                goods_id: goodsId,
                defaultData: detailsData,
                // act_id: actId,
                joinGroupId: joinGroupId,   //页面上定义的
                showBuyNow: showBuyNow,
                showJoinCart: showJoinCart,
                showSendGift: showSendGift,
                showHowToGiftTip: showHowToGiftTip,
                groupSingleBuy: groupSingleBuy
            });
        });
        event.preventDefault();
    });

    //修改详情页详情里面的内容
    function resetSize() {
        if ($('.ios').length > 0) {
            (function () {
                var metaEl = document.querySelectorAll('meta[name="viewport"]');
                var scale = metaEl[metaEl.length - 1].getAttribute('content').match(/initial\-scale=([\d\.]+)/)[1];
                var dpr = Math.ceil(1 / scale);
                //var dpr = $('html').data('dpr')||1;
                var arr = $('.goods-details-content *').not('img');
                var arr2 = [];
                $.each(arr, function (i, item) {
                    var oldSize = window.getComputedStyle(item, null).fontSize.replace('px', '');
                    var lineHeight = window.getComputedStyle(item, null).lineHeight.replace('px', '');
                    arr2.push({oldSize: oldSize, lineHeight: lineHeight});
                });
                $.each(arr, function (i, item) {
                    $(item).css({'font-size': (arr2[i].oldSize * dpr + 'px')});
                    if (arr2[i].lineHeight != 'normal') {
                        $(item).css({'line-height': (arr2[i].lineHeight * dpr + 'px')});
                    }
                });
            })();
        }
    }

    //店铺认证
    // $('.page-store-renzheng').on('click', function () {
    //     require.async(['js/modules/dialog/dialog-renzheng'], function (Renzheng) {
    //         new Renzheng();
    //     });
    // });

    require('js/common/plug/lazy_load_last')();

    //公用的东西
    base.statistics();//统计
    auxiliary.customService();//客服
    auxiliary.wxAbout();//微信相关
    auxiliary.performance();//页面性能统计
    if ($muiltStore) {
        auxiliary.positioning();
    }//地理位置
    module.exports.init = function () {
    };//初始化(留之无用，弃之报错)
});