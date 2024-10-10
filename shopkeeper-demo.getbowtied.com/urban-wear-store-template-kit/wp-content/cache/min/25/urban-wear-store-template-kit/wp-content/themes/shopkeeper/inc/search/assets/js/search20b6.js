(function(factory){"use strict";if(typeof define==='function'&&define.amd){define(['jquery'],factory)}else if(typeof exports==='object'&&typeof require==='function'){factory(require('jquery'))}else{factory(jQuery)}}(function($){'use strict';var utils=(function(){return{escapeRegExChars:function(value){return value.replace(/[|\\{}()[\]^$+*?.]/g,"\\$&")},createNode:function(containerClass){var div=document.createElement('div');div.className=containerClass;div.style.display='none';return div}}}()),keys={ESC:27,TAB:9,RETURN:13,LEFT:37,UP:38,RIGHT:39,DOWN:40};function Autocomplete(el,options){var noop=$.noop,that=this,defaults={ajaxSettings:{},autoSelectFirst:!1,appendTo:document.body,serviceUrl:null,lookup:null,onSelect:null,onMouseOver:null,onMouseLeave:null,width:'100%',minChars:1,maxHeight:1000,deferRequestBy:0,params:{},delimiter:null,zIndex:9999,type:'GET',noCache:!1,is_rtl:!1,onSearchStart:noop,onSearchComplete:noop,onSearchError:noop,preserveInput:!1,wrapperaClass:'search-wrapp',containerClass:'search-suggestions-wrapp',preloaderClass:'search-preloader',closeTrigger:'search-close',tabDisabled:!1,dataType:'text',currentRequest:null,triggerSelectOnValidInput:!0,preventBadQueries:!0,lookupFilter:function(suggestion,originalQuery,queryLowerCase){return suggestion.value.toLowerCase().indexOf(queryLowerCase)!==-1},paramName:'query',transformResult:function(response){return typeof response==='string'?JSON.parse(response):response},showNoSuggestionNotice:!1,noSuggestionNotice:'No results',orientation:'bottom'};that.element=el;that.el=$(el);that.suggestions=[];that.badQueries=[];that.selectedIndex=-1;that.currentValue=that.element.value;that.intervalId=0;that.cachedResponse={};that.detailsRequestsSent=[];that.onChangeInterval=null;that.onChange=null;that.isLocal=!1;that.suggestionsContainer=null;that.detailsContainer=null;that.noSuggestionsContainer=null;that.options=$.extend({},defaults,options);that.classes={selected:'search-suggestion-selected',suggestion:'search-suggestion'};that.hint=null;that.hintValue='';that.selection=null;that.initialize();that.setOptions(options)}
Autocomplete.utils=utils;$.Autocomplete=Autocomplete;Autocomplete.prototype={killerFn:null,initialize:function(){var that=this,suggestionSelector='.'+that.classes.suggestion,selected=that.classes.selected,options=that.options,container,closeTrigger='.'+options.closeTrigger;that.killerFn=function(e){if($(e.target).closest('.'+that.options.containerClass).length===0){that.killSuggestions();that.disableKillerFn()}};that.suggestionsContainer=Autocomplete.utils.createNode(options.containerClass);container=$(that.suggestionsContainer);container.appendTo(that.el.closest('.'+options.wrapperaClass));if(options.width!=='auto'){container.width(options.width)}
container.on('mouseover.autocomplete',suggestionSelector,function(){that.onMouseOver($(this).data('index'));that.activate($(this).data('index'))});container.on('mouseout.autocomplete',function(){});$(document).on('click.autocomplete',closeTrigger,function(e){that.killerFn(e);that.clear(e);$(this).removeClass(options.closeTrigger);that.el.val('').focus()});container.on('click.autocomplete',suggestionSelector,function(){that.select($(this).data('index'));return!1});that.el.on('keydown.autocomplete',function(e){that.onKeyPress(e)});that.el.on('keyup.autocomplete',function(e){that.onKeyUp(e)});that.el.on('change.autocomplete',function(e){that.onKeyUp(e)});that.el.on('input.autocomplete',function(e){that.onKeyUp(e)})},onFocus:function(){var that=this;if(that.el.val().length>=that.options.minChars){that.onValueChange()}},onBlur:function(){this.enableKillerFn()},abortAjax:function(){var that=this;if(that.currentRequest){that.currentRequest.abort();that.currentRequest=null}},setOptions:function(suppliedOptions){var that=this,options=that.options;$.extend(options,suppliedOptions);that.isLocal=Array.isArray(options.lookup);if(that.isLocal){options.lookup=that.verifySuggestionsFormat(options.lookup)}
options.orientation=that.validateOrientation(options.orientation,'bottom');that.options.onSearchComplete=function(){that.preloader('hide',$('.'+options.preloaderClass),options.closeTrigger)}},clearCache:function(){this.cachedResponse={};this.badQueries=[]},clear:function(){this.clearCache();this.currentValue='';this.suggestions=[]},disable:function(){var that=this;that.disabled=!0;clearInterval(that.onChangeInterval);that.abortAjax()},enable:function(){this.disabled=!1},enableKillerFn:function(){var that=this;$(document).on('click.autocomplete',that.killerFn)},disableKillerFn:function(){var that=this;$(document).off('click.autocomplete',that.killerFn)},killSuggestions:function(){var that=this,containerParent=$(that.suggestionsContainer).parent();that.stopKillSuggestions();that.intervalId=window.setInterval(function(){if(that.visible){if(!that.options.preserveInput){that.el.val(that.currentValue)}
that.hide()}
that.stopKillSuggestions()},50)},stopKillSuggestions:function(){window.clearInterval(this.intervalId)},isCursorAtEnd:function(){var that=this,valLength=that.el.val().length,selectionStart=that.element.selectionStart,range;if(typeof selectionStart==='number'){return selectionStart===valLength}
if(document.selection){range=document.selection.createRange();range.moveStart('character',-valLength);return valLength===range.text.length}
return!0},onKeyPress:function(e){var that=this;if(!that.disabled&&!that.visible&&e.which===keys.DOWN&&that.currentValue){that.suggest();return}
if(that.disabled||!that.visible){return}
switch(e.which){case keys.ESC:that.el.val(that.currentValue);that.hide();break;case keys.RIGHT:if(that.hint&&that.options.onHint&&that.isCursorAtEnd()){that.selectHint();break}
return;case keys.TAB:if(that.hint&&that.options.onHint){that.selectHint();return}
if(that.selectedIndex===-1){that.hide();return}
that.select(that.selectedIndex);if(that.options.tabDisabled===!1){return}
break;case keys.RETURN:if(that.selectedIndex===-1){that.hide();return}
that.select(that.selectedIndex);break;case keys.UP:that.moveUp();break;case keys.DOWN:that.moveDown();break;default:return}
e.stopImmediatePropagation();e.preventDefault()},onKeyUp:function(e){var that=this;if(that.disabled){return}
switch(e.which){case keys.UP:case keys.DOWN:return}
clearInterval(that.onChangeInterval);if(that.currentValue!==that.el.val()){that.findBestHint();if(that.options.deferRequestBy>0){that.onChangeInterval=setInterval(function(){that.onValueChange()},that.options.deferRequestBy)}else{that.onValueChange()}}},onValueChange:function(){var that=this,options=that.options,value=that.el.val(),query=that.getQuery(value);if(that.selection&&that.currentValue!==query){that.selection=null;(options.onInvalidateSelection||$.noop).call(that.element)}
clearInterval(that.onChangeInterval);that.currentValue=value;that.selectedIndex=-1;if(options.triggerSelectOnValidInput&&that.isExactMatch(query)){that.select(0);return}
if(query.length<options.minChars){$('.'+that.options.closeTrigger).removeClass(that.options.closeTrigger);that.hide()}else{that.getSuggestions(query)}},isExactMatch:function(query){var suggestions=this.suggestions;return(suggestions.length===1&&suggestions[0].value.toLowerCase()===query.toLowerCase())},getQuery:function(value){var delimiter=this.options.delimiter,parts;if(!delimiter){return value}
parts=value.split(delimiter);return $.trim(parts[parts.length-1])},getSuggestionsLocal:function(query){var that=this,options=that.options,queryLowerCase=query.toLowerCase(),filter=options.lookupFilter,limit=parseInt(options.lookupLimit,10),data;data={suggestions:$.grep(options.lookup,function(suggestion){return filter(suggestion,query,queryLowerCase)})};if(limit&&data.suggestions.length>limit){data.suggestions=data.suggestions.slice(0,limit)}
return data},getSuggestions:function(q){var response,that=this,container=$(that.suggestionsContainer),options=that.options,serviceUrl=options.serviceUrl,params,cacheKey,ajaxSettings;options.params[options.paramName]=q;params=options.ignoreParams?null:options.params;that.preloader('show',$('.'+options.preloaderClass),'search-inner-preloader',container);if(options.onSearchStart.call(that.element,options.params)===!1){return}
if($.isFunction(options.lookup)){options.lookup(q,function(data){that.suggestions=data.suggestions;that.suggest();options.onSearchComplete.call(that.element,q,data.suggestions)});return}
if(that.isLocal){response=that.getSuggestionsLocal(q)}else{if($.isFunction(serviceUrl)){serviceUrl=serviceUrl.call(that.element,q)}
cacheKey=serviceUrl+'?'+$.param(params||{});response=that.cachedResponse[cacheKey]}
if(response&&Array.isArray(response.suggestions)){that.suggestions=response.suggestions;that.suggest();options.onSearchComplete.call(that.element,q,response.suggestions)}else if(!that.isBadQuery(q)){that.abortAjax();ajaxSettings={url:serviceUrl,data:params,type:options.type,dataType:options.dataType};$.extend(ajaxSettings,options.ajaxSettings);that.currentRequest=$.ajax(ajaxSettings).done(function(data){var result;that.currentRequest=null;result=options.transformResult(data,q);if(typeof result.suggestions!=='undefined'){that.processResponse(result,q,cacheKey)}
options.onSearchComplete.call(that.element,q,result.suggestions)}).fail(function(jqXHR,textStatus,errorThrown){options.onSearchError.call(that.element,q,jqXHR,textStatus,errorThrown)})}else{options.onSearchComplete.call(that.element,q,[])}},isBadQuery:function(q){if(!this.options.preventBadQueries){return!1}
var badQueries=this.badQueries,i=badQueries.length;while(i--){if(q.indexOf(badQueries[i])===0){return!0}}
return!1},hide:function(){var that=this,container=$(that.suggestionsContainer),containerParent=$(that.suggestionsContainer).parent();if($.isFunction(that.options.onHide)&&that.visible){that.options.onHide.call(that.element,container)}
that.visible=!1;that.selectedIndex=-1;clearInterval(that.onChangeInterval);$(that.suggestionsContainer).hide();$(that.detailsContainer).hide();containerParent.removeClass('search-open');that.signalHint(null)},suggest:function(){if(this.suggestions==''){if(this.options.showNoSuggestionNotice){this.noSuggestions()}else{this.hide()}
return}
var that=this,options=that.options,groupBy=options.groupBy,formatResult=options.formatResult,value=that.getQuery(that.currentValue),className=that.classes.suggestion,classSelected=that.classes.selected,container=$(that.suggestionsContainer),noSuggestionsContainer=$(that.noSuggestionsContainer),beforeRender=options.beforeRender,category,formatGroup=function(suggestion,index){var currentCategory=suggestion.data[groupBy];if(category===currentCategory){return''}
category=currentCategory;return'<div class="autocomplete-group"><strong>'+category+'</strong></div>'};if(options.triggerSelectOnValidInput&&that.isExactMatch(value)){that.select(0);return}
this.adjustContainerWidth();noSuggestionsContainer.detach();container.html(that.suggestions);if($.isFunction(beforeRender)){beforeRender.call(that.element,container,that.suggestions)}
container.show();container.parent().addClass('search-open');if(options.autoSelectFirst){that.selectedIndex=0;container.scrollTop(0);container.children('.'+className).first().addClass(classSelected)}
that.visible=!0;that.findBestHint()},noSuggestions:function(){},adjustContainerWidth:function(){var that=this,options=that.options,width,container=$(that.suggestionsContainer).parent(),containerSugg=$(that.suggestionsContainer),maxWidth=550;if(options.width==='auto'){width=that.el.outerWidth();containerSugg.css('width',width+'px')}},findBestHint:function(){var that=this,value=that.el.val().toLowerCase(),bestMatch=null;if(!value){return}
that.signalHint(bestMatch)},signalHint:function(suggestion){var hintValue='',that=this;if(suggestion){hintValue=that.currentValue+suggestion.value.substr(that.currentValue.length)}
if(that.hintValue!==hintValue){that.hintValue=hintValue;that.hint=suggestion;(this.options.onHint||$.noop)(hintValue)}},preloader:function(action,container,cssClass,suggestionsContainer){var html,defaultClass='search-preloader-wrapp',cssClasses=cssClass==null?defaultClass:defaultClass+' '+cssClass;if(search.show_preloader!=1||container.length==0){return}
if(action==='hide'){$(defaultClass).remove();container.html('');if(!($('.search-suggestions-wrapp .products')[0])){}}
if(action==='show'){suggestionsContainer.html('');container.html('<div class="'+cssClasses+'"></div>')}},validateOrientation:function(orientation,fallback){orientation=$.trim(orientation||'').toLowerCase();if($.inArray(orientation,['auto','bottom','top'])===-1){orientation=fallback}
return orientation},processResponse:function(result,originalQuery,cacheKey){var that=this,options=that.options;if(!options.noCache){that.cachedResponse[cacheKey]=result;if(options.preventBadQueries&&!result.suggestions.length){that.badQueries.push(originalQuery)}}
if(originalQuery!==that.getQuery(that.currentValue)){return}
that.suggestions=result.suggestions;that.suggest()},activate:function(index){var that=this,activeItem,selected=that.classes.selected,container=$(that.suggestionsContainer),children=container.find('.'+that.classes.suggestion);container.find('.'+selected).removeClass(selected);that.selectedIndex=index;if(that.selectedIndex!==-1&&children.length>that.selectedIndex){activeItem=children.get(that.selectedIndex);$(activeItem).addClass(selected);return activeItem}
return null},selectHint:function(){var that=this,i=$.inArray(that.hint,that.suggestions);that.select(i)},select:function(i){var that=this;that.hide();that.onSelect(i);that.disableKillerFn()},moveUp:function(){var that=this;if(that.selectedIndex===-1){return}
if(that.selectedIndex===0){$(that.suggestionsContainer).children().first().removeClass(that.classes.selected);that.selectedIndex=-1;that.el.val(that.currentValue);that.findBestHint();return}
that.adjustScroll(that.selectedIndex-1)},moveDown:function(){var that=this;if(that.selectedIndex===(that.suggestions.length-1)){return}
that.adjustScroll(that.selectedIndex+1)},adjustScroll:function(index){var that=this,activeItem=that.activate(index);if(!activeItem){return}
var offsetTop,upperBound,lowerBound,heightDelta=$(activeItem).outerHeight();offsetTop=activeItem.offsetTop;upperBound=$(that.suggestionsContainer).scrollTop();lowerBound=upperBound+that.options.maxHeight-heightDelta;if(offsetTop<upperBound){$(that.suggestionsContainer).scrollTop(offsetTop)}else if(offsetTop>lowerBound){$(that.suggestionsContainer).scrollTop(offsetTop-that.options.maxHeight+heightDelta)}
if(!that.options.preserveInput){that.el.val(that.getValue(that.suggestions[index].value))}
that.signalHint(null)},onSelect:function(index){var that=this,onSelectCallback=that.options.onSelect,suggestion=that.suggestions[index];that.currentValue=that.getValue(suggestion.value);if(that.currentValue!==that.el.val()&&!that.options.preserveInput){that.el.val(that.currentValue)}
if(suggestion.id!=-1){window.location.href=suggestion.url}
that.signalHint(null);that.suggestions=[];that.selection=suggestion;if($.isFunction(onSelectCallback)){onSelectCallback.call(that.element,suggestion)}},onMouseOver:function(index){var that=this,onMouseOverCallback=that.options.onMouseOver,suggestion=that.suggestions[index];if($.isFunction(onMouseOverCallback)){onMouseOverCallback.call(that.element,suggestion)}},onMouseLeave:function(index){var that=this,onMouseLeaveCallback=that.options.onMouseLeave,suggestion=that.suggestions[index];if($.isFunction(onMouseLeaveCallback)){onMouseLeaveCallback.call(that.element,suggestion)}},getValue:function(value){var that=this,delimiter=that.options.delimiter,currentValue,parts;if(!delimiter){return value}
currentValue=that.currentValue;parts=currentValue.split(delimiter);if(parts.length===1){return value}
return currentValue.substr(0,currentValue.length-parts[parts.length-1].length)+value},dispose:function(){var that=this;that.el.off('.autocomplete').removeData('autocomplete');that.disableKillerFn();$(that.suggestionsContainer).remove()}};$.fn.dgwtWcasAutocomplete=function(options,args){var dataKey='autocomplete';if(!arguments.length){return this.first().data(dataKey)}
return this.each(function(){var inputElement=$(this),instance=inputElement.data(dataKey);if(typeof options==='string'){if(instance&&typeof instance[options]==='function'){instance[options](args)}}else{if(instance&&instance.dispose){instance.dispose()}
instance=new Autocomplete(this,options);inputElement.data(dataKey,instance)}})};(function(){$(function(){"use strict";$('.search-input').dgwtWcasAutocomplete({minChars:3,autoSelectFirst:!1,triggerSelectOnValidInput:!1,serviceUrl:search.ajax_search_endpoint,paramName:'search_keyword',})})}())}))