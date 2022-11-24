/* eslint-disable no-irregular-whitespace */
module.exports={
    ifEquals:(value1,value2,options)=>{
    
    
        if(value1==value2){
           
           return options.fn();
        }else{
            
            return options.inverse();   
    }
   },
};