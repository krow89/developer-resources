/*  
    I know... Exists a famous library called JQuery (and some others)
    but i'm learning and i dont want add
    "weight" to page :) 
*/
var DOM= {
    _apply: function(el, f){
        if(! (el instanceof NodeList)){
            f(el)
        }else{
            var l= el.length
            for(var i=0;i<l;i++){
                f(el[i])
            }
        }
    },
    attr: function(el, name, value){ if(value) el[name]=value; return el[name]},
    style: function(el, name, value){ if(value) el.style[name]=value; return el.style[name]},
    find: function(selector,multi_res,from){
        var trg= from || document
        if(multi_res) return trg.querySelectorAll(selector)
        else return trg.querySelector(selector)
    },
    edit_attrs: function(el,attrs){
        DOM._apply(el, function(el){
            for(var a in attrs){
                if(attrs.hasOwnProperty(a)){
                    el[a]= attrs[a]
                }
            }
        });
    },
    edit_styles: function(el,styles_map){
        DOM._apply(el, function(el){
            for(var s in styles_map){
                if(styles_map.hasOwnProperty(s)){
                    var old= el.style
                    el.style[s]= styles_map[s]
                }
            }
        });
    },
    edit: function(el,attrs_map,styles_map){
        if(attrs_map) DOM.edit_attrs(el,attrs_map)
        if(styles_map) DOM.edit_styles(el,styles_map)
    }
}

/*  */
var StringUtils= {
    _selector_expr: /\{(\d+|\w+)\}/g,
    
    format: function(fmt, obj){
        var patt= this._selector_expr
        var ret= ""
        var last_index= fmt.search(patt)
        var end_index= 0
        while(last_index != -1){
            end_index= fmt.indexOf("}",last_index+1)
            var fmt_prop= fmt.slice(last_index+1,end_index)
            ret+= fmt.slice(0,last_index)+obj[fmt_prop]
            fmt= fmt.slice(end_index+1)
            last_index= fmt.search(patt)
        }
        return ret+fmt
    }
}

/* Page UI */
var UI= {
    _sidenav:null, _cnt:null, _header:null, _menu_btn:null,
    _idata: null,
    
    _fix_position:function(){
        var sidenav_width= DOM.attr(this._sidenav, "offsetWidth")
        var header_height= DOM.attr(this._header, "offsetHeight")
        var menu_btn_height= DOM.attr(this._menu_btn,"offsetHeight")
        // extra space for scrollbar
        var extra_nav_w= sidenav_width + 20
        this._sidenav.style.width= extra_nav_w+"px"
        this._sidenav.style.paddingTop= this._cnt.style.paddingTop= (header_height+10)+"px"
        DOM.style(this._sidenav, "left", "-"+extra_nav_w+"px")
        DOM.style(this._menu_btn, "top", menu_btn_height/2+"px")
    },
    
    open_sidenav_section: function(el){
        el.classList.toggle('sidenav_section_title_opened')
        var subsection_el= DOM.find(".sidenav_subsection",false,el.parentNode)
        subsection_el.classList.toggle("sidenav_sub_opened")
        
    },
    
    hide_modal: function(){
      DOM.edit_styles( DOM.find("#modals_full"), {
          opacity: "0",
          "z-index": "0"
      })
    },
    
    _load_nav: function(){
        var nav_template= '\
        <li class="sidenav_section">\
            <span class="sidenav_section_title" onclick="UI.open_sidenav_section(this)">{section_title}</span>\
            <ul class="sidenav_subsection">\
            {subsection_html}\
            </ul>\
        </li>'
        var nav_sub_template= '\
        <li>\
            <a href="#sub_{subsection_id}">{subsection_title}</a>\
        </li>'
        var sections= this._idata.get_sections(Data)
        var html= sections.map(function(section){
            var section_data= this._idata.get_section_data(section)
            var subsections= this._idata.get_subsections(section)
            var subsections_code= subsections.map(function(subs){
                return StringUtils.format(nav_sub_template,{
                    subsection_id: subs.id,
                    subsection_title: subs.title
                })
            },this)
            var subsections_code= subsections_code.join("")
            return StringUtils.format(nav_template, {
                section_title: section_data.title,
                subsection_html: subsections_code
            })
        }, this).join("")
        this._sidenav.innerHTML= html
    },
    
    _fmt_str: function(str, fmt){
        var cur_start_i= 0, curr_end_i=0;
    },
    
    _generate_dom_links: function(links){
        if(!links) return ""
        var html="<ul class='sub_links_list'>"
        var size= links.length
        var curr_item= null, title=null, url=null, desc=null
        var item_template= '\
        <li class="sub_links_item">\
            <a href="{url}" target="_blank">\
                <div class="title">{title}</div>\
            </a>\
            <div class="description">{desc}</div>\
            <span>{url}</span>\
        </li>'
        html+= links.map( function(clink){
            return StringUtils.format(item_template, {
                title:clink.title,
                desc:clink.desc,
                url:clink.url})
        }, this).join("")
        return html+"</ul>"
    },
    
    _generate_dom_subs: function(subsections){
        var html= '\
        <div id="sub_{sub_name}" class="subsection">\
            <div class="title">{title}</div>\
            <div class="description">{desc}</div>\
            {subs_code}\
        </div>'
        var subsection_code= subsections.map(function(subsection){
            var sub_data= this._idata.get_subsection_data(subsection)
            return StringUtils.format(html,{
                title: sub_data.title,
                desc: sub_data.desc,
                subs_code: this._generate_dom_links(sub_data.links),
                sub_name: sub_data.id
            })
        }, this).join("")
        return subsection_code
    },
    
    _generate_dom_section: function(section){
        var subsections= this._idata.get_subsections(section)
        var subsection_code= section ? this._generate_dom_subs(subsections) : ""
        var section_data= this._idata.get_section_data(section)
        return StringUtils.format('\
        <div class="section">\
            <div class="title">{title}</div>\
            {subsection_code}\
        </div>', {
            title: section_data.title,
            subsection_code: subsection_code
        })
    },
    
    animate_sidenav: function(){
        var sw= DOM.attr(this._sidenav, "offsetWidth")
        if(DOM.style(this._sidenav, "left")!="0px"){
            DOM.style(this._sidenav, "left","0")
            DOM.style(this._cnt, "left", sw+"px")
        }else{
            DOM.style(this._cnt, "left", "0")
            DOM.style(this._sidenav, "left", "-"+sw+"px")
        }
    },
    
    setup: function(idata){
        this._sidenav= DOM.find("#sidenav")
        this._cnt= DOM.find("#contents")
        this._header= DOM.find("#header")
        this._menu_btn= DOM.find("#menu_button")
        this._idata= idata
        this._load_nav()
        this._fix_position()
        var html= ""
        var sections= idata.get_sections(Data)
        var html= sections.map( function(section){
            return this._generate_dom_section(section)
        },this).join("")
        this._cnt.innerHTML += html
        document.body.style.visibility='visible'
    },
    
}

window.onload= function(){
    UI.setup(DataHandler)
}
