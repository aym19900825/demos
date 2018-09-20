var obj = {
	name: 'aym'
};
var age = 27;

Object.defineProperty(obj,'age',{
	enumerable: true,
	configurable: false,
	get(){
		return age;
	},
	set(newVal){
		console.log("我改变了", age+'->'+newVal);
		age = newVal;
	}
});