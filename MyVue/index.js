class Vue{
    constructor(options = {}){
        //数据劫持，模板解析
        //实现双向数据绑定的方式----数据劫持+发布订阅者模式
        this.$el = document.querySelector(options.el);
        let data = this.data = options.data; 
        
        this.methods = options.methods // 事件方法
        this.watcherTask = {}; // 需要监听的任务列表
        
        this.observer(data); // ,数据代理和劫持监听所有数据
        this.compile(this.$el); // 解析dom
    }


    //同样是使用Object.defineProperty来监听数据，初始化需要订阅的数据。
    // 把需要订阅的数据到push到watcherTask里，等到时候需要更新的时候就可以批量更新数据了。
    observer(data){
        let that = this
        Object.keys(data).forEach(key=>{
            let value = data[key]
            this.watcherTask[key] = []
            Object.defineProperty(data,key,{
                configurable: false,
                enumerable: true,
                get(){
                    return value
                },
                //👇下面就是； 遍历订阅池，批量更新视图。
                set(newValue){
                    if(newValue !== value){
                        value = newValue
                        that.watcherTask[key].forEach(task => {
                            task.update()
                        })
                    }
                }
            })
        })
    }
    compile(el){
        //获得所有的子节点
        var nodes = el.childNodes;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            // 当前元素是文本节点
            if(node.nodeType === 3){
                var text = node.textContent.trim();
                if (!text) continue;
                this.compileText(node,'textContent')                
            }else if(node.nodeType === 1){  
                if(node.childNodes.length > 0){
                    this.compile(node)
                }
                if(node.hasAttribute('v-model') && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')){
                    node.addEventListener('input',(()=>{
                        let attrVal = node.getAttribute('v-model')
                        this.watcherTask[attrVal].push(new Watcher(node,this,attrVal,'value'))
                        node.removeAttribute('v-model')
                        return () => {
                            this.data[attrVal] = node.value
                        }
                    })())
                }

                // 发布订阅
                if(node.hasAttribute('v-html')){
                    let attrVal = node.getAttribute('v-html');
                    // 只需要把当前需要订阅的数据push到watcherTask里面，
                    //然后到时候在设置值的时候就可以批量更新了，实现双向数据绑定
                    this.watcherTask[attrVal].push(new Watcher(node,this,attrVal,'innerHTML'))
                    node.removeAttribute('v-html')
                }
                this.compileText(node,'innerHTML')
                if(node.hasAttribute('@click')){
                    let attrVal = node.getAttribute('@click')
                    node.removeAttribute('@click')
                    node.addEventListener('click',e => {
                        this.methods[attrVal] && this.methods[attrVal].bind(this)()
                    })
                }
            }
        }
    }
    compileText(node,type){
        let reg = /\{\{(.*)\}\}/g, txt = node.textContent;
        if(reg.test(txt)){
            node.textContent = txt.replace(reg,(matched,value)=>{
                let tpl = this.watcherTask[value] || []
                tpl.push(new Watcher(node,this,value,type))

                return value.split('.').reduce((val, key) => {
                    return this.data[key]; 
                }, this.$el);
            })
        }
    }
}

class Watcher{
    constructor(el,vm,value,type){
        this.el = el;
        this.vm = vm;
        this.value = value;
        this.type = type;
        this.update();
    }
    update(){
        this.el[this.type] = this.vm.data[this.value];
    }
}