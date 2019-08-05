class Dep{
    constructor(){
        this.listenFunc=[]
    }
    addFunc(obj){
        this.listenFunc.push(obj)
    }
    changeWatch(){
        this.listenFunc.forEach(val=>{
            val.sendVal()
        })
    }
}
Dep.target=null
const dep=new Dep()
class Watcher{
    constructor(data,key,cbk){
        //每一次实例watcher时，都会吧当前实例赋值给Dep的target静态属性
        Dep.target=this
        this.data=data
        this.key=key
        this.cbk=cbk
        this.init()
    }
    init(){
        //获取到最新的data数据的key值
        this.value=util.getData(this.data,this.key)
        Dep.target=null
        return this.value
    }
    sendVal(){
        //将最新值返回给页面
        let newVal=this.init()
        this.cbk(newVal)
    }
}
class ObJieliu{
    constructor(data){
        if (!data || typeof data !== 'object') {
            return;
        }
        this.data=data;
        this.init()
    }
    init(){
        Object.keys(this.data).forEach(val=>{
            this.objServer(this.data,val,this.data[val])
        })
    }
    objServer(obj,key,value){
        //递归实现每个属性的数据劫持
        new ObJieliu(obj[key])
        Object.defineProperty(obj,key,{
            //获取属性方法
            get(){
                if(Dep.target){
                    //给dep实例属性添加watcher监听事件
                    dep.addFunc(Dep.target)
                }
                return value
            },
            set(newValue){
                if(value===newValue){
                    return;
                }
                value=newValue
                //触发每一个listenFunc里面的watch
                dep.changeWatch()
                //新数据的产生也要添加劫持
                new ObJieliu(value)
            }
        })
    }
}
const util={
    setInpvalue(node,key,data,type){
        node[type]=this.getData(data,key)
    },
    getData(data,key){
        if(key.indexOf('.')>-1){
            key.split('.').forEach(val=>{
                data=data[val]
            })
            return data
        }else{
            return data[key]
        } 
    },
    //input事件法神那个后，改变对应的属性值
    changeInpValue(data,key,newVal){
        if(key.indexOf('.')>-1){
            let arr=key.split('.')
            for(let i=0;i<arr.length-1;i++){
                data=data[arr[i]]
            }
            data[arr[arr.length-1]]=newVal
        }else{
            data[key]=newVal
        }
    }
}
class Mvvm{
    constructor({el,data}){
        //获取解析的最外层标签
        this.$el=document.getElementById(el)
        //vue中的data数据
        this.data=data
        this.init()
        this.initDom()
    }
    init(){
        //当前数据添加劫持
        Object.keys(this.data).forEach(val=>{
            this.objJieliu(this,val,this.data[val])
        })
        //给数据集合的每一个属性添加劫持
        new ObJieliu(this.data)
    }
    objJieliu(obj,key,value){
        Object.defineProperty(obj,key,{
            get(){
                return value
            },
            //设置最新数据值，只有设置了才会出现
            set(newValue){
                value=newValue
            }
        })
    }
    initDom(){
       //创建一个方法将其他元素放入碎片流，为了避免操作DOM而到时浏览器重绘，操作完成后将碎片添加进去，可以一并操作了
        this.newFargument=this.createFargument()
        //创建一个方法解析碎片流中的其他标签元素及属性
        this.complier(this.newFargument)
        //将DOM碎片中的标配铅元素添加到最外层的标签中显示在页面上
        this.$el.appendChild(this.newFargument)
    }
    createFargument(){
         //创建 DOM碎片（碎流） 不会在页面上显示出来
        let fargument=document.createDocumentFragment()
        let firstChild;
        while(firstChild=this.$el.firstChild){
            fargument.appendChild(firstChild)
        }
        return fargument
    }
    complier(node){
        //判断及标签元素的类型
        if(node.nodeType===1){
            //在元素标签上通过Attributes来获取到所有属性名等信息
            let attributes=node.attributes;
            [...attributes].forEach(val=>{
                //找到对应的属性例如v-model
                if(val.nodeName=='v-model'){
                    //node--当前标签元素 val.nodeValue--v-modol属性对应的value值，data中对应的value值 
                    //console.log(val.nodeName,val.nodeValue)
                    node.addEventListener('input',(e)=>{
                        let changeValue=e.target.value
                        util.changeInpValue(this.data,val.nodeValue,changeValue)
                    })
                    //input最新数据
                    util.setInpvalue(node,val.nodeValue,this.data,'value')
                }
            })
        }else if(node.nodeType===3){
            //文本处理提取内容
            if(node.textContent.indexOf('{{')>-1){
                let context=node.textContent.split('{{')[1].split('}}')[0]
                //给文本设置最新的data数据
                util.setInpvalue(node,context,this.data,'textContent')
                //监听data数据
                context && new Watcher(this.data,context,(newVal)=>{
                    //最新数据
                    node.textContent=newVal
                })
            }
        }
        //通过递归的形式保证每一集的文本都能获取到并解析
        if(node.childNodes && node.childNodes.length>0){
           [...node.childNodes].forEach(item=>{
                this.complier(item)
            })
        }
    }
}